export type StatusKind = "OK" | "ERROR" | "BLOCKED" | "PENDING" | "SCANNING";

export function normalizeStatus(status?: string | null): Exclude<StatusKind, "SCANNING"> {
  const n = (status ?? "").toUpperCase();
  return n === "OK" || n === "ERROR" || n === "BLOCKED" ? n : "PENDING";
}

export const STATUS_LABEL: Record<StatusKind, string> = {
  OK: "Healthy",
  ERROR: "Error",
  BLOCKED: "Blocked",
  PENDING: "Pending",
  SCANNING: "Scanning",
};

/** Linear-style status glyph: a small circle whose fill encodes the state. */
export function StatusIcon({ status, size = 14, className = "" }: { status: StatusKind; size?: number; className?: string }) {
  const common = { width: size, height: size, viewBox: "0 0 14 14", fill: "none", "aria-hidden": true, className: `shrink-0 ${className}` } as const;
  const dark = "#101113";

  switch (status) {
    case "OK":
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="6" fill="#4cb782" />
          <path d="M4.3 7.2l1.9 1.9 3.6-3.9" stroke={dark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "ERROR":
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="6" fill="#eb5757" />
          <path d="M4.9 4.9l4.2 4.2M9.1 4.9L4.9 9.1" stroke={dark} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "BLOCKED":
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="6" fill="#f2994a" />
          <path d="M7 4v3.4" stroke={dark} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="7" cy="9.5" r="0.9" fill={dark} />
        </svg>
      );
    case "SCANNING":
      return (
        <svg {...common} className={`shrink-0 animate-spin ${className}`}>
          <circle cx="7" cy="7" r="5.25" stroke="#5e6ad2" strokeOpacity="0.25" strokeWidth="1.5" />
          <path d="M7 1.75A5.25 5.25 0 0 1 12.25 7" stroke="#5e6ad2" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="7" cy="7" r="5.25" stroke="#8a8f98" strokeWidth="1.5" strokeDasharray="2.2 2.2" />
        </svg>
      );
  }
}

/** Icon + label, used in headers and property lists. */
export default function StatusBadge({ status, scanning = false }: { status: string; scanning?: boolean }) {
  const kind: StatusKind = scanning ? "SCANNING" : normalizeStatus(status);
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 text-[13px] text-zinc-300">
      <StatusIcon status={kind} />
      {STATUS_LABEL[kind]}
    </span>
  );
}
