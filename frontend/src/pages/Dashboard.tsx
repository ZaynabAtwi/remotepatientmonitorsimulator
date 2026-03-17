import { useEffect, useMemo, useRef, useState } from "react";
import { api, createWebSocket, tokenStorage } from "../api/client";
import { Alert, AnalyticsSummary, Patient, Vital } from "../api/types";
import ActionPanel from "../components/clinical/ActionPanel";
import ClinicalStatusBanner from "../components/clinical/ClinicalStatusBanner";
import CurrentVitalsPanel from "../components/clinical/CurrentVitalsPanel";
import MobilePatientSwitcher from "../components/clinical/MobilePatientSwitcher";
import PatientRiskQueue from "../components/clinical/PatientRiskQueue";
import ResponsiveHeader from "../components/clinical/ResponsiveHeader";
import SmartInsightsPanel from "../components/clinical/SmartInsightsPanel";
import TrendTimeline from "../components/clinical/TrendTimeline";
import { InterventionEntry, getMockClinicalData } from "../data/mockClinicalData";
import { buildInsights, buildPatientRiskSnapshot, summarizeCurrentVitals } from "../lib/clinicalIntelligence";

type DataMode = "live" | "demo";

const severityRank: Record<string, number> = { critical: 3, warning: 2, info: 1 };

function preferredTheme(): "light" | "dark" {
  const stored = localStorage.getItem("rpm_theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function Dashboard() {
  const mockDataRef = useRef(getMockClinicalData());
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [vitalsByPatient, setVitalsByPatient] = useState<Record<string, Vital[]>>({});
  const [analyticsByPatient, setAnalyticsByPatient] = useState<Record<string, AnalyticsSummary>>({});
  const [interventionLogByPatient, setInterventionLogByPatient] = useState<Record<string, InterventionEntry[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [dataMode, setDataMode] = useState<DataMode>("live");
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isPatientLoading, setIsPatientLoading] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(preferredTheme());
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("rpm_theme", theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      try {
        if (!tokenStorage.get()) {
          const token = await api.login("clinician1", "demo123");
          tokenStorage.set(token.access_token);
        }
        const [patientList, allAlerts] = await Promise.all([api.getPatients(), api.getAlerts()]);
        if (cancelled) return;
        const analyticsResults = await Promise.allSettled(patientList.map((patient) => api.getAnalytics(patient.id)));
        const analyticsMap = analyticsResults.reduce<Record<string, AnalyticsSummary>>((acc, result) => {
          if (result.status === "fulfilled") {
            acc[result.value.patient_id] = result.value;
          }
          return acc;
        }, {});
        setPatients(patientList);
        setAlerts(allAlerts.filter((alert) => !alert.acknowledged));
        setAnalyticsByPatient(analyticsMap);
        setInterventionLogByPatient({});
        setDataMode("live");
        setSelectedPatientId((current) => current ?? patientList[0]?.id ?? null);
      } catch {
        const fallback = mockDataRef.current;
        if (cancelled) return;
        setPatients(fallback.patients);
        setAlerts(fallback.alerts);
        setVitalsByPatient(fallback.vitalsByPatient);
        setAnalyticsByPatient(fallback.analyticsByPatient);
        setInterventionLogByPatient(fallback.interventionLogByPatient);
        setSelectedPatientId((current) => current ?? fallback.patients[0]?.id ?? null);
        setDataMode("demo");
        setError("Backend unavailable. Running in demo clinical intelligence mode.");
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;
    let cancelled = false;
    async function loadSelectedPatient() {
      setIsPatientLoading(true);
      if (dataMode === "demo") {
        const fallbackVitals = mockDataRef.current.vitalsByPatient[selectedPatientId] ?? [];
        setVitalsByPatient((prev) => ({ ...prev, [selectedPatientId]: fallbackVitals }));
        setIsPatientLoading(false);
        return;
      }
      try {
        const [vitals, analytics] = await Promise.all([
          api.getVitals(selectedPatientId),
          api.getAnalytics(selectedPatientId),
        ]);
        if (cancelled) return;
        setVitalsByPatient((prev) => ({ ...prev, [selectedPatientId]: vitals }));
        setAnalyticsByPatient((prev) => ({ ...prev, [selectedPatientId]: analytics }));
      } catch {
        if (cancelled) return;
        const fallbackVitals = mockDataRef.current.vitalsByPatient[selectedPatientId] ?? [];
        if (fallbackVitals.length) {
          setVitalsByPatient((prev) => ({ ...prev, [selectedPatientId]: fallbackVitals }));
        }
        setError("Live vitals refresh failed. Showing latest available data.");
      } finally {
        if (!cancelled) {
          setIsPatientLoading(false);
        }
      }
    }
    loadSelectedPatient();
    return () => {
      cancelled = true;
    };
  }, [selectedPatientId, dataMode]);

  useEffect(() => {
    if (dataMode !== "live" || !tokenStorage.get()) return;
    const socket = createWebSocket((message) => {
      if (typeof message !== "object" || message === null) return;
      const event = message as { type: string; payload: unknown };
      if (event.type === "vital") {
        const vital = event.payload as Vital;
        setVitalsByPatient((prev) => ({
          ...prev,
          [vital.patient_id]: [vital, ...(prev[vital.patient_id] ?? [])].slice(0, 1000),
        }));
      }
      if (event.type === "alert") {
        const alert = event.payload as Alert;
        setAlerts((prev) => {
          if (alert.acknowledged) {
            return prev.filter((item) => item.id !== alert.id);
          }
          if (prev.some((item) => item.id === alert.id)) return prev;
          return [alert, ...prev];
        });
      }
    });
    return () => socket.close();
  }, [dataMode]);

  useEffect(() => {
    if (dataMode !== "live" || !selectedPatientId) return;
    const interval = window.setInterval(async () => {
      try {
        const analytics = await api.getAnalytics(selectedPatientId);
        setAnalyticsByPatient((prev) => ({ ...prev, [selectedPatientId]: analytics }));
      } catch {
        // Keep last known analytics state if polling fails.
      }
    }, 30000);
    return () => window.clearInterval(interval);
  }, [dataMode, selectedPatientId]);

  const activeAlerts = useMemo(() => alerts.filter((alert) => !alert.acknowledged), [alerts]);

  const queueSnapshots = useMemo(() => {
    const snapshots = patients.map((patient) =>
      buildPatientRiskSnapshot({
        patient,
        vitals: vitalsByPatient[patient.id] ?? [],
        alerts: activeAlerts.filter((alert) => alert.patient_id === patient.id),
        analytics: analyticsByPatient[patient.id] ?? null,
      })
    );
    return snapshots.sort((a, b) => {
      if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
      if (b.activeAlerts !== a.activeAlerts) return b.activeAlerts - a.activeAlerts;
      return b.deteriorationScore - a.deteriorationScore;
    });
  }, [patients, vitalsByPatient, activeAlerts, analyticsByPatient]);

  useEffect(() => {
    if (!selectedPatientId && queueSnapshots[0]) {
      setSelectedPatientId(queueSnapshots[0].patient.id);
    }
  }, [queueSnapshots, selectedPatientId]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? null,
    [patients, selectedPatientId]
  );

  const selectedSnapshot = useMemo(
    () => queueSnapshots.find((entry) => entry.patient.id === selectedPatientId),
    [queueSnapshots, selectedPatientId]
  );
  const selectedVitals = selectedPatientId ? vitalsByPatient[selectedPatientId] ?? [] : [];
  const selectedAlerts = useMemo(
    () => activeAlerts.filter((alert) => alert.patient_id === selectedPatientId),
    [activeAlerts, selectedPatientId]
  );
  const currentVitals = useMemo(() => summarizeCurrentVitals(selectedVitals), [selectedVitals]);
  const insights = useMemo(
    () => (selectedSnapshot ? buildInsights(selectedSnapshot, selectedVitals, selectedAlerts) : []),
    [selectedSnapshot, selectedVitals, selectedAlerts]
  );
  const selectedInterventions = useMemo(
    () => (selectedPatientId ? interventionLogByPatient[selectedPatientId] ?? [] : []),
    [interventionLogByPatient, selectedPatientId]
  );

  function appendInterventionLog(action: string, detail: string) {
    if (!selectedPatientId) return;
    const entry: InterventionEntry = {
      id: `NEW-${selectedPatientId}-${Date.now()}`,
      patientId: selectedPatientId,
      action,
      detail,
      actor: "Care Team",
      timestamp: new Date().toISOString(),
    };
    setInterventionLogByPatient((prev) => ({
      ...prev,
      [selectedPatientId]: [entry, ...(prev[selectedPatientId] ?? [])].slice(0, 12),
    }));
  }

  async function handleAcknowledgeTopAlert() {
    if (!selectedPatientId) return;
    const nextAlert = [...selectedAlerts].sort(
      (a, b) => (severityRank[b.severity] ?? 0) - (severityRank[a.severity] ?? 0)
    )[0];
    if (!nextAlert) {
      appendInterventionLog("Alert Review", "No active alerts required acknowledgment.");
      return;
    }
    try {
      if (dataMode === "live") {
        await api.acknowledgeAlert(nextAlert.id, "Reviewed in AI clinical dashboard.");
      }
      setAlerts((prev) => prev.filter((alert) => alert.id !== nextAlert.id));
      appendInterventionLog("Alert Acknowledged", `${nextAlert.metric.replace("_", " ")} alert acknowledged.`);
    } catch {
      setError("Failed to acknowledge alert. Please retry.");
    }
  }

  function handleAction(action: "contact" | "note" | "escalate") {
    if (action === "contact") {
      appendInterventionLog("Patient Contact", "Patient outreach initiated through RPM communication workflow.");
      return;
    }
    if (action === "note") {
      appendInterventionLog("Clinical Note", "Added structured care-team note to longitudinal record.");
      return;
    }
    appendInterventionLog("Escalation", "Case escalated to supervising clinician for immediate review.");
  }

  return (
    <div className="min-h-screen">
      <ResponsiveHeader
        patientCount={patients.length}
        selectedPatientName={selectedPatient?.name}
        dataMode={dataMode}
        onOpenQueue={() => setIsQueueOpen(true)}
        isQueueButtonVisible
        theme={theme}
        onThemeToggle={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
      />
      <main className="mx-auto max-w-[1700px] px-4 py-4 lg:px-6 lg:py-6">
        {error && (
          <div
            className="mb-4 rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: "rgba(220, 106, 106, 0.35)", backgroundColor: "rgba(220, 106, 106, 0.08)", color: "var(--color-critical)" }}
          >
            {error}
          </div>
        )}
        <MobilePatientSwitcher
          patients={queueSnapshots}
          selectedPatientId={selectedPatientId}
          onSelect={(id) => setSelectedPatientId(id)}
        />
        <div className="mt-3 grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_360px]">
          <aside className="hidden md:block xl:sticky xl:top-20 xl:h-[calc(100vh-6rem)]">
            <PatientRiskQueue
              snapshots={queueSnapshots}
              selectedPatientId={selectedPatientId}
              onSelect={(id) => setSelectedPatientId(id)}
              loading={isBootstrapping}
            />
          </aside>
          <section className="space-y-4">
            <ClinicalStatusBanner snapshot={selectedSnapshot} loading={isBootstrapping} />
            <CurrentVitalsPanel vitals={currentVitals} loading={isPatientLoading || isBootstrapping} />
            <SmartInsightsPanel insights={insights} loading={isPatientLoading || isBootstrapping} />
            <TrendTimeline
              vitals={selectedVitals}
              alerts={selectedAlerts}
              riskScore={selectedSnapshot?.riskScore ?? 0}
              loading={isPatientLoading || isBootstrapping}
            />
            <div className="xl:hidden">
              <ActionPanel
                patient={selectedPatient}
                alerts={selectedAlerts}
                interventionLog={selectedInterventions}
                onAcknowledge={handleAcknowledgeTopAlert}
                onAction={handleAction}
              />
            </div>
          </section>
          <aside className="hidden xl:block xl:sticky xl:top-20 xl:h-[calc(100vh-6rem)]">
            <ActionPanel
              patient={selectedPatient}
              alerts={selectedAlerts}
              interventionLog={selectedInterventions}
              onAcknowledge={handleAcknowledgeTopAlert}
              onAction={handleAction}
            />
          </aside>
        </div>
      </main>
      {selectedPatient && (
        <div
          className="fixed bottom-0 left-0 right-0 z-20 border-t p-3 md:hidden"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
        >
          <div className="mx-auto flex max-w-xl gap-2">
            <button
              type="button"
              className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold"
              style={{ backgroundColor: "var(--color-accent)", color: "#fff" }}
              onClick={handleAcknowledgeTopAlert}
            >
              Acknowledge
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold"
              style={{ backgroundColor: "var(--color-surface-muted)" }}
              onClick={() => handleAction("contact")}
            >
              Contact
            </button>
            <button
              type="button"
              className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold"
              style={{ backgroundColor: "rgba(220, 106, 106, 0.12)", color: "var(--color-critical)" }}
              onClick={() => handleAction("escalate")}
            >
              Escalate
            </button>
          </div>
        </div>
      )}
      {isQueueOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/35"
            onClick={() => setIsQueueOpen(false)}
            aria-label="Close patient queue"
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-[360px] p-3">
            <PatientRiskQueue
              snapshots={queueSnapshots}
              selectedPatientId={selectedPatientId}
              onSelect={(id) => {
                setSelectedPatientId(id);
                setIsQueueOpen(false);
              }}
              loading={isBootstrapping}
            />
          </div>
        </div>
      )}
    </div>
  );
}
