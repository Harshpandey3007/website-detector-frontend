"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowRight, Sparkles } from "lucide-react";
import { API_BASE, API_KEY } from "@/lib/api";

export interface ChangeEvent {
  monitorId: string;
  name: string;
  url: string;
  summary: string;
  snapshotId: string;
  prevSnapshotId: string;
  changePercent: number;
  at: number;
}

interface LiveValue {
  connected: boolean;
  /** Monitor ids being checked right now. */
  scanning: ReadonlySet<string>;
  /** Increments after every finished check; pages refetch when it changes. */
  tick: number;
  lastChange: ChangeEvent | null;
}

const LiveContext = createContext<LiveValue>({ connected: false, scanning: new Set(), tick: 0, lastChange: null });
export const useLive = () => useContext(LiveContext);

/**
 * Real-time updates over Server-Sent Events. EventSource cannot send the x-api-key
 * header, so this reads the stream with fetch() and parses the frames itself.
 */
export function LiveProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [scanning, setScanning] = useState<ReadonlySet<string>>(new Set());
  const [tick, setTick] = useState(0);
  const [lastChange, setLastChange] = useState<ChangeEvent | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    let retry: ReturnType<typeof setTimeout> | undefined;

    const setScan = (id: string, on: boolean) =>
      setScanning((prev) => {
        const next = new Set(prev);
        if (on) next.add(id); else next.delete(id);
        return next;
      });

    function handle(event: string, data: any) {
      if (event === "check:started") setScan(data.monitorId, true);
      if (event === "check:finished") { setScan(data.monitorId, false); setTick((t) => t + 1); }
      if (event === "change:detected") {
        setLastChange({ ...data, at: Date.now() });
        setTick((t) => t + 1);
        toast.custom(
          (t) => (
            <div className={`${t.visible ? "animate-slide-up" : "opacity-0"} pointer-events-auto w-80 rounded-lg border border-zinc-800 bg-zinc-900 p-4 shadow-2xl shadow-indigo-500/10`}>
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" /> Change detected
              </div>
              <p className="mt-1.5 truncate text-sm font-medium text-zinc-100">{data.name}</p>
              <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{data.summary}</p>
              <button
                type="button"
                onClick={() => { toast.dismiss(t.id); router.push(`/monitors/${data.monitorId}?compare=${data.prevSnapshotId}:${data.snapshotId}`); }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-300 hover:text-indigo-200"
              >
                View visual diff <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ),
          { duration: 9000, id: `change-${data.snapshotId}` }
        );
      }
    }

    async function connect() {
      try {
        const res = await fetch(`${API_BASE}/events`, {
          headers: { "x-api-key": API_KEY, Accept: "text/event-stream" },
          signal: ctrl.signal,
          cache: "no-store",
        });
        if (!res.ok || !res.body) throw new Error(`stream failed (${res.status})`);
        setConnected(true);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let i: number;
          while ((i = buf.indexOf("\n\n")) !== -1) {
            const frame = buf.slice(0, i);
            buf = buf.slice(i + 2);
            let event = "message";
            let payload = "";
            for (const line of frame.split("\n")) {
              if (line.startsWith("event:")) event = line.slice(6).trim();
              else if (line.startsWith("data:")) payload += line.slice(5).trim();
            }
            if (payload) {
              try { handle(event, JSON.parse(payload)); } catch { /* ignore malformed frame */ }
            }
          }
        }
      } catch {
        /* network drop or abort: fall through to reconnect */
      }
      setConnected(false);
      if (!ctrl.signal.aborted) retry = setTimeout(connect, 3000);
    }

    connect();
    return () => { ctrl.abort(); clearTimeout(retry); };
  }, [router]);

  const value = useMemo(() => ({ connected, scanning, tick, lastChange }), [connected, scanning, tick, lastChange]);
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}
