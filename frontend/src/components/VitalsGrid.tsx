import StatusBadge from "./StatusBadge";
import { Vital } from "../api/types";

type Props = {
  vitals: Vital[];
};

const METRIC_LABELS: Record<string, string> = {
  heart_rate: "Heart Rate",
  bp_systolic: "Blood Pressure (Sys)",
  bp_diastolic: "Blood Pressure (Dia)",
  spo2: "SpO₂",
  temperature: "Temperature",
  respiratory_rate: "Resp. Rate",
  blood_glucose: "Blood Glucose",
  activity: "Activity",
};

export default function VitalsGrid({ vitals }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {vitals.map((vital) => (
        <div key={`${vital.metric}-${vital.timestamp}`} className="card p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">{METRIC_LABELS[vital.metric] || vital.metric}</div>
            <StatusBadge status={vital.status} />
          </div>
          <div className="mt-2 text-2xl font-semibold text-slate-900">
            {vital.value} <span className="text-sm text-slate-500">{vital.unit}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Normal {vital.normal_low ?? "-"} - {vital.normal_high ?? "-"}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {new Date(vital.timestamp).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}
