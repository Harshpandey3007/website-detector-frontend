import { format, formatDistanceToNow } from "date-fns";

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function timeAgo(value?: string | null, fallback = "Never"): string {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : fallback;
}

/** Compact relative time like Linear's list rows: now, 5m, 3h, 2d, Oct 4. */
export function shortAgo(value?: string | null, fallback = "—"): string {
  const d = toDate(value);
  if (!d) return fallback;
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 45) return "now";
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.round(s / 86400)}d`;
  return format(d, "MMM d");
}

export function fullDate(value?: string | null): string {
  const d = toDate(value);
  return d ? format(d, "PPpp") : "";
}

export function timestamp(value?: string | null): number {
  return toDate(value)?.getTime() ?? 0;
}

export function formatInterval(mins: number): string {
  if (mins % 1440 === 0) {
    const days = mins / 1440;
    return days === 1 ? "daily" : `every ${days} days`;
  }
  if (mins % 60 === 0) {
    const hours = mins / 60;
    return hours === 1 ? "hourly" : `every ${hours} hours`;
  }
  return `every ${mins} min`;
}

/** 15 -> "15m", 60 -> "1h", 1440 -> "1d" */
export function shortInterval(mins: number): string {
  if (mins % 1440 === 0) return `${mins / 1440}d`;
  if (mins % 60 === 0) return `${mins / 60}h`;
  return `${mins}m`;
}