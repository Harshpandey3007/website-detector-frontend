"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { ArrowUpRight, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { checkMonitor, deleteMonitor, getErrorMessage, type Monitor } from "@/lib/api";
import { formatInterval, fullDate, timeAgo } from "@/lib/format";
import { btnDanger, btnDangerActive, btnSecondary } from "@/lib/styles";
import Skeleton from "./Skeleton";
import StatusBadge from "./StatusBadge";

export default function MonitorCard({
  monitor,
  onChanged,
}: {
  monitor: Monitor;
  onChanged: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Second click on "Delete" must happen within 3 seconds to confirm.
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  async function handleCheck() {
    setChecking(true);
    try {
      await checkMonitor(monitor.id);
      toast.success(`Checked ${monitor.name}`);
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setChecking(false);
    }
  }

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      await deleteMonitor(monitor.id);
      toast.success(`Deleted ${monitor.name}`);
      onChanged();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setConfirming(false);
    }
  }

  const busy = checking || deleting;

  return (
    <article className="flex flex-col rounded-xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/70 to-zinc-900/30 transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-zinc-100">{monitor.name}</h3>
          <a
            href={monitor.url}
            target="_blank"
            rel="noopener noreferrer"
            title={monitor.url}
            className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <span className="truncate">{monitor.url.replace(/^https?:\/\//, "")}</span>
            <ArrowUpRight className="h-3 w-3 shrink-0" />
          </a>
        </div>
        <StatusBadge status={monitor.status} />
      </div>

      <dl className="grid grid-cols-2 gap-3 px-4 pb-4 text-xs">
        <div>
          <dt className="text-zinc-500">Last checked</dt>
          <dd className="mt-0.5 text-zinc-300" title={fullDate(monitor.lastCheckedAt)}>
            {timeAgo(monitor.lastCheckedAt)}
          </dd>
        </div>
        <div>
          <dt className="text-zinc-500">Last changed</dt>
          <dd className="mt-0.5 text-zinc-300" title={fullDate(monitor.lastChangedAt)}>
            {timeAgo(monitor.lastChangedAt, "No changes yet")}
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-zinc-800/80 px-4 py-2.5">
        <p className="truncate text-xs text-zinc-500">
          Checks {formatInterval(monitor.intervalMins)}
        </p>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={handleCheck}
            disabled={busy}
            className={btnSecondary}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking" : "Check now"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            aria-label={confirming ? `Confirm delete ${monitor.name}` : `Delete ${monitor.name}`}
            className={confirming ? btnDangerActive : btnDanger}
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            {deleting ? "Deleting" : confirming ? "Confirm" : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function MonitorCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col rounded-xl border border-zinc-800/80 bg-zinc-900/40"
    >
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-48 max-w-full" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 pb-4">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3.5 w-20" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-zinc-800/80 px-4 py-2.5">
        <Skeleton className="h-3 w-24" />
        <div className="flex gap-1.5">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}