"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Search } from "lucide-react";
import { getAlerts, getErrorMessage, type Alert } from "@/lib/api";
import { timestamp } from "@/lib/format";
import { inputCls } from "@/lib/styles";
import { useShell } from "@/components/AppShell";
import { useLive } from "@/components/LiveProvider";
import AlertItem, { AlertItemSkeleton } from "@/components/AlertItem";
import ErrorState from "@/components/ErrorState";

type Filter = "all" | "change" | "status";
const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "All" },
  { id: "change", label: "Changes" },
  { id: "status", label: "Problems" },
];

export default function AlertsPage() {
  const { refreshKey } = useShell();
  const { tick } = useLive();
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    try {
      setAlerts(await getAlerts());
      setError(null);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message, { id: "alerts-load-error" });
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey, tick]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return [...(alerts ?? [])]
      .sort((a, b) => timestamp(b.sentAt) - timestamp(a.sentAt))
      .filter((a) => filter === "all" || (a.kind ?? "change") === filter)
      .filter((a) => !needle || `${a.monitor?.name ?? ""} ${a.summary} ${a.monitor?.url ?? ""}`.toLowerCase().includes(needle));
  }, [alerts, filter, q]);

  if (error && alerts === null) return <ErrorState message={error} onRetry={() => { setError(null); load(); }} />;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`h-7 rounded-md px-2.5 text-[13px] transition-colors ${filter === f.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search alerts" aria-label="Search alerts" className={`${inputCls} h-7 pl-8`} />
        </div>
      </div>

      {alerts === null ? (
        <ul>{Array.from({ length: 8 }).map((_, i) => <AlertItemSkeleton key={i} />)}</ul>
      ) : visible.length === 0 ? (
        <div className="px-6 py-20 text-center">
          <p className="text-[13px] font-medium text-zinc-200">{alerts.length === 0 ? "No alerts yet" : "Nothing matches"}</p>
          <p className="mt-1 text-[13px] text-zinc-500">
            {alerts.length === 0 ? "When a monitor detects a change, it will land here." : "Try a different filter or search term."}
          </p>
        </div>
      ) : (
        <ul>{visible.map((a) => <AlertItem key={a.id} alert={a} showUrl />)}</ul>
      )}
    </div>
  );
}