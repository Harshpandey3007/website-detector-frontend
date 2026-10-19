"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowRight, Plus } from "lucide-react";
import { getAlerts, getErrorMessage, getMonitors, type Alert, type Monitor } from "@/lib/api";
import { timestamp } from "@/lib/format";
import { btnSecondary } from "@/lib/styles";
import { useShell } from "@/components/AppShell";
import { useLive } from "@/components/LiveProvider";
import ActivityChart from "@/components/ActivityChart";
import AlertItem, { AlertItemSkeleton } from "@/components/AlertItem";
import ErrorState from "@/components/ErrorState";
import MonitorRow, { MonitorRowSkeleton } from "@/components/MonitorRow";
import Skeleton from "@/components/Skeleton";

function Stat({ label, value, loading, tone }: { label: string; value: number; loading: boolean; tone?: "ok" | "error" }) {
  const color = tone === "error" && value > 0 ? "text-red-400" : tone === "ok" ? "text-emerald-400" : "text-zinc-100";
  return (
    <div className="px-5 py-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="mt-1 h-8">
        {loading ? <Skeleton className="h-7 w-12" /> : <p className={`text-2xl font-semibold tabular-nums tracking-tight ${color}`}>{value}</p>}
      </div>
    </div>
  );
}

function SectionHeader({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-[13px] font-medium text-zinc-200">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-200">
        {linkLabel} <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

const panel = "overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/30";

export default function OverviewPage() {
  const { refreshKey, openAddMonitor } = useShell();
  const { tick, scanning } = useLive();
  const [monitors, setMonitors] = useState<Monitor[] | null>(null);
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [m, a] = await Promise.all([getMonitors(), getAlerts()]);
      setMonitors(m);
      setAlerts(a);
      setError(null);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      toast.error(message, { id: "dashboard-load-error" });
    }
  }, []);

  // Refetch on create AND whenever the live stream reports a finished check
  useEffect(() => { load(); }, [load, refreshKey, tick]);

  const loading = !error && (monitors === null || alerts === null);
  if (error && (monitors === null || alerts === null)) return <ErrorState message={error} onRetry={() => { setError(null); load(); }} />;

  const list = monitors ?? [];
  const alertList = alerts ?? [];
  const status = (m: Monitor) => (m.status ?? "").toUpperCase();
  const healthy = list.filter((m) => status(m) === "OK").length;
  const problems = list.filter((m) => status(m) === "ERROR" || status(m) === "BLOCKED").length;

  const recent = [...alertList].sort((a, b) => timestamp(b.sentAt) - timestamp(a.sentAt)).slice(0, 6);
  const top = [...list]
    .sort((a, b) => {
      const ae = status(a) === "OK" ? 0 : 1;
      const be = status(b) === "OK" ? 0 : 1;
      return ae !== be ? be - ae : timestamp(b.lastChangedAt) - timestamp(a.lastChangedAt);
    })
    .slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-5xl animate-slide-up space-y-8 px-6 py-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Overview</h2>
        <p className="mt-1 text-[13px] text-zinc-500">
          {loading ? "Loading…" : scanning.size > 0 ? `Scanning ${scanning.size} page${scanning.size === 1 ? "" : "s"} right now…` : "Everything Aegis Watch is keeping an eye on."}
        </p>
      </div>

      <section aria-label="Summary" className={`${panel} grid grid-cols-2 divide-x divide-zinc-800 md:grid-cols-4`}>
        <Stat label="Monitors" value={list.length} loading={loading} />
        <Stat label="Healthy" value={healthy} loading={loading} tone="ok" />
        <Stat label="Needs attention" value={problems} loading={loading} tone="error" />
        <Stat label="Alerts sent" value={alertList.length} loading={loading} />
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section aria-label="Recent activity" className="lg:col-span-3">
          <SectionHeader title="Recent activity" href="/alerts" linkLabel="All alerts" />
          <div className={panel}>
            {loading ? (
              <ul>{Array.from({ length: 4 }).map((_, i) => <AlertItemSkeleton key={i} />)}</ul>
            ) : recent.length === 0 ? (
              <p className="px-6 py-10 text-center text-[13px] text-zinc-500">No alerts yet. Changes show up here the moment a monitor detects one.</p>
            ) : (
              <ul>{recent.map((a) => <AlertItem key={a.id} alert={a} />)}</ul>
            )}
          </div>
        </section>

        <section aria-label="Alert activity" className="lg:col-span-2">
          <div className="mb-2 h-[20px]" aria-hidden="true" />
          <div className={`${panel} p-4`}>
            {loading ? <Skeleton className="h-24 w-full" /> : <ActivityChart dates={alertList.map((a) => a.sentAt)} label="Alerts per day" />}
          </div>
        </section>
      </div>

      <section aria-label="Monitors">
        <SectionHeader title="Monitors" href="/monitors" linkLabel="All monitors" />
        <div className={panel}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <MonitorRowSkeleton key={i} />)
          ) : top.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-10 text-center">
              <p className="text-[13px] text-zinc-400">No monitors yet.</p>
              <button type="button" onClick={openAddMonitor} className={`${btnSecondary} mt-3`}>
                <Plus className="h-3.5 w-3.5" /> New monitor <span className="kbd">C</span>
              </button>
            </div>
          ) : (
            top.map((m) => <MonitorRow key={m.id} monitor={m} onChanged={load} />)
          )}
        </div>
      </section>
    </div>
  );
}
