import clsx from "clsx";

type Props = {
  status: string;
  label?: string;
};

const statusStyles: Record<string, string> = {
  normal: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  critical: "bg-rose-50 text-rose-700 border border-rose-200",
};

export default function StatusBadge({ status, label }: Props) {
  const style = statusStyles[status] || "bg-slate-100 text-slate-700 border border-slate-200";
  return <span className={clsx("badge", style)}>{label || status}</span>;
}
