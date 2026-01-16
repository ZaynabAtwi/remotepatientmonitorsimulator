import StatusBadge from "./StatusBadge";
import { Alert, Patient } from "../api/types";

type Props = {
  patients: Patient[];
  alerts: Alert[];
  selectedId?: string | null;
  onSelect: (patientId: string) => void;
};

function derivePatientStatus(patientId: string, alerts: Alert[]) {
  const patientAlerts = alerts.filter((alert) => alert.patient_id === patientId && !alert.acknowledged);
  if (patientAlerts.some((alert) => alert.severity === "critical")) return "critical";
  if (patientAlerts.some((alert) => alert.severity === "warning")) return "warning";
  return "normal";
}

export default function PatientList({ patients, alerts, selectedId, onSelect }: Props) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700">Active Patients</h2>
        <span className="text-xs text-slate-500">{patients.length} total</span>
      </div>
      <div className="space-y-3">
        {patients.map((patient) => {
          const status = derivePatientStatus(patient.id, alerts);
          return (
            <button
              key={patient.id}
              onClick={() => onSelect(patient.id)}
              className={`w-full text-left rounded-lg border px-3 py-2 transition ${
                selectedId === patient.id ? "border-primary-500 bg-primary-50" : "border-slate-200 hover:border-primary-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{patient.name}</div>
                  <div className="text-xs text-slate-500">
                    {patient.age}y · {patient.sex} · {patient.diagnoses.join(", ")}
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
