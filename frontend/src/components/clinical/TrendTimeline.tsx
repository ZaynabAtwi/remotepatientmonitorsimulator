import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Alert, Vital } from "../../api/types";
import LayerToggle from "./LayerToggle";

type Props = {
  vitals: Vital[];
  alerts: Alert[];
  riskScore: number;
  loading?: boolean;
};

type ChartPoint = {
  timestamp: string;
  label: string;
  heart_rate?: number;
  bp_systolic?: number;
  spo2?: number;
  respiratory_rate?: number;
  predictedRisk?: number;
  isPrediction?: boolean;
};

const RANGE_OPTIONS = [
  { id: "6h", label: "Last 6h", hours: 6 },
  { id: "24h", label: "24h", hours: 24 },
  { id: "7d", label: "7d", hours: 168 },
] as const;

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function normalize(value: number, baseline: number) {
  if (!baseline) return 0;
  return ((value - baseline) / baseline) * 100;
}

function nearestLabel(timestamp: string, points: ChartPoint[]) {
  const target = new Date(timestamp).getTime();
  let nearest = points[0]?.label ?? "";
  let minDistance = Number.POSITIVE_INFINITY;
  points.forEach((point) => {
    const current = new Date(point.timestamp).getTime();
    const distance = Math.abs(target - current);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = point.label;
    }
  });
  return nearest;
}

export default function TrendTimeline({ vitals, alerts, riskScore, loading }: Props) {
  const [range, setRange] = useState<(typeof RANGE_OPTIONS)[number]["id"]>("6h");
  const [layers, setLayers] = useState({ vitals: true, events: true, alerts: true });

  const rangeHours = RANGE_OPTIONS.find((option) => option.id === range)?.hours ?? 6;

  const { points, alertDots, eventWindow, predictionStartLabel } = useMemo(() => {
    const now = Date.now();
    const cutoff = now - rangeHours * 60 * 60 * 1000;
    const includedMetrics = new Set(["heart_rate", "bp_systolic", "spo2", "respiratory_rate"]);
    const filtered = vitals
      .filter((vital) => includedMetrics.has(vital.metric))
      .filter((vital) => new Date(vital.timestamp).getTime() >= cutoff)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    const grouped = filtered.reduce<Record<string, ChartPoint>>((acc, vital) => {
      if (!acc[vital.timestamp]) {
        acc[vital.timestamp] = {
          timestamp: vital.timestamp,
          label: new Date(vital.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
      }
      if (vital.metric in acc[vital.timestamp]) {
        acc[vital.timestamp][vital.metric as keyof ChartPoint] = vital.value;
      }
      return acc;
    }, {});

    const metricSeries: Record<string, number[]> = {
      heart_rate: [],
      bp_systolic: [],
      spo2: [],
      respiratory_rate: [],
    };
    Object.values(grouped).forEach((point) => {
      if (typeof point.heart_rate === "number") metricSeries.heart_rate.push(point.heart_rate);
      if (typeof point.bp_systolic === "number") metricSeries.bp_systolic.push(point.bp_systolic);
      if (typeof point.spo2 === "number") metricSeries.spo2.push(point.spo2);
      if (typeof point.respiratory_rate === "number") metricSeries.respiratory_rate.push(point.respiratory_rate);
    });

    const baselines = {
      heart_rate: average(metricSeries.heart_rate),
      bp_systolic: average(metricSeries.bp_systolic),
      spo2: average(metricSeries.spo2),
      respiratory_rate: average(metricSeries.respiratory_rate),
    };

    const normalized = Object.values(grouped).map((point) => ({
      ...point,
      heart_rate:
        typeof point.heart_rate === "number" ? normalize(point.heart_rate, baselines.heart_rate) : undefined,
      bp_systolic:
        typeof point.bp_systolic === "number" ? normalize(point.bp_systolic, baselines.bp_systolic) : undefined,
      spo2: typeof point.spo2 === "number" ? normalize(point.spo2, baselines.spo2) : undefined,
      respiratory_rate:
        typeof point.respiratory_rate === "number"
          ? normalize(point.respiratory_rate, baselines.respiratory_rate)
          : undefined,
      predictedRisk: undefined,
      isPrediction: false,
    }));

    if (!normalized.length) {
      return { points: [] as ChartPoint[], alertDots: [] as Array<{ x: string; y: number; severity: string }>, eventWindow: null as { start: string; end: string } | null, predictionStartLabel: "" };
    }

    const lastPoint = normalized[normalized.length - 1];
    const previousPoint = normalized[Math.max(normalized.length - 6, 0)];
    const progression = ((riskScore - 40) / 60) * 4;
    const trendSlope = (riskScore + progression - (riskScore - 2)) / Math.max((normalized.length - 1) - Math.max(normalized.length - 6, 0), 1);
    const startTimestamp = new Date(lastPoint.timestamp).getTime();
    const predictionPoints: ChartPoint[] = [1, 2].map((hourOffset) => ({
      timestamp: new Date(startTimestamp + hourOffset * 60 * 60 * 1000).toISOString(),
      label: `+${hourOffset}h`,
      predictedRisk:
        riskScore +
        trendSlope * hourOffset +
        ((previousPoint?.bp_systolic ?? 0) + (previousPoint?.heart_rate ?? 0)) * 0.02,
      isPrediction: true,
    }));

    const allPoints = [...normalized, ...predictionPoints];

    const selectedAlerts = alerts
      .filter((alert) => !alert.acknowledged)
      .filter((alert) => new Date(alert.timestamp).getTime() >= cutoff);
    const alertDots = selectedAlerts.map((alert) => ({
      x: nearestLabel(alert.timestamp, normalized),
      y: alert.severity === "critical" ? 16 : 12,
      severity: alert.severity,
    }));

    const eventCandidates = normalized.filter((point) => {
      return (
        (typeof point.bp_systolic === "number" && point.bp_systolic > 8) ||
        (typeof point.heart_rate === "number" && point.heart_rate > 10) ||
        (typeof point.spo2 === "number" && point.spo2 < -3)
      );
    });
    const eventWindow = eventCandidates.length
      ? { start: eventCandidates[0].label, end: eventCandidates[eventCandidates.length - 1].label }
      : null;

    return {
      points: allPoints,
      alertDots,
      eventWindow,
      predictionStartLabel: normalized[normalized.length - 1].label,
    };
  }, [alerts, rangeHours, riskScore, vitals]);

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <section className="clinical-surface p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold md:text-base">Trend Timeline</h3>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Overlay view of baseline deviations, alerts, events, and a reserved predictive window.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{
                backgroundColor: range === option.id ? "rgba(59, 130, 246, 0.14)" : "var(--color-surface-muted)",
                color: range === option.id ? "var(--color-accent)" : "var(--color-text-muted)",
              }}
              onClick={() => setRange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <LayerToggle layers={layers} onToggle={toggleLayer} />
      </div>
      {loading ? (
        <div className="h-72 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-surface-muted)" }} />
      ) : points.length ? (
        <div className="h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="2 8" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--color-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[-20, 20]}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
              />
              {layers.events && eventWindow && (
                <ReferenceArea
                  x1={eventWindow.start}
                  x2={eventWindow.end}
                  strokeOpacity={0}
                  fill="rgba(245, 158, 11, 0.12)"
                />
              )}
              {layers.vitals && (
                <>
                  <Line type="monotone" dataKey="heart_rate" dot={false} stroke="var(--color-accent)" strokeWidth={2} />
                  <Line type="monotone" dataKey="bp_systolic" dot={false} stroke="var(--color-warning)" strokeWidth={2} />
                  <Line type="monotone" dataKey="spo2" dot={false} stroke="var(--color-stable)" strokeWidth={2} />
                  <Line type="monotone" dataKey="respiratory_rate" dot={false} stroke="var(--color-info)" strokeWidth={2} />
                </>
              )}
              <Line
                type="monotone"
                dataKey="predictedRisk"
                dot={false}
                stroke="var(--color-text-muted)"
                strokeDasharray="4 5"
                strokeWidth={1.5}
              />
              {layers.alerts &&
                alertDots.map((dot, index) => (
                  <ReferenceDot
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${dot.x}-${dot.severity}-${index}`}
                    x={dot.x}
                    y={dot.y}
                    r={4}
                    fill={dot.severity === "critical" ? "var(--color-critical)" : "var(--color-warning)"}
                    stroke="transparent"
                  />
                ))}
              {predictionStartLabel && (
                <ReferenceArea
                  x1={predictionStartLabel}
                  x2="+2h"
                  fill="rgba(148, 163, 184, 0.12)"
                  strokeOpacity={0}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-4 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
          No trend data available in the selected time range.
        </div>
      )}
    </section>
  );
}
