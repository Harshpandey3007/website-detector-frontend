"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getAlerts, getErrorMessage, type Alert } from "@/lib/api";
import { timestamp } from "@/lib/format";
import { useShell } from "@/components/AppShell";
import AlertItem, { AlertItemSkeleton } from "@/components/AlertItem";
import ErrorState from "@/components/ErrorState";

export default function AlertsPage() {
  const { refreshKey } = useShell();
  const [alerts, setAlerts] = useState<Alert[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const retry = () => {
    setError(null);
    load();
  };

  if (error && alerts === null) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  const sorted = alerts
    ? [...alerts].sort((a, b) => timestamp(b.sentAt) - timestamp(a.sentAt))
    : [];

  return (
    <div className="space-y-5">
      <p className="text-sm text-zinc-400">Every change detected across your monitors.</p>
      <div className="overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/40">
        {alerts === null ? (
          <ul className="divide-y divide-zinc-800/60">
            {Array.from({ length: 6 }).map((_, i) => (
              <AlertItemSkeleton key={i} />
            ))}
          </ul>
        ) : sorted.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-medium text-zinc-200">No alerts yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              When a monitor detects a change, the details will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800/60">
            {sorted.map((alert) => (
              <AlertItem key={alert.id} alert={alert} showUrl />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}