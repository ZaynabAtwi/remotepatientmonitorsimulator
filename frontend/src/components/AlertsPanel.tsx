import { Alert } from "../api/types";
import StatusBadge from "./StatusBadge";

type Props = {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
};

export default function AlertsPanel({ alerts, onAcknowledge }: Props) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700">Alerts</h2>
        <span className="text-xs text-slate-500">{alerts.length} active</span>
      </div>
      <div className="space-y-3 max-h-[320px] overflow-y-auto">
        {alerts.map((alert) => (
          <div key={alert.id} className="border border-slate-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">{alert.metric}</div>
              <StatusBadge status={alert.severity} />
            </div>
            <div className="text-xs text-slate-500 mt-1">{alert.trigger_rule}</div>
            <div className="text-xs text-slate-400 mt-1">
              {new Date(alert.timestamp).toLocaleString()}
            </div>
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="mt-2 text-xs font-semibold text-primary-700 hover:text-primary-900"
            >
              Acknowledge
            </button>
          </div>
        ))}
        {alerts.length === 0 && <div className="text-xs text-slate-500">No active alerts.</div>}
      </div>
    </div>
  );
}
