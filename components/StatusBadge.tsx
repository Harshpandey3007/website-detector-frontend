const STYLES = {
  OK: {
    label: "OK",
    dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]",
    text: "text-emerald-400",
  },
  ERROR: {
    label: "Error",
    dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
    text: "text-red-400",
  },
  PENDING: {
    label: "Pending",
    dot: "bg-amber-500",
    text: "text-amber-400",
  },
} as const;

export default function StatusBadge({ status }: { status: string }) {
  const normalized = (status ?? "").toUpperCase();
  const key = normalized === "OK" ? "OK" : normalized === "ERROR" ? "ERROR" : "PENDING";
  const s = STYLES[key];

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs font-medium ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}