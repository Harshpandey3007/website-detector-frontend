"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Globe, Plus } from "lucide-react";
import { getErrorMessage, getMonitors, type Monitor } from "@/lib/api";
import { btnPrimary } from "@/lib/styles";
import { useShell } from "@/components/AppShell";
import ErrorState from "@/components/ErrorState";
import MonitorCard, { MonitorCardSkeleton } from "@/components/MonitorCard";
import Skeleton from "@/components/Skeleton";

export default function MonitorsPage() {
  const { refreshKey, openAddMonitor } = useShell();
  const [monitors, setMonitors] = useState<Monitor[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const retry = () => {
    setError(null);
    load();
  };

  if (error && monitors === null) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  if (monitors === null) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-4 w-44" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MonitorCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (monitors.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400">
          <Globe className="h-5 w-5" />
        </div>
        <h2 className="mt-5 text-base font-semibold tracking-tight">No monitors yet</h2>
        <p className="mt-1.5 max-w-sm text-sm text-zinc-400">
          Add a page you want to keep an eye on. We&rsquo;ll check it on a schedule and alert you
          when something changes.
        </p>
        <button type="button" onClick={openAddMonitor} className={`${btnPrimary} mt-6`}>
          <Plus className="h-4 w-4" />
          Create monitor
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-400">
        {monitors.length} {monitors.length === 1 ? "page" : "pages"} being watched for changes.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {monitors.map((m) => (
          <MonitorCard key={m.id} monitor={m} onChanged={load} />
        ))}
      </div>
    </div>
  );
}