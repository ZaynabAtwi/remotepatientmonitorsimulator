import { Alert, AnalyticsSummary, Patient, Vital } from "../api/types";
import { buildPatientRiskSnapshot } from "../lib/clinicalIntelligence";

export type InterventionEntry = {
  id: string;
  patientId: string;
  action: string;
  detail: string;
  actor: string;
  timestamp: string;
};

type Profile = {
  patient: Patient;
  baseline: {
    heart_rate: number;
    bp_systolic: number;
    bp_diastolic: number;
    spo2: number;
    respiratory_rate: number;
    temperature: number;
    activity: number;
  };
  trendBias: number;
};

const profiles: Profile[] = [
  {
    patient: {
      id: "P-1001",
      name: "Mina Haddad",
      age: 67,
      sex: "F",
      height_cm: 162,
      weight_kg: 72,
      diagnoses: ["Hypertension", "Heart Failure"],
      risk_profile: "high",
      assigned_clinician: "Dr. Patel",
      monitoring_status: "active",
      baseline_profile: {},
    },
    baseline: {
      heart_rate: 88,
      bp_systolic: 136,
      bp_diastolic: 84,
      spo2: 95,
      respiratory_rate: 18,
      temperature: 36.8,
      activity: 3200,
    },
    trendBias: 1.1,
  },
  {
    patient: {
      id: "P-1002",
      name: "Jared Collins",
      age: 58,
      sex: "M",
      height_cm: 178,
      weight_kg: 94,
      diagnoses: ["COPD", "Diabetes"],
      risk_profile: "moderate",
      assigned_clinician: "Nurse Alia",
      monitoring_status: "active",
      baseline_profile: {},
    },
    baseline: {
      heart_rate: 84,
      bp_systolic: 128,
      bp_diastolic: 82,
      spo2: 92,
      respiratory_rate: 20,
      temperature: 36.7,
      activity: 2800,
    },
    trendBias: 0.9,
  },
  {
    patient: {
      id: "P-1003",
      name: "Layla Hassan",
      age: 44,
      sex: "F",
      height_cm: 170,
      weight_kg: 68,
      diagnoses: ["Asthma"],
      risk_profile: "low",
      assigned_clinician: "Dr. Kim",
      monitoring_status: "active",
      baseline_profile: {},
    },
    baseline: {
      heart_rate: 74,
      bp_systolic: 118,
      bp_diastolic: 76,
      spo2: 96,
      respiratory_rate: 16,
      temperature: 36.6,
      activity: 6500,
    },
    trendBias: 0.2,
  },
  {
    patient: {
      id: "P-1004",
      name: "Omar Nasser",
      age: 73,
      sex: "M",
      height_cm: 172,
      weight_kg: 89,
      diagnoses: ["Atrial Fibrillation", "Hypertension"],
      risk_profile: "high",
      assigned_clinician: "Dr. Costa",
      monitoring_status: "active",
      baseline_profile: {},
    },
    baseline: {
      heart_rate: 96,
      bp_systolic: 142,
      bp_diastolic: 88,
      spo2: 94,
      respiratory_rate: 19,
      temperature: 36.9,
      activity: 2400,
    },
    trendBias: 1.3,
  },
  {
    patient: {
      id: "P-1005",
      name: "Elena Ross",
      age: 61,
      sex: "F",
      height_cm: 166,
      weight_kg: 81,
      diagnoses: ["Diabetes", "Heart Failure"],
      risk_profile: "moderate",
      assigned_clinician: "Nurse Ahmed",
      monitoring_status: "active",
      baseline_profile: {},
    },
    baseline: {
      heart_rate: 80,
      bp_systolic: 132,
      bp_diastolic: 82,
      spo2: 95,
      respiratory_rate: 17,
      temperature: 36.5,
      activity: 4200,
    },
    trendBias: 0.8,
  },
  {
    patient: {
      id: "P-1006",
      name: "Samir Boutros",
      age: 52,
      sex: "M",
      height_cm: 176,
      weight_kg: 77,
      diagnoses: ["Hypertension"],
      risk_profile: "low",
      assigned_clinician: "Dr. Patel",
      monitoring_status: "active",
      baseline_profile: {},
    },
    baseline: {
      heart_rate: 76,
      bp_systolic: 124,
      bp_diastolic: 78,
      spo2: 97,
      respiratory_rate: 15,
      temperature: 36.4,
      activity: 7300,
    },
    trendBias: 0.3,
  },
];

function round(value: number, precision = 0) {
  const scale = 10 ** precision;
  return Math.round(value * scale) / scale;
}

function statusForMetric(metric: string, value: number) {
  if (metric === "spo2") {
    if (value < 89) return "critical";
    if (value < 92) return "warning";
    return "normal";
  }
  if (metric === "bp_systolic") {
    if (value > 160) return "critical";
    if (value > 140) return "warning";
    return "normal";
  }
  if (metric === "heart_rate") {
    if (value > 120 || value < 45) return "critical";
    if (value > 100 || value < 55) return "warning";
    return "normal";
  }
  if (metric === "respiratory_rate") {
    if (value > 26 || value < 9) return "critical";
    if (value > 20 || value < 12) return "warning";
    return "normal";
  }
  if (metric === "temperature") {
    if (value >= 38.8 || value <= 35.2) return "critical";
    if (value >= 37.7 || value <= 35.8) return "warning";
    return "normal";
  }
  return "normal";
}

function buildVitalsForProfile(profile: Profile): Vital[] {
  const metrics: Array<keyof Profile["baseline"]> = [
    "heart_rate",
    "bp_systolic",
    "bp_diastolic",
    "spo2",
    "respiratory_rate",
    "temperature",
    "activity",
  ];
  const now = Date.now();
  const totalPoints = 84;
  const vitals: Vital[] = [];
  for (let i = 0; i < totalPoints; i += 1) {
    const timestamp = new Date(now - (totalPoints - i) * 2 * 60 * 60 * 1000).toISOString();
    metrics.forEach((metric, metricIndex) => {
      const baseline = profile.baseline[metric];
      const circadian = Math.sin(i / 4 + metricIndex) * (metric === "activity" ? 900 : 4);
      const drift = ((i - totalPoints * 0.6) / totalPoints) * profile.trendBias * (metric === "spo2" ? -0.7 : 1.9);
      const noise = Math.cos(i * 0.7 + metricIndex) * (metric === "temperature" ? 0.2 : 1.8);
      const value = baseline + circadian + drift + noise;
      vitals.push({
        patient_id: profile.patient.id,
        timestamp,
        metric,
        value: round(value, metric === "temperature" ? 1 : 0),
        unit:
          metric === "spo2"
            ? "%"
            : metric === "temperature"
            ? "°C"
            : metric === "respiratory_rate"
            ? "rpm"
            : metric === "activity"
            ? "steps"
            : metric.includes("bp")
            ? "mmHg"
            : "bpm",
        status: statusForMetric(metric, value),
        source: "simulated",
        normal_low: null,
        normal_high: null,
      });
    });
  }
  return vitals;
}

function toAlertSeverity(status: string): "critical" | "warning" | "info" {
  if (status === "critical") return "critical";
  if (status === "warning") return "warning";
  return "info";
}

function buildAlerts(vitalsByPatient: Record<string, Vital[]>) {
  const alerts: Alert[] = [];
  Object.entries(vitalsByPatient).forEach(([patientId, vitals]) => {
    const latestByMetric = new Map<string, Vital>();
    vitals.forEach((vital) => {
      const previous = latestByMetric.get(vital.metric);
      if (!previous || previous.timestamp < vital.timestamp) latestByMetric.set(vital.metric, vital);
    });
    latestByMetric.forEach((vital, metric) => {
      if (vital.status === "normal" || metric === "activity" || metric === "bp_diastolic") return;
      alerts.push({
        id: `AL-${patientId}-${metric}`,
        patient_id: patientId,
        metric,
        severity: toAlertSeverity(vital.status),
        trigger_rule: `${metric.replace("_", " ")} outside target range`,
        timestamp: vital.timestamp,
        acknowledged: false,
      });
    });
  });
  return alerts;
}

function buildAnalytics(
  patients: Patient[],
  vitalsByPatient: Record<string, Vital[]>,
  alerts: Alert[]
): Record<string, AnalyticsSummary> {
  return patients.reduce<Record<string, AnalyticsSummary>>((acc, patient) => {
    const patientVitals = vitalsByPatient[patient.id] ?? [];
    const patientAlerts = alerts.filter((alert) => alert.patient_id === patient.id);
    const snapshot = buildPatientRiskSnapshot({
      patient,
      vitals: patientVitals,
      alerts: patientAlerts,
      analytics: null,
    });
    acc[patient.id] = {
      patient_id: patient.id,
      risk_score: round(snapshot.riskScore / 100, 2),
      trend: snapshot.trendDirection,
      metrics: {},
      anomaly_score: round(snapshot.deteriorationScore / 100, 2),
    };
    return acc;
  }, {});
}

function buildInterventionLog(patientId: string): InterventionEntry[] {
  const now = Date.now();
  return [
    {
      id: `INT-${patientId}-1`,
      patientId,
      action: "Care Plan Review",
      detail: "Baseline medications verified and adherence reinforced.",
      actor: "Nurse Team",
      timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: `INT-${patientId}-2`,
      patientId,
      action: "Patient Outreach",
      detail: "Follow-up call completed; symptom check negative.",
      actor: "Care Coordinator",
      timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

const patients = profiles.map((profile) => profile.patient);
const vitalsByPatient = profiles.reduce<Record<string, Vital[]>>((acc, profile) => {
  acc[profile.patient.id] = buildVitalsForProfile(profile);
  return acc;
}, {});
const alerts = buildAlerts(vitalsByPatient);
const analyticsByPatient = buildAnalytics(patients, vitalsByPatient, alerts);
const interventionLogByPatient = patients.reduce<Record<string, InterventionEntry[]>>((acc, patient) => {
  acc[patient.id] = buildInterventionLog(patient.id);
  return acc;
}, {});

export function getMockClinicalData() {
  return {
    patients,
    vitalsByPatient,
    alerts,
    analyticsByPatient,
    interventionLogByPatient,
  };
}
