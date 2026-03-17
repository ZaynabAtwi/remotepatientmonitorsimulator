import ThemeToggle from "./ThemeToggle";

type Props = {
  patientCount: number;
  selectedPatientName?: string;
  dataMode: "live" | "demo";
  onOpenQueue: () => void;
  isQueueButtonVisible: boolean;
  theme: "light" | "dark";
  onThemeToggle: () => void;
};

export default function ResponsiveHeader({
  patientCount,
  selectedPatientName,
  dataMode,
  onOpenQueue,
  isQueueButtonVisible,
  theme,
  onThemeToggle,
}: Props) {
  return (
    <header className="sticky top-0 z-30 border-b px-4 py-3 backdrop-blur lg:px-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isQueueButtonVisible && (
              <button
                type="button"
                className="clinical-muted-surface px-3 py-2 text-xs font-semibold md:inline-flex xl:hidden"
                style={{ color: "var(--color-text)" }}
                onClick={onOpenQueue}
              >
                Queue
              </button>
            )}
            <h1 className="truncate text-base font-semibold md:text-xl">AI Clinical Decision Interface</h1>
          </div>
          <p className="truncate text-xs md:text-sm" style={{ color: "var(--color-text-muted)" }}>
            {selectedPatientName ? `Focused Patient: ${selectedPatientName}` : "Select a patient from risk queue"} ·{" "}
            {patientCount} active profiles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="clinical-chip hidden md:inline-flex"
            style={{
              backgroundColor: dataMode === "live" ? "rgba(22, 163, 74, 0.14)" : "rgba(245, 158, 11, 0.18)",
              color: dataMode === "live" ? "var(--color-stable)" : "var(--color-warning)",
            }}
          >
            {dataMode === "live" ? "Live Stream" : "Demo Data"}
          </span>
          <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        </div>
      </div>
    </header>
  );
}
