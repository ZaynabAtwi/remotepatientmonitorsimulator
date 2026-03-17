import { PatientRiskSnapshot } from "../../lib/clinicalIntelligence";
import PatientQueueCard from "./PatientQueueCard";

type Props = {
  snapshots: PatientRiskSnapshot[];
  selectedPatientId?: string | null;
  onSelect: (patientId: string) => void;
  loading?: boolean;
};

function QueueSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="h-24 animate-pulse rounded-xl"
          style={{ backgroundColor: "var(--color-surface-muted)" }}
        />
      ))}
    </div>
  );
}

export default function PatientRiskQueue({ snapshots, selectedPatientId, onSelect, loading }: Props) {
  return (
    <section className="clinical-surface p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold md:text-base">Patient Risk Queue</h2>
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          Sorted by risk score, active alerts, and deterioration trend.
        </p>
      </div>
      <div className="max-h-[72vh] space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <QueueSkeleton />
        ) : (
          snapshots.map((snapshot) => (
            <PatientQueueCard
              key={snapshot.patient.id}
              snapshot={snapshot}
              isSelected={selectedPatientId === snapshot.patient.id}
              onSelect={onSelect}
            />
          ))
        )}
        {!loading && snapshots.length === 0 && (
          <div className="rounded-xl border border-dashed p-4 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
            No monitored patients in queue.
          </div>
        )}
      </div>
    </section>
  );
}
