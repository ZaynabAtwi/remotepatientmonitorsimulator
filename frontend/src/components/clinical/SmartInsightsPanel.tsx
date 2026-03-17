import { ClinicalInsight, getInsightCategoryTitle } from "../../lib/clinicalIntelligence";

type Props = {
  insights: ClinicalInsight[];
  loading?: boolean;
};

export default function SmartInsightsPanel({ insights, loading }: Props) {
  return (
    <section className="clinical-surface p-4 md:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold md:text-base">Smart Insights (AI Layer)</h3>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Concise model-assisted interpretation for clinical decision support.
        </p>
      </div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="h-20 animate-pulse rounded-xl"
              style={{ backgroundColor: "var(--color-surface-muted)" }}
            />
          ))}
        </div>
      ) : insights.length ? (
        <div className="space-y-3">
          {insights.map((insight) => (
            <article key={insight.id} className="clinical-muted-surface p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
                  {getInsightCategoryTitle(insight.category)}
                </p>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Confidence {Math.round(insight.confidence * 100)}%
                </span>
              </div>
              <p className="text-sm leading-relaxed">{insight.statement}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-4 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
          No insights available for this patient yet.
        </div>
      )}
    </section>
  );
}
