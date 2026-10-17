"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Globe,
  Plus,
  type LucideIcon,
} from "lucide-react";
import {
  getAlerts,
  getErrorMessage,
  getMonitors,
  type Alert,
  type Monitor,
} from "@/lib/api";
import { timestamp } from "@/lib/format";
import { btnSecondary } from "@/lib/styles";
import { useShell } from "@/components/AppShell";
import AlertItem, { AlertItemSkeleton } from "@/components/AlertItem";
import ErrorState from "@/components/ErrorState";
import MonitorCard, { MonitorCardSkeleton } from "@/components/MonitorCard";
import Skeleton from "@/components/Skeleton";

type Tone = "default" | "ok" | "error";

const ICON_TONE: Record<Tone, string> = {
  default: "text-zinc-400",
  ok: "text-emerald-400",
  error: "text-red-400",
};

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  loading: boolean;
  tone?: Tone;
}) {
  const valueTone = tone === "error" && value > 0 ? "text-red-300" : "text-zinc-100";
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/70 to-zinc-900/30 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{label}</p>
        <Icon className={`h-4 w-4 ${ICON_TONE[tone]}`} />
      </div>
      <div className="mt-3 h-9">
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className={`text-3xl font-semibold tabular-nums tracking-tight ${valueTone}`}>
            {value}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-medium text-zinc-100">{title}</h2>
      <Link
        href={href}
        className="text-xs text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
      >
        {linkLabel}
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const { refreshKey, openAddMonitor } = useShell();
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

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const retry = () => {
    setError(null);
    load();
  };

  const loading = !error && (monitors === null || alerts === null);

  if (error && (monitors === null || alerts === null)) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  const list = monitors ?? [];
  const alertList = alerts ?? [];
  const isStatus = (m: Monitor, s: string) => (m.status ?? "").toUpperCase() === s;

  const healthy = list.filter((m) => isStatus(m, "OK")).length;
  const errored = list.filter((m) => isStatus(m, "ERROR")).length;

  const recent = [...alertList]
    .sort((a, b) => timestamp(b.sentAt) - timestamp(a.sentAt))
    .slice(0, 6);

  // Surface problems first, then the most recently changed pages
  const topMonitors = [...list]
    .sort((a, b) => {
      const ae = isStatus(a, "ERROR") ? 1 : 0;
      const be = isStatus(b, "ERROR") ? 1 : 0;
      if (ae !== be) return be - ae;
      return timestamp(b.lastChangedAt) - timestamp(a.lastChangedAt);
    })
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <section aria-label="Summary" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Total monitors" value={list.length} icon={Globe} loading={loading} />
        <StatCard label="Healthy" value={healthy} icon={CheckCircle2} loading={loading} tone="ok" />
        <StatCard label="Errors" value={errored} icon={AlertTriangle} loading={loading} tone="error" />
        <StatCard label="Total alerts" value={alertList.length} icon={Bell} loading={loading} />
      </section>

      <section aria-label="Recent activity">
        <SectionHeader title="Recent activity" href="/alerts" linkLabel="View all alerts" />
        <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40">
          {loading ? (
            <ul className="divide-y divide-zinc-800/60">
              {Array.from({ length: 4 }).map((_, i) => (
                <AlertItemSkeleton key={i} />
              ))}
            </ul>
          ) : recent.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm font-medium text-zinc-200">No alerts yet</p>
              <p className="mt-1 text-sm text-zinc-500">
                Changes show up here as soon as a monitor detects one.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800/60">
              {recent.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-label="Monitors">
        <SectionHeader title="Monitors" href="/monitors" linkLabel="View all monitors" />
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <MonitorCardSkeleton key={i} />
            ))}
          </div>
        ) : topMonitors.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-800 px-6 py-10 text-center">
            <p className="text-sm font-medium text-zinc-200">No monitors yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              Add a page to watch and we&rsquo;ll alert you when it changes.
            </p>
            <button type="button" onClick={openAddMonitor} className={`${btnSecondary} mt-4`}>
              <Plus className="h-3.5 w-3.5" />
              Create monitor
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {topMonitors.map((m) => (
              <MonitorCard key={m.id} monitor={m} onChanged={load} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}