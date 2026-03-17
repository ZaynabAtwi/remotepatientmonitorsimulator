import { CurrentVital, getRiskLabel } from "../../lib/clinicalIntelligence";

type Props = {
  vitals: CurrentVital[];
  loading?: boolean;
};

export default function CurrentVitalsPanel({ vitals, loading }: Props) {
  return (
    <section className="clinical-surface p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold md:text-base">Current Status</h3>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Clinically prioritized vitals with threshold context.
          </p>
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="h-24 animate-pulse rounded-xl"
              style={{ backgroundColor: "var(--color-surface-muted)" }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {vitals.map((vital) => (
            <div key={vital.key} className="clinical-muted-surface p-3 md:p-4">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                {vital.label}
              </p>
              <p className="mt-2 text-2xl font-semibold">{vital.valueText}</p>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                <span
                  className="clinical-chip px-2 py-0.5"
                  style={{
                    backgroundColor:
                      vital.state === "critical"
                        ? "rgba(220, 106, 106, 0.12)"
                        : vital.state === "warning"
                        ? "rgba(245, 158, 11, 0.14)"
                        : "rgba(22, 163, 74, 0.14)",
                    color:
                      vital.state === "critical"
                        ? "var(--color-critical)"
                        : vital.state === "warning"
                        ? "var(--color-warning)"
                        : "var(--color-stable)",
                  }}
                >
                  {getRiskLabel(vital.state)}
                </span>
                <span style={{ color: "var(--color-text-muted)" }}>{new Date(vital.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                {vital.thresholdHint}
              </p>
            </div>
          ))}
        </div>
      )}
      {!loading && vitals.length === 0 && (
        <div className="rounded-xl border border-dashed p-4 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
          No vitals available for the selected patient.
        </div>
      )}
    </section>
  );
}
