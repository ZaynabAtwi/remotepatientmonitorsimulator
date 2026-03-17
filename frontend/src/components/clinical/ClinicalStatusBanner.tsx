import { PatientRiskSnapshot, getRiskLabel } from "../../lib/clinicalIntelligence";

type Props = {
  snapshot?: PatientRiskSnapshot;
  loading?: boolean;
};

function bannerColors(level: PatientRiskSnapshot["riskLevel"] | undefined) {
  if (level === "critical") return { bg: "rgba(220, 106, 106, 0.14)", fg: "var(--color-critical)" };
  if (level === "warning") return { bg: "rgba(245, 158, 11, 0.14)", fg: "var(--color-warning)" };
  if (level === "stable") return { bg: "rgba(22, 163, 74, 0.15)", fg: "var(--color-stable)" };
  return { bg: "rgba(79, 70, 229, 0.12)", fg: "var(--color-info)" };
}

export default function ClinicalStatusBanner({ snapshot, loading }: Props) {
  const colors = bannerColors(snapshot?.riskLevel);
  return (
    <section className="rounded-2xl px-4 py-3 md:px-5 md:py-4" style={{ backgroundColor: colors.bg }}>
      {loading ? (
        <div className="h-6 w-2/3 animate-pulse rounded" style={{ backgroundColor: "rgba(148, 163, 184, 0.35)" }} />
      ) : snapshot ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.fg }}>
            Clinical Status
          </p>
          <h2 className="text-base font-semibold md:text-xl" style={{ color: colors.fg }}>
            {getRiskLabel(snapshot.riskLevel)} Risk — {snapshot.suggestedNextStep}
          </h2>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            {snapshot.summary}
          </p>
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Select a patient to review current risk and clinical recommendation.
        </p>
      )}
    </section>
  );
}
