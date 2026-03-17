import { Alert } from "../../api/types";

type Props = {
  alerts: Alert[];
};

function severityCount(alerts: Alert[], severity: string) {
  return alerts.filter((alert) => alert.severity === severity).length;
}

export default function AlertsSummary({ alerts }: Props) {
  const groupedCause = alerts.reduce<Record<string, number>>((acc, alert) => {
    const key = alert.metric.replace("_", " ");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="clinical-muted-surface p-2">
          <p style={{ color: "var(--color-text-muted)" }}>Critical</p>
          <p className="text-base font-semibold" style={{ color: "var(--color-critical)" }}>
            {severityCount(alerts, "critical")}
          </p>
        </div>
        <div className="clinical-muted-surface p-2">
          <p style={{ color: "var(--color-text-muted)" }}>Warning</p>
          <p className="text-base font-semibold" style={{ color: "var(--color-warning)" }}>
            {severityCount(alerts, "warning")}
          </p>
        </div>
        <div className="clinical-muted-surface p-2">
          <p style={{ color: "var(--color-text-muted)" }}>Info</p>
          <p className="text-base font-semibold" style={{ color: "var(--color-info)" }}>
            {alerts.length - severityCount(alerts, "critical") - severityCount(alerts, "warning")}
          </p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          By Cause
        </p>
        {Object.entries(groupedCause).map(([cause, count]) => (
          <div key={cause} className="clinical-muted-surface flex items-center justify-between px-3 py-2 text-xs">
            <span>{cause}</span>
            <span style={{ color: "var(--color-text-muted)" }}>{count}</span>
          </div>
        ))}
        {!alerts.length && (
          <div className="rounded-xl border border-dashed p-3 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
            No active alerts for this patient.
          </div>
        )}
      </div>
    </div>
  );
}
