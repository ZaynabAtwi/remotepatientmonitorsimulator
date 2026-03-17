type Props = {
  theme: "light" | "dark";
  onToggle: () => void;
};

export default function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="clinical-muted-surface inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold"
      style={{ color: "var(--color-text)" }}
      aria-label="Toggle theme"
    >
      <span aria-hidden>{theme === "light" ? "Sun" : "Moon"}</span>
      <span>{theme === "light" ? "Light" : "Dark"} Theme</span>
    </button>
  );
}
