"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Clock, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { checkMonitor, deleteMonitor, getErrorMessage, type Monitor } from "@/lib/api";
import { fullDate, shortAgo, shortInterval } from "@/lib/format";
import { useLive } from "./LiveProvider";
import Skeleton from "./Skeleton";
import { StatusIcon, normalizeStatus } from "./StatusBadge";

/** One dense, Linear-issue-style row. The whole row is a link; actions sit above it and appear on hover. */
export default function MonitorRow({
  monitor,
  onChanged,
  active = false,
}: {
  monitor: Monitor;
  onChanged: () => void;
  /** Highlighted by j/k keyboard navigation. */
  active?: boolean;
}) {
  const { scanning, tick } = useLive();
  const [queued, setQueued] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const tickAtQueue = useRef(0);

  const isScanning = scanning.has(monitor.id);
  const checking = queued || isScanning;
  const host = monitor.url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  // A queued check is done when the live stream reports a finished check (45s fallback)
  useEffect(() => {
    if (queued && tick !== tickAtQueue.current && !isScanning) setQueued(false);
  }, [tick, queued, isScanning]);
  useEffect(() => {
    if (!queued) return;
    const t = setTimeout(() => setQueued(false), 45_000);
    return () => clearTimeout(t);
  }, [queued]);

  async function handleCheck() {
    try {
      await checkMonitor(monitor.id);
      tickAtQueue.current = tick;
      setQueued(true);
      toast.success(`Check queued for ${monitor.name}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return; }
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

  const actionBtn =
    "relative z-10 flex h-6 w-6 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-50";

  return (
    <div
      id={`row-${monitor.id}`}
      className={`group relative flex h-11 items-center gap-3 border-b border-zinc-800/60 px-4 last:border-b-0 transition-colors hover:bg-zinc-900/60 ${active ? "bg-zinc-900/80" : ""}`}
    >
      {active && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-indigo-500" />}
      <Link href={`/monitors/${monitor.id}`} aria-label={`Open ${monitor.name}`} className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400/50" />

      <StatusIcon status={isScanning ? "SCANNING" : normalizeStatus(monitor.status)} />
      <span className="min-w-0 max-w-[40%] truncate text-[13px] font-medium text-zinc-100">{monitor.name}</span>
      <span className="hidden min-w-0 flex-1 truncate text-[13px] text-zinc-500 sm:block">{host}</span>
      <span className="flex-1 sm:hidden" />

      {/* hover actions */}
      <div className={`flex items-center gap-0.5 transition-opacity ${active || confirming ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"}`}>
        <button type="button" onClick={handleCheck} disabled={checking} aria-label={`Check ${monitor.name} now`} title="Check now" className={actionBtn}>
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          aria-label={confirming ? `Confirm delete ${monitor.name}` : `Delete ${monitor.name}`}
          title={confirming ? "Click again to confirm" : "Delete"}
          className={`${actionBtn} ${confirming ? "w-auto bg-red-500/10 px-2 text-xs text-red-300 hover:bg-red-500/20 hover:text-red-200" : "hover:text-red-300"}`}
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : confirming ? "Confirm?" : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      <span className="hidden w-12 shrink-0 items-center gap-1 text-xs text-zinc-500 md:inline-flex" title={`Checks every ${shortInterval(monitor.intervalMins)}`}>
        <Clock className="h-3 w-3" /> {shortInterval(monitor.intervalMins)}
      </span>
      <span className="hidden w-16 shrink-0 text-right text-xs text-zinc-500 md:block" title={`Last changed: ${fullDate(monitor.lastChangedAt) || "never"}`}>
        {isScanning ? <span className="text-indigo-300">Scanning</span> : shortAgo(monitor.lastChangedAt)}
      </span>
      <span className="w-10 shrink-0 text-right text-xs text-zinc-600" title={`Last checked: ${fullDate(monitor.lastCheckedAt) || "never"}`}>
        {shortAgo(monitor.lastCheckedAt)}
      </span>
    </div>
  );
}

export function MonitorRowSkeleton() {
  return (
    <div aria-hidden="true" className="flex h-11 items-center gap-3 border-b border-zinc-800/60 px-4 last:border-b-0">
      <Skeleton className="h-3.5 w-3.5 rounded-full" />
      <Skeleton className="h-3.5 w-40" />
      <Skeleton className="hidden h-3.5 w-56 sm:block" />
      <div className="flex-1" />
      <Skeleton className="h-3.5 w-10" />
    </div>
  );
}
