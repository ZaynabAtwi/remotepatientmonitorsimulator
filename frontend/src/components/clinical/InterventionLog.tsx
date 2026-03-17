import { InterventionEntry } from "../../data/mockClinicalData";

type Props = {
  entries: InterventionEntry[];
};

export default function InterventionLog({ entries }: Props) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
        Recent Interventions
      </p>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div key={entry.id} className="clinical-muted-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold">{entry.action}</p>
              <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              {entry.detail}
            </p>
            <p className="mt-1 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              {entry.actor}
            </p>
          </div>
        ))}
        {!entries.length && (
          <div className="rounded-xl border border-dashed p-3 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
            No interventions logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
