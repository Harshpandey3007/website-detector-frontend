"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Globe, Plus, Search } from "lucide-react";
import { getErrorMessage, getMonitors, type Monitor } from "@/lib/api";
import { timestamp } from "@/lib/format";
import { btnPrimary, inputCls } from "@/lib/styles";
import { useShell } from "@/components/AppShell";
import { useLive } from "@/components/LiveProvider";
import ErrorState from "@/components/ErrorState";
import MonitorRow, { MonitorRowSkeleton } from "@/components/MonitorRow";
import { StatusIcon, type StatusKind } from "@/components/StatusBadge";

type Filter = "all" | "ok" | "problem";

function GroupHeader({ icon, label, count }: { icon: StatusKind; label: string; count: number }) {
  return (
    <div className="flex h-9 items-center gap-2 border-b border-zinc-800/60 bg-zinc-900/40 px-4">
      <StatusIcon status={icon} size={13} />
      <span className="text-[13px] font-medium text-zinc-200">{label}</span>
      <span className="text-xs tabular-nums text-zinc-500">{count}</span>
    </div>
  );
}

export default function MonitorsPage() {
  const router = useRouter();
  const { refreshKey, openAddMonitor } = useShell();
  const { tick } = useLive();
  const searchRef = useRef<HTMLInputElement>(null);
  const [monitors, setMonitors] = useState<Monitor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(-1);

  const load = useCallback(async () => {
    try {
      setMonitors(await getMonitors());
      setError(null);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message, { id: "monitors-load-error" });
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey, tick]);

  const { needsAttention, healthy } = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const byRecent = (a: Monitor, b: Monitor) => timestamp(b.lastChangedAt) - timestamp(a.lastChangedAt) || a.name.localeCompare(b.name);
    const matches = (monitors ?? []).filter((m) => !needle || `${m.name} ${m.url}`.toLowerCase().includes(needle));
    const ok = (m: Monitor) => (m.status ?? "").toUpperCase() === "OK";
    return {
      needsAttention: filter === "ok" ? [] : matches.filter((m) => !ok(m)).sort(byRecent),
      healthy: filter === "problem" ? [] : matches.filter(ok).sort(byRecent),
    };
  }, [monitors, filter, q]);

  const visible = useMemo(() => [...needsAttention, ...healthy], [needsAttention, healthy]);

  // Linear-style keyboard navigation: j/k or arrows to move, Enter to open, / to search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "/") { e.preventDefault(); searchRef.current?.focus(); return; }
      if (!visible.length) return;
      if (k === "j" || k === "arrowdown") {
        e.preventDefault();
        setCursor((c) => { const n = Math.min(c + 1, visible.length - 1); document.getElementById(`row-${visible[n].id}`)?.scrollIntoView({ block: "nearest" }); return n; });
      } else if (k === "k" || k === "arrowup") {
        e.preventDefault();
        setCursor((c) => { const n = Math.max(c - 1, 0); document.getElementById(`row-${visible[n].id}`)?.scrollIntoView({ block: "nearest" }); return n; });
      } else if (k === "enter" && cursor >= 0 && visible[cursor]) {
        router.push(`/monitors/${visible[cursor].id}`);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible, cursor, router]);

  useEffect(() => { setCursor(-1); }, [filter, q]);

  if (error && monitors === null) return <ErrorState message={error} onRetry={() => { setError(null); load(); }} />;

  if (monitors === null) {
    return <div className="animate-fade-in">{Array.from({ length: 7 }).map((_, i) => <MonitorRowSkeleton key={i} />)}</div>;
  }

  if (monitors.length === 0) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-500"><Globe className="h-5 w-5" /></div>
        <h2 className="mt-4 text-[15px] font-semibold tracking-tight">No monitors yet</h2>
        <p className="mt-1 max-w-sm text-[13px] text-zinc-500">Add a page to watch. You&rsquo;ll get a Telegram or email alert, with a visual diff, when it changes.</p>
        <button type="button" onClick={openAddMonitor} className={`${btnPrimary} mt-5`}>
          <Plus className="h-3.5 w-3.5" /> New monitor <span className="kbd !border-white/20 !bg-white/10 !text-white/80">C</span>
        </button>
      </div>
    );
  }

  const count = (f: Filter) => (f === "all" ? monitors.length : monitors.filter((m) => ((m.status ?? "").toUpperCase() === "OK") === (f === "ok")).length);
  const chip = (f: Filter, label: string) => (
    <button
      key={f}
      type="button"
      onClick={() => setFilter(f)}
      aria-pressed={filter === f}
      className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] transition-colors ${filter === f ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"}`}
    >
      {label} <span className="text-xs tabular-nums text-zinc-500">{count(f)}</span>
    </button>
  );

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-4 py-2">
        <div className="flex items-center gap-1">
          {chip("all", "All")}
          {chip("ok", "Healthy")}
          {chip("problem", "Problems")}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
          <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…  ( / )" aria-label="Filter monitors" className={`${inputCls} h-7 pl-8`} />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="px-6 py-16 text-center text-[13px] text-zinc-500">No monitors match your filters.</p>
      ) : (
        <>
          {needsAttention.length > 0 && (
            <section>
              <GroupHeader icon="ERROR" label="Needs attention" count={needsAttention.length} />
              {needsAttention.map((m) => <MonitorRow key={m.id} monitor={m} onChanged={load} active={visible[cursor]?.id === m.id} />)}
            </section>
          )}
          {healthy.length > 0 && (
            <section>
              <GroupHeader icon="OK" label="Healthy" count={healthy.length} />
              {healthy.map((m) => <MonitorRow key={m.id} monitor={m} onChanged={load} active={visible[cursor]?.id === m.id} />)}
            </section>
          )}
          <p className="px-4 py-4 text-xs text-zinc-600">
            <span className="kbd">J</span> <span className="kbd">K</span> to move · <span className="kbd">↵</span> to open · <span className="kbd">/</span> to filter
          </p>
        </>
      )}
    </div>
  );
}
