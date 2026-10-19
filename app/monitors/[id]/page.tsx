"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowUpRight, Camera, ChevronLeft, ExternalLink, GitCompareArrows, RefreshCw, Sparkles } from "lucide-react";
import {
  assetUrl, checkMonitor, getErrorMessage, getHistory, getMonitor,
  type Monitor, type Snapshot,
} from "@/lib/api";
import { formatInterval, fullDate, timeAgo } from "@/lib/format";
import { btnSecondary } from "@/lib/styles";
import { useLive } from "@/components/LiveProvider";
import ActivityChart from "@/components/ActivityChart";
import AskAI from "@/components/AskAI";
import CompareView from "@/components/CompareView";
import ErrorState from "@/components/ErrorState";
import Skeleton from "@/components/Skeleton";
import SnapshotTimeline from "@/components/SnapshotTimeline";
import StatusBadge from "@/components/StatusBadge";

type Tab = "snapshot" | "compare" | "ask";
type Pair = { v1: string; v2: string };

const TABS: Array<{ id: Tab; label: string; icon: typeof Camera }> = [
  { id: "compare", label: "Compare", icon: GitCompareArrows },
  { id: "snapshot", label: "Screenshot", icon: Camera },
  { id: "ask", label: "Ask AI", icon: Sparkles },
];

function Prop({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1.5 text-[13px]">
      <dt className="w-24 shrink-0 text-zinc-500">{label}</dt>
      <dd className="min-w-0 flex-1 truncate text-zinc-200">{children}</dd>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="lg:flex" aria-busy="true">
      <div className="flex-1 space-y-4 px-6 py-5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-80" />
        <Skeleton className="h-96 w-full" />
      </div>
      <div className="space-y-3 border-zinc-800 px-4 py-5 lg:w-72 lg:border-l">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
      </div>
    </div>
  );
}

function MonitorDetail() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const { scanning, tick, lastChange } = useLive();

  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [history, setHistory] = useState<Snapshot[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("snapshot");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pair, setPair] = useState<Pair | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [queued, setQueued] = useState(false);

  const initialised = useRef(false);
  const handledChange = useRef(0);
  const mountedAt = useRef(Date.now());

  const load = useCallback(async () => {
    try {
      const [m, h] = await Promise.all([getMonitor(id), getHistory(id)]);
      setMonitor(m);
      setHistory(h);
      setError(null);
      return h;
    } catch (err) {
      setError(getErrorMessage(err));
      return null;
    }
  }, [id]);

  // Newest-first index, used to order a pair so v1 is always the older snapshot.
  const indexOf = useMemo(() => new Map((history ?? []).map((s, i): [string, number] => [s.id, i])), [history]);
  const orderPair = useCallback(
    (a: string, b: string): Pair => ((indexOf.get(a) ?? 0) > (indexOf.get(b) ?? 0) ? { v1: a, v2: b } : { v1: b, v2: a }),
    [indexOf]
  );

  // Initial load, and a refetch whenever the live stream reports a finished check
  useEffect(() => { load(); }, [load, tick]);

  // First time the history arrives: honour ?compare=a:b (from alert links), else show the latest change
  useEffect(() => {
    if (!history || initialised.current) return;
    initialised.current = true;
    setSelectedId(history[0]?.id ?? null);

    const [a, b] = (search.get("compare") ?? "").split(":");
    if (a && b && indexOf.has(a) && indexOf.has(b)) {
      setPair(orderPair(a, b));
      setTab("compare");
    } else if (history.length >= 2) {
      setPair({ v1: history[1].id, v2: history[0].id });
      setTab("compare");
    }
  }, [history, indexOf, orderPair, search]);

  // A change detected live for THIS monitor: jump straight to its visual diff
  useEffect(() => {
    // ignore changes that happened before this page opened (those arrive via ?compare=)
    if (!lastChange || lastChange.monitorId !== id || lastChange.at < mountedAt.current || lastChange.at === handledChange.current) return;
    handledChange.current = lastChange.at;
    load().then(() => {
      setPair({ v1: lastChange.prevSnapshotId, v2: lastChange.snapshotId });
      setSelectedId(lastChange.snapshotId);
      setTab("compare");
    });
  }, [lastChange, id, load]);

  // "Checking…" ends when the live stream reports a finished check (or after 45s)
  const isScanning = scanning.has(id);
  const tickAtQueue = useRef(0);
  useEffect(() => { if (queued && tick !== tickAtQueue.current && !isScanning) setQueued(false); }, [tick, queued, isScanning]);
  useEffect(() => {
    if (!queued) return;
    const t = setTimeout(() => setQueued(false), 45_000);
    return () => clearTimeout(t);
  }, [queued]);

  async function handleCheck() {
    try {
      await checkMonitor(id);
      tickAtQueue.current = tick;
      setQueued(true);
      toast.success("Check queued. Results appear here live.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  function comparePrev(snapId: string) {
    const idx = indexOf.get(snapId);
    const older = idx === undefined ? undefined : history?.[idx + 1];
    if (!older) return;
    setPair({ v1: older.id, v2: snapId });
    setTab("compare");
  }

  function togglePick(snapId: string) {
    setPicked((p) => (p.includes(snapId) ? p.filter((x) => x !== snapId) : p.length >= 2 ? [p[1], snapId] : [...p, snapId]));
  }

  function compareSelected() {
    if (picked.length !== 2) return;
    setPair(orderPair(picked[0], picked[1]));
    setPicked([]);
    setTab("compare");
  }

  if (error && !monitor) return <ErrorState message={error} onRetry={() => { setError(null); load(); }} />;
  if (!monitor || !history) return <PageSkeleton />;

  const selected = history.find((s) => s.id === selectedId) ?? history[0];
  const adjacent = pair ? (indexOf.get(pair.v1) ?? -2) === (indexOf.get(pair.v2) ?? -9) + 1 : false;
  const checking = queued || isScanning;
  const latest = history[0];

  return (
    <div className="animate-fade-in lg:flex">
      {/* ───────── main column ───────── */}
      <div className="min-w-0 flex-1 px-6 py-5">
        <Link href="/monitors" className="inline-flex items-center gap-0.5 text-xs text-zinc-500 transition-colors hover:text-zinc-200">
          <ChevronLeft className="h-3.5 w-3.5" /> Monitors
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-semibold tracking-tight">{monitor.name}</h2>
            <a href={monitor.url} target="_blank" rel="noopener noreferrer"
              className="mt-1 inline-flex max-w-full items-center gap-1 text-[13px] text-zinc-500 transition-colors hover:text-zinc-300">
              <span className="truncate">{monitor.url}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
            </a>
          </div>
          <button type="button" onClick={handleCheck} disabled={checking} className={btnSecondary}>
            <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking…" : "Check now"}
          </button>
        </div>

        {history.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-lg border border-dashed border-zinc-800 px-6 py-16 text-center">
            <Camera className="h-5 w-5 text-zinc-600" />
            <p className="mt-3 text-[13px] font-medium text-zinc-200">No snapshots yet</p>
            <p className="mt-1 text-[13px] text-zinc-500">The first check is queued automatically. Press &ldquo;Check now&rdquo; to run it immediately.</p>
          </div>
        ) : (
          <>
            <div role="tablist" aria-label="Views" className="mt-6 flex gap-5 border-b border-zinc-800">
              {TABS.map(({ id: tid, label, icon: Icon }) => (
                <button
                  key={tid}
                  role="tab"
                  aria-selected={tab === tid}
                  type="button"
                  onClick={() => setTab(tid)}
                  className={`-mb-px inline-flex items-center gap-1.5 border-b-2 pb-2.5 text-[13px] font-medium transition-colors ${
                    tab === tid ? "border-indigo-500 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-4">
              {tab === "snapshot" && selected && (
                <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900/50 px-3 py-2">
                    <span className="shrink-0 text-xs font-medium text-zinc-300">v{history.length - (indexOf.get(selected.id) ?? 0)}</span>
                    <span className="min-w-0 flex-1 truncate text-xs text-zinc-500">{fullDate(selected.createdAt)}</span>
                    {selected.id === latest.id && <span className="rounded bg-indigo-500/15 px-1.5 text-[10px] font-medium text-indigo-300">Latest</span>}
                    <a href={assetUrl(selected.imagePath) ?? "#"} target="_blank" rel="noopener noreferrer" aria-label="Open screenshot in a new tab"
                      className="text-zinc-500 transition-colors hover:text-zinc-200">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <div className="scroll-thin max-h-[680px] overflow-auto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={assetUrl(selected.imagePath) ?? ""} alt={`Screenshot from ${fullDate(selected.createdAt)}`} className="block w-full" />
                  </div>
                </div>
              )}

              {tab === "compare" &&
                (pair ? (
                  <CompareView monitorId={id} v1={pair.v1} v2={pair.v2} adjacent={adjacent} />
                ) : (
                  <div className="flex flex-col items-center rounded-lg border border-dashed border-zinc-800 px-6 py-14 text-center">
                    <GitCompareArrows className="h-5 w-5 text-zinc-600" />
                    <p className="mt-3 text-[13px] font-medium text-zinc-200">Pick two snapshots to compare</p>
                    <p className="mt-1 max-w-sm text-[13px] text-zinc-500">
                      Use &ldquo;vs previous&rdquo; on a snapshot, or select two. You need at least two snapshots, which means the page must change once.
                    </p>
                  </div>
                ))}

              {tab === "ask" && <AskAI monitorId={id} disabled={history.length === 0} />}
            </div>
          </>
        )}
      </div>

      {/* ───────── properties panel (Linear issue sidebar) ───────── */}
      <aside className="scroll-thin shrink-0 space-y-6 border-t border-zinc-800 px-4 py-5 lg:sticky lg:top-0 lg:max-h-[calc(100dvh-4.5rem)] lg:w-72 lg:self-start lg:overflow-y-auto lg:border-l lg:border-t-0">
        <section aria-label="Properties">
          <h3 className="mb-1 text-xs font-medium text-zinc-500">Properties</h3>
          <dl>
            <Prop label="Status"><StatusBadge status={monitor.status} scanning={isScanning} /></Prop>
            <Prop label="Checks">{formatInterval(monitor.intervalMins)}</Prop>
            <Prop label="Alert at">{monitor.sensitivity === undefined ? "n/a" : monitor.sensitivity === 0 ? "Any change" : `≥ ${monitor.sensitivity}% changed`}</Prop>
            <Prop label="Last checked"><span title={fullDate(monitor.lastCheckedAt)}>{timeAgo(monitor.lastCheckedAt)}</span></Prop>
            <Prop label="Last changed"><span title={fullDate(monitor.lastChangedAt)}>{timeAgo(monitor.lastChangedAt, "No changes yet")}</span></Prop>
            <Prop label="Snapshots">{history.length}</Prop>
          </dl>
        </section>

        {history.length > 0 && (
          <>
            <section aria-label="Activity">
              <ActivityChart dates={history.map((s) => s.createdAt)} label="Snapshots per day" />
            </section>
            <section aria-label="Snapshots">
              <SnapshotTimeline
                snapshots={history}
                selectedId={selected?.id ?? null}
                pair={pair}
                picked={picked}
                onSelect={(sid) => { setSelectedId(sid); setTab("snapshot"); }}
                onComparePrev={comparePrev}
                onTogglePick={togglePick}
                onCompareSelected={compareSelected}
              />
            </section>
          </>
        )}
      </aside>
    </div>
  );
}

// useSearchParams() must sit under a Suspense boundary for `next build`
export default function MonitorDetailPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MonitorDetail />
    </Suspense>
  );
}
