import { useEffect, useMemo, useState } from "react";
import { api, createWebSocket, tokenStorage } from "../api/client";
import { Alert, AnalyticsSummary, Patient, Vital } from "../api/types";
import AlertsPanel from "../components/AlertsPanel";
import Header from "../components/Header";
import PatientDetail from "../components/PatientDetail";
import PatientList from "../components/PatientList";
import TrendChart from "../components/TrendChart";
import VitalsGrid from "../components/VitalsGrid";

const CHART_METRICS = ["heart_rate", "spo2", "bp_systolic", "respiratory_rate"];

export default function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  const latestVitals = useMemo(() => {
    const latestByMetric: Record<string, Vital> = {};
    vitals.forEach((vital) => {
      if (!latestByMetric[vital.metric] || vital.timestamp > latestByMetric[vital.metric].timestamp) {
        latestByMetric[vital.metric] = vital;
      }
    });
    return Object.values(latestByMetric);
  }, [vitals]);

  useEffect(() => {
    async function bootstrap() {
      try {
        if (!tokenStorage.get()) {
          const token = await api.login("clinician1", "demo123");
          tokenStorage.set(token.access_token);
        }
        const patientList = await api.getPatients();
        setPatients(patientList);
        if (patientList[0]) {
          setSelectedPatientId(patientList[0].id);
        }
        const alertList = await api.getAlerts();
        setAlerts(alertList.filter((alert) => !alert.acknowledged));
      } catch (err) {
        setError((err as Error).message);
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (!selectedPatientId) return;
    async function loadVitals() {
      try {
        const vitalsList = await api.getVitals(selectedPatientId);
        setVitals(vitalsList);
        const summary = await api.getAnalytics(selectedPatientId);
        setAnalytics(summary);
      } catch (err) {
        setError((err as Error).message);
      }
    }
    loadVitals();
  }, [selectedPatientId]);

  useEffect(() => {
    if (!selectedPatientId) return;
    const interval = window.setInterval(async () => {
      try {
        const summary = await api.getAnalytics(selectedPatientId);
        setAnalytics(summary);
      } catch {
        // keep last analytics if refresh fails
      }
    }, 30000);
    return () => window.clearInterval(interval);
  }, [selectedPatientId]);

  useEffect(() => {
    if (!tokenStorage.get()) return;
    const socket = createWebSocket((message) => {
      if (typeof message !== "object" || message === null) return;
      const event = message as { type: string; payload: any };
      if (event.type === "vital") {
        const vital = event.payload as Vital;
        if (vital.patient_id === selectedPatientId) {
          setVitals((prev) => [vital, ...prev].slice(0, 200));
        }
      }
      if (event.type === "alert") {
        const alert = event.payload as Alert;
        setAlerts((prev) => {
          if (alert.acknowledged) {
            return prev.filter((item) => item.id !== alert.id);
          }
          if (prev.find((item) => item.id === alert.id)) return prev;
          return [alert, ...prev];
        });
      }
    });
    return () => socket.close();
  }, [selectedPatientId]);

  async function handleAcknowledge(alertId: string) {
    try {
      await api.acknowledgeAlert(alertId, "Reviewed in dashboard.");
      const updated = await api.getAlerts(selectedPatientId || undefined);
      setAlerts(updated.filter((alert) => !alert.acknowledged));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] px-6 py-8 space-y-6">
        <Header />
        {error && <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">{error}</div>}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <PatientList
            patients={patients}
            alerts={alerts}
            selectedId={selectedPatientId}
            onSelect={setSelectedPatientId}
          />
          <div className="space-y-6">
            <VitalsGrid vitals={latestVitals} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {CHART_METRICS.map((metric) => (
                <TrendChart key={metric} vitals={vitals} metric={metric} />
              ))}
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
              <PatientDetail patient={selectedPatient} analytics={analytics} />
              <AlertsPanel alerts={alerts.filter((alert) => !alert.acknowledged)} onAcknowledge={handleAcknowledge} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
