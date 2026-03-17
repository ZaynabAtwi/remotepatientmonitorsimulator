import { getRiskLabel, getTrendSymbol, PatientRiskSnapshot } from "../../lib/clinicalIntelligence";

type Props = {
  snapshot: PatientRiskSnapshot;
  isSelected: boolean;
  onSelect: (patientId: string) => void;
};

function riskColor(level: PatientRiskSnapshot["riskLevel"]) {
  if (level === "critical") return "var(--color-critical)";
  if (level === "warning") return "var(--color-warning)";
  if (level === "stable") return "var(--color-stable)";
  return "var(--color-info)";
}

export default function PatientQueueCard({ snapshot, isSelected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(snapshot.patient.id)}
      className="w-full rounded-xl border p-3 text-left transition"
      style={{
        borderColor: isSelected ? "var(--color-accent)" : "var(--color-border)",
        backgroundColor: isSelected ? "rgba(59, 130, 246, 0.12)" : "var(--color-surface)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{snapshot.patient.name}</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {snapshot.patient.age}y {snapshot.patient.sex ? `· ${snapshot.patient.sex}` : ""}
          </p>
        </div>
        <span
          className="clinical-chip"
          style={{ backgroundColor: `${riskColor(snapshot.riskLevel)}22`, color: riskColor(snapshot.riskLevel) }}
        >
          {getRiskLabel(snapshot.riskLevel)} · {Math.round(snapshot.riskScore)}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {snapshot.diagnosisTags.map((diagnosis) => (
          <span
            key={diagnosis}
            className="clinical-chip"
            style={{ backgroundColor: "var(--color-surface-muted)", color: "var(--color-text-muted)" }}
          >
            {diagnosis}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span style={{ color: "var(--color-text-muted)" }}>Alerts: {snapshot.activeAlerts}</span>
        <span
          className="font-semibold"
          style={{ color: snapshot.trendDirection === "up" ? "var(--color-critical)" : "var(--color-stable)" }}
        >
          Trend {getTrendSymbol(snapshot.trendDirection)}
        </span>
      </div>
    </button>
  );
}
