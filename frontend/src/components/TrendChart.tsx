import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Vital } from "../api/types";

type Props = {
  vitals: Vital[];
  metric: string;
  color?: string;
};

export default function TrendChart({ vitals, metric, color = "#3b7ac6" }: Props) {
  const data = vitals
    .filter((vital) => vital.metric === metric)
    .map((vital) => ({
      time: new Date(vital.timestamp).toLocaleTimeString(),
      value: vital.value,
    }))
    .reverse();

  return (
    <div className="card p-4">
      <div className="text-sm font-semibold text-slate-700 mb-3">{metric.replace("_", " ")}</div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" hide />
            <YAxis width={40} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
