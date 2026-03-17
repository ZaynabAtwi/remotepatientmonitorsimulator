import { PatientRiskSnapshot, getRiskLabel } from "../../lib/clinicalIntelligence";

type Props = {
  patients: PatientRiskSnapshot[];
  selectedPatientId?: string | null;
  onSelect: (id: string) => void;
};

export default function MobilePatientSwitcher({ patients, selectedPatientId, onSelect }: Props) {
  return (
    <div className="overflow-x-auto pb-1 md:hidden">
      <div className="flex min-w-max gap-2">
        {patients.map((entry) => (
          <button
            type="button"
            key={entry.patient.id}
            onClick={() => onSelect(entry.patient.id)}
            className="rounded-xl border px-3 py-2 text-left"
            style={{
              borderColor: selectedPatientId === entry.patient.id ? "var(--color-accent)" : "var(--color-border)",
              backgroundColor: selectedPatientId === entry.patient.id ? "rgba(59, 130, 246, 0.12)" : "var(--color-surface)",
            }}
          >
            <p className="text-xs font-semibold">{entry.patient.name}</p>
            <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              {getRiskLabel(entry.riskLevel)} · {Math.round(entry.riskScore)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
