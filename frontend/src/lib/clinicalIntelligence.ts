import { Alert, AnalyticsSummary, Patient, Vital } from "../api/types";

export type RiskLevel = "critical" | "warning" | "stable" | "info";
export type TrendDirection = "up" | "down" | "stable";
export type InsightCategory = "trend" | "risk" | "next_step" | "explainability";

export type ClinicalInsight = {
  id: string;
  category: InsightCategory;
  statement: string;
  confidence: number;
};

export type PatientRiskSnapshot = {
  patient: Patient;
  riskScore: number;
  riskLevel: RiskLevel;
  activeAlerts: number;
  trendDirection: TrendDirection;
  deteriorationScore: number;
  diagnosisTags: string[];
  summary: string;
  suggestedNextStep: string;
  confidence: number;
};

export type CurrentVital = {
  key: string;
  label: string;
  valueText: string;
  state: RiskLevel;
  thresholdHint: string;
  timestamp: string;
};

const RISK_PROFILE_BASE: Record<string, number> = {
  high: 72,
  medium: 55,
  moderate: 55,
  low: 34,
};

const METRIC_LABELS: Record<string, string> = {
  heart_rate: "Heart Rate",
  bp_systolic: "Blood Pressure",
  spo2: "SpO2",
  respiratory_rate: "Respiratory Rate",
  temperature: "Temperature",
  activity: "Activity",
};

const NORMAL_RANGES: Record<string, { low: number; high: number }> = {
  heart_rate: { low: 60, high: 100 },
  bp_systolic: { low: 90, high: 130 },
  bp_diastolic: { low: 60, high: 85 },
  spo2: { low: 92, high: 100 },
  respiratory_rate: { low: 12, high: 20 },
  temperature: { low: 36.1, high: 37.5 },
  activity: { low: 2000, high: 9000 },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function toFixedMaybe(value: number, digits = 0) {
  return digits === 0 ? Math.round(value).toString() : value.toFixed(digits);
}

function metricSlope(values: number[]) {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  return (last - first) / Math.max(first || 1, 1);
}

function severityWeight(severity: string) {
  if (severity === "critical") return 18;
  if (severity === "warning") return 10;
  return 4;
}

function deriveTrend(vitals: Vital[]) {
  const relevant = vitals.filter((v) =>
    ["bp_systolic", "heart_rate", "respiratory_rate", "spo2"].includes(v.metric)
  );
  const byMetric: Record<string, number[]> = {};
  relevant.forEach((vital) => {
    if (!byMetric[vital.metric]) byMetric[vital.metric] = [];
    byMetric[vital.metric].push(vital.value);
  });
  const slopes = Object.values(byMetric).map((series) => metricSlope(series.slice(-8)));
  if (!slopes.length) return "stable" as TrendDirection;
  const weighted =
    slopes.reduce((acc, slope) => acc + slope, 0) / Math.max(slopes.length, 1);
  if (weighted > 0.08) return "up";
  if (weighted < -0.08) return "down";
  return "stable";
}

function deriveVitalState(metric: string, value: number): RiskLevel {
  const range = NORMAL_RANGES[metric];
  if (!range) return "info";
  const span = range.high - range.low;
  if (value < range.low - span * 0.5 || value > range.high + span * 0.5) return "critical";
  if (value < range.low || value > range.high) return "warning";
  return "stable";
}

export function deriveRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "critical";
  if (score >= 60) return "warning";
  if (score >= 40) return "info";
  return "stable";
}

function riskNarrative(level: RiskLevel, trend: TrendDirection) {
  if (level === "critical") return "High instability detected. Escalation readiness advised.";
  if (level === "warning" && trend === "up") {
    return "Clinical drift noted; increased monitoring cadence recommended.";
  }
  if (level === "warning") return "Moderate concern present with manageable variability.";
  if (trend === "down") return "Trend appears to be stabilizing against baseline.";
  return "No immediate instability pattern identified.";
}

function nextStep(level: RiskLevel, trend: TrendDirection, activeAlerts: number) {
  if (level === "critical") return "Escalate to on-call clinician and contact patient now.";
  if (activeAlerts >= 2) return "Acknowledge alerts and schedule immediate reassessment call.";
  if (trend === "up") return "Repeat vitals in 30-60 minutes and review medication adherence.";
  return "Continue routine monitoring; no urgent intervention required.";
}

export function buildPatientRiskSnapshot(params: {
  patient: Patient;
  vitals: Vital[];
  alerts: Alert[];
  analytics?: AnalyticsSummary | null;
}): PatientRiskSnapshot {
  const { patient, vitals, alerts, analytics } = params;
  const activeAlerts = alerts.filter((alert) => !alert.acknowledged);
  const alertPenalty = activeAlerts.reduce((acc, alert) => acc + severityWeight(alert.severity), 0);
  const base = analytics
    ? clamp(analytics.risk_score * 100, 0, 100)
    : RISK_PROFILE_BASE[patient.risk_profile?.toLowerCase()] ?? 48;

  const latestByMetric = new Map<string, Vital>();
  vitals.forEach((vital) => {
    const previous = latestByMetric.get(vital.metric);
    if (!previous || previous.timestamp < vital.timestamp) {
      latestByMetric.set(vital.metric, vital);
    }
  });

  const vitalPenalty = Array.from(latestByMetric.values()).reduce((acc, vital) => {
    const state = deriveVitalState(vital.metric, vital.value);
    if (state === "critical") return acc + 12;
    if (state === "warning") return acc + 6;
    return acc;
  }, 0);

  const trendDirection = analytics?.trend
    ? analytics.trend.toLowerCase().includes("up")
      ? "up"
      : analytics.trend.toLowerCase().includes("down")
      ? "down"
      : "stable"
    : deriveTrend(vitals);
  const trendPenalty = trendDirection === "up" ? 8 : trendDirection === "down" ? -6 : 0;

  const score = clamp(base + alertPenalty + vitalPenalty + trendPenalty, 0, 100);
  const riskLevel = deriveRiskLevel(score);

  const deteriorationScore = clamp(
    Math.round(alertPenalty + vitalPenalty + (trendDirection === "up" ? 14 : 4)),
    0,
    100
  );

  return {
    patient,
    riskScore: score,
    riskLevel,
    activeAlerts: activeAlerts.length,
    trendDirection,
    deteriorationScore,
    diagnosisTags: patient.diagnoses.slice(0, 3),
    summary: riskNarrative(riskLevel, trendDirection),
    suggestedNextStep: nextStep(riskLevel, trendDirection, activeAlerts.length),
    confidence: clamp(0.62 + activeAlerts.length * 0.05 + (analytics ? 0.08 : 0), 0.55, 0.94),
  };
}

function insightCategoryTitle(category: InsightCategory) {
  if (category === "trend") return "Trend Insight";
  if (category === "risk") return "Risk Interpretation";
  if (category === "next_step") return "Suggested Next Step";
  return "Explainability";
}

export function getInsightCategoryTitle(category: InsightCategory) {
  return insightCategoryTitle(category);
}

export function buildInsights(
  snapshot: PatientRiskSnapshot,
  vitals: Vital[],
  alerts: Alert[]
): ClinicalInsight[] {
  const latestVitals = summarizeCurrentVitals(vitals);
  const bp = latestVitals.find((item) => item.key === "blood_pressure");
  const spo2 = latestVitals.find((item) => item.key === "spo2");

  const trendStatement =
    snapshot.trendDirection === "up"
      ? "Physiologic burden is trending upward over the recent monitoring window."
      : snapshot.trendDirection === "down"
      ? "Recent measurements suggest improving physiologic stability."
      : "Current trend remains broadly stable with mild expected variation.";

  const bpRisk =
    bp && bp.state !== "stable"
      ? "Blood pressure remains above individualized baseline, indicating possible early hypertension pattern."
      : "Hemodynamic profile remains close to expected baseline range.";

  const oxygenComment =
    spo2 && spo2.state === "warning"
      ? "SpO2 is drifting toward the lower threshold and should be rechecked."
      : "Oxygenation remains within acceptable target range.";

  const criticalAlert = alerts.find((alert) => alert.severity === "critical");
  const recommendation = criticalAlert
    ? "Acknowledge critical alert and initiate immediate outreach with escalation protocol."
    : snapshot.suggestedNextStep;

  return [
    {
      id: "trend",
      category: "trend",
      statement: trendStatement,
      confidence: snapshot.confidence - 0.05,
    },
    {
      id: "risk",
      category: "risk",
      statement: `${bpRisk} ${oxygenComment}`,
      confidence: snapshot.confidence,
    },
    {
      id: "next-step",
      category: "next_step",
      statement: recommendation,
      confidence: snapshot.confidence - 0.02,
    },
    {
      id: "explainability",
      category: "explainability",
      statement: `Signal combines vitals trend, alert severity, and baseline variance. Current model confidence ${Math.round(
        snapshot.confidence * 100
      )}%.`,
      confidence: snapshot.confidence - 0.03,
    },
  ];
}

function formatBloodPressure(systolic?: Vital, diastolic?: Vital) {
  if (!systolic && !diastolic) return null;
  const sys = systolic?.value ?? 0;
  const dia = diastolic?.value ?? 0;
  const state =
    deriveVitalState("bp_systolic", sys) === "critical" || deriveVitalState("bp_diastolic", dia) === "critical"
      ? "critical"
      : deriveVitalState("bp_systolic", sys) === "warning" || deriveVitalState("bp_diastolic", dia) === "warning"
      ? "warning"
      : "stable";
  const timestamp = systolic?.timestamp ?? diastolic?.timestamp ?? new Date().toISOString();
  return {
    key: "blood_pressure",
    label: METRIC_LABELS.bp_systolic,
    valueText: `${toFixedMaybe(sys)}/${toFixedMaybe(dia)} mmHg`,
    state,
    thresholdHint: "Target <130/85",
    timestamp,
  } as CurrentVital;
}

export function summarizeCurrentVitals(vitals: Vital[]): CurrentVital[] {
  const latestByMetric = new Map<string, Vital>();
  vitals.forEach((vital) => {
    const existing = latestByMetric.get(vital.metric);
    if (!existing || existing.timestamp < vital.timestamp) {
      latestByMetric.set(vital.metric, vital);
    }
  });

  const essentials = ["heart_rate", "spo2", "respiratory_rate", "temperature", "activity"];
  const standard = essentials
    .map((metric) => {
      const vital = latestByMetric.get(metric);
      if (!vital) return null;
      const decimals = metric === "temperature" ? 1 : 0;
      return {
        key: metric,
        label: METRIC_LABELS[metric] || metric,
        valueText: `${toFixedMaybe(vital.value, decimals)} ${vital.unit}`,
        state: deriveVitalState(metric, vital.value),
        thresholdHint: `Normal ${NORMAL_RANGES[metric]?.low ?? "-"}-${NORMAL_RANGES[metric]?.high ?? "-"}`,
        timestamp: vital.timestamp,
      } as CurrentVital;
    })
    .filter((item): item is CurrentVital => Boolean(item));

  const bloodPressure = formatBloodPressure(latestByMetric.get("bp_systolic"), latestByMetric.get("bp_diastolic"));
  const heartRate = standard.find((item) => item.key === "heart_rate");
  const remaining = standard.filter((item) => item.key !== "heart_rate");
  const ordered: CurrentVital[] = [];
  if (heartRate) ordered.push(heartRate);
  if (bloodPressure) ordered.push(bloodPressure);
  ordered.push(...remaining);
  return ordered;
}

export function getRiskLabel(level: RiskLevel) {
  if (level === "critical") return "Critical";
  if (level === "warning") return "Warning";
  if (level === "info") return "Moderate";
  return "Stable";
}

export function getTrendSymbol(direction: TrendDirection) {
  if (direction === "up") return "^";
  if (direction === "down") return "v";
  return "-";
}
