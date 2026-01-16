import { AnalyticsSummary, Patient } from "../api/types";
import StatusBadge from "./StatusBadge";

type Props = {
  patient?: Patient | null;
  analytics?: AnalyticsSummary | null;
};

export default function PatientDetail({ patient, analytics }: Props) {
  if (!patient) {
    return (
      <div className="card p-6 text-sm text-slate-500">
        Select a patient to view detailed profile and history.
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{patient.name}</h2>
          <div className="text-xs text-slate-500">
            {patient.age}y · {patient.sex} · {patient.height_cm} cm · {patient.weight_kg} kg
          </div>
        </div>
        <StatusBadge status={patient.monitoring_status} label={patient.monitoring_status} />
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-600 mb-1">Diagnoses</div>
        <div className="text-sm text-slate-700">{patient.diagnoses.join(", ")}</div>
      </div>
      <div>
        <div className="text-xs font-semibold text-slate-600 mb-1">Assigned Clinician</div>
        <div className="text-sm text-slate-700">{patient.assigned_clinician || "Unassigned"}</div>
      </div>
      {analytics && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-xs text-slate-500">Risk Score</div>
            <div className="text-xl font-semibold text-slate-900">{analytics.risk_score.toFixed(2)}</div>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-xs text-slate-500">Trend</div>
            <div className="text-xl font-semibold text-slate-900">{analytics.trend}</div>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-xs text-slate-500">Anomaly Score</div>
            <div className="text-xl font-semibold text-slate-900">
              {(analytics.anomaly_score ?? 0).toFixed(2)}
            </div>
          </div>
        </div>
      )}
      <div>
        <div className="text-xs font-semibold text-slate-600 mb-1">Clinical Notes</div>
        <textarea
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Document observations, interventions, or follow-up plans."
        />
      </div>
    </div>
  );
}
