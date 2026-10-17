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