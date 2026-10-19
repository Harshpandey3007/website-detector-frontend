"use client";

import { useMemo } from "react";
import { differenceInCalendarDays, format, startOfDay, subDays } from "date-fns";
import { timestamp } from "@/lib/format";

/** Tiny dependency-free bar chart: how many events happened on each of the last N days. */
export default function ActivityChart({
  dates,
  days = 14,
  label,
}: {
  dates: Array<string | null | undefined>;
  days?: number;
  label: string;
}) {
  const buckets = useMemo(() => {
    const out = Array.from({ length: days }, (_, i) => ({ day: startOfDay(subDays(new Date(), days - 1 - i)), count: 0 }));
    for (const raw of dates) {
      const t = timestamp(raw);
      if (!t) continue;
      const idx = differenceInCalendarDays(new Date(t), out[0].day);
      if (idx >= 0 && idx < days) out[idx].count++;
    }
    return out;
  }, [dates, days]);

  const max = Math.max(1, ...buckets.map((b) => b.count));
  const total = buckets.reduce((s, b) => s + b.count, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-[13px] font-medium text-zinc-200">{label}</p>
        <p className="text-xs tabular-nums text-zinc-500">{total} in {days}d</p>
      </div>
      <div className="mt-3 flex h-16 items-end gap-1" role="img" aria-label={`${label}: ${total} in the last ${days} days`}>
        {buckets.map((b) => (
          <div key={b.day.toISOString()} className="group relative flex h-full flex-1 items-end">
            <div
              className={`w-full rounded-[2px] transition-colors ${b.count ? "bg-indigo-500 group-hover:bg-indigo-400" : "bg-zinc-800/80"}`}
              style={{ height: `${b.count ? Math.max(14, (b.count / max) * 100) : 6}%` }}
            />
            <span className="pointer-events-none absolute -top-6 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-200 group-hover:block">
              {format(b.day, "MMM d")} · {b.count}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-zinc-600">
        <span>{format(buckets[0].day, "MMM d")}</span>
        <span>Today</span>
      </div>
    </div>
  );
}
