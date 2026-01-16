export type Patient = {
  id: string;
  name: string;
  age: number;
  sex: string;
  height_cm: number;
  weight_kg: number;
  diagnoses: string[];
  risk_profile: string;
  assigned_clinician?: string | null;
  monitoring_status: string;
  baseline_profile?: Record<string, unknown>;
};

export type Vital = {
  id?: number;
  patient_id: string;
  timestamp: string;
  metric: string;
  value: number;
  unit: string;
  normal_low?: number | null;
  normal_high?: number | null;
  status: string;
  source: string;
};

export type Alert = {
  id: string;
  patient_id: string;
  metric: string;
  severity: string;
  trigger_rule: string;
  timestamp: string;
  acknowledged: boolean;
  clinician_notes?: string | null;
  acknowledged_at?: string | null;
};

export type AnalyticsSummary = {
  patient_id: string;
  risk_score: number;
  trend: string;
  metrics: Record<string, { avg: number; min: number; max: number }>;
  anomaly_score?: number | null;
};

export type AuthToken = {
  access_token: string;
  token_type: string;
  role: string;
};
