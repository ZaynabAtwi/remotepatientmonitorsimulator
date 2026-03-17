import { Alert, Patient } from "../../api/types";
import { InterventionEntry } from "../../data/mockClinicalData";
import AlertsSummary from "./AlertsSummary";
import InterventionLog from "./InterventionLog";

type Props = {
  patient?: Patient | null;
  alerts: Alert[];
  interventionLog: InterventionEntry[];
  onAcknowledge: () => void;
  onAction: (action: "contact" | "note" | "escalate") => void;
};

function ActionButton({
  label,
  onClick,
  variant = "secondary",
}: {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl px-3 py-2 text-sm font-semibold transition"
      style={{
        backgroundColor:
          variant === "primary"
            ? "var(--color-accent)"
            : variant === "danger"
            ? "rgba(220, 106, 106, 0.12)"
            : "var(--color-surface-muted)",
        color: variant === "primary" ? "#ffffff" : variant === "danger" ? "var(--color-critical)" : "var(--color-text)",
      }}
    >
      {label}
    </button>
  );
}

export default function ActionPanel({ patient, alerts, interventionLog, onAcknowledge, onAction }: Props) {
  return (
    <aside className="clinical-surface space-y-4 p-4 md:p-5">
      <div>
        <h3 className="text-sm font-semibold md:text-base">Action Panel</h3>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          One-click interventions for bedside and virtual care teams.
        </p>
      </div>
      <div className="space-y-2">
        <ActionButton
          label={alerts.length ? "Acknowledge Alert" : "Acknowledge Alert (No Active)"}
          onClick={onAcknowledge}
          variant={alerts.length ? "primary" : "secondary"}
        />
        <ActionButton label="Contact Patient" onClick={() => onAction("contact")} />
        <ActionButton label="Add Clinical Note" onClick={() => onAction("note")} />
        <ActionButton label="Escalate Case" onClick={() => onAction("escalate")} variant="danger" />
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          Alert Summary {patient ? `· ${patient.name}` : ""}
        </p>
        <AlertsSummary alerts={alerts} />
      </div>
      <InterventionLog entries={interventionLog} />
    </aside>
  );
}
