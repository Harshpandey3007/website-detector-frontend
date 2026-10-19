"use client";

import { useEffect, useMemo, useState } from "react";
import { Columns2, FileText, Flame, ImageOff, Info, Loader2, SlidersHorizontal } from "lucide-react";
import { assetUrl, compareSnapshots, getErrorMessage, type CompareResult } from "@/lib/api";
import { fullDate } from "@/lib/format";
import Skeleton from "./Skeleton";

type Mode = "split" | "swipe" | "heatmap" | "text";

const MODES: Array<{ id: Mode; label: string; icon: typeof Columns2 }> = [
  { id: "split", label: "Side by side", icon: Columns2 },
  { id: "swipe", label: "Swipe", icon: SlidersHorizontal },
  { id: "heatmap", label: "Pixel diff", icon: Flame },
  { id: "text", label: "Text diff", icon: FileText },
];

interface Props {
  monitorId: string;
  /** Older snapshot id */
  v1: string;
  /** Newer snapshot id */
  v2: string;
  /** True when v1 is the snapshot immediately before v2 (the stored pixel diff only describes that pair). */
  adjacent: boolean;
}

/* ───────── text diff: parse the API's <ins>/<del>/<span> HTML into React nodes (no innerHTML) ───────── */

type Seg = { kind: "ins" | "del" | "same"; text: string };

function parseDiff(html: string): Seg[] {
  const out: Seg[] = [];
  const re = /<(ins|del|span)>([\s\S]*?)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    out.push({ kind: m[1] === "span" ? "same" : (m[1] as "ins" | "del"), text: m[2].replace(/&lt;/g, "<") });
  }
  return out;
}

const CONTEXT = 110;

function TextDiff({ html }: { html: string }) {
  const [full, setFull] = useState(false);
  const segs = useMemo(() => parseDiff(html), [html]);
  const changes = segs.filter((s) => s.kind !== "same");

  if (changes.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-zinc-500">No textual differences between these two snapshots.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-emerald-300"><span className="h-2 w-2 rounded-sm bg-emerald-400" /> Added</span>
          <span className="inline-flex items-center gap-1.5 text-red-300"><span className="h-2 w-2 rounded-sm bg-red-400" /> Removed</span>
        </div>
        <button type="button" onClick={() => setFull((f) => !f)} className="text-zinc-400 hover:text-zinc-100">
          {full ? "Collapse unchanged text" : "Show full text"}
        </button>
      </div>
      <p className="scroll-thin max-h-[560px] overflow-y-auto whitespace-pre-wrap break-words px-4 py-4 font-mono text-[13px] leading-7 text-zinc-400">
        {segs.map((s, i) => {
          if (s.kind === "ins")
            return <ins key={i} className="rounded bg-emerald-500/15 px-0.5 text-emerald-300 no-underline">{s.text}</ins>;
          if (s.kind === "del")
            return <del key={i} className="rounded bg-red-500/15 px-0.5 text-red-300 decoration-red-400/60">{s.text}</del>;
          if (full || s.text.length <= CONTEXT * 2 + 40) return <span key={i}>{s.text}</span>;
          const hidden = s.text.length - CONTEXT * 2;
          const head = s.text.slice(0, CONTEXT);
          const tail = s.text.slice(-CONTEXT);
          const chip = (
            <span className="mx-1 rounded-full border border-zinc-800 bg-zinc-900 px-2 py-0.5 font-sans text-[10px] text-zinc-500">
              {hidden.toLocaleString()} unchanged characters
            </span>
          );
          if (i === 0) return <span key={i}>{chip}{tail}</span>;
          if (i === segs.length - 1) return <span key={i}>{head}{chip}</span>;
          return <span key={i}>{head}{chip}{tail}</span>;
        })}
      </p>
    </div>
  );
}

/* ───────── image panes ───────── */

function Shot({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 text-zinc-600">
        <ImageOff className="h-5 w-5" />
        <span className="text-xs">No screenshot stored</span>
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className="block w-full" />;
}

function Pane({ label, date, tone, src }: { label: string; date: string; tone: "red" | "emerald"; src: string | null }) {
  const chip = tone === "red" ? "bg-red-500/15 text-red-300" : "bg-emerald-500/15 text-emerald-300";
  return (
    <div className="min-w-0 bg-zinc-950">
      <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-950/90 px-3 py-2 backdrop-blur">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chip}`}>{label}</span>
        <span className="truncate text-[11px] text-zinc-500">{date}</span>
      </div>
      <Shot src={src} alt={`${label} screenshot`} />
    </div>
  );
}

export default function CompareView({ monitorId, v1, v2, adjacent }: Props) {
  const [data, setData] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("split");
  const [pos, setPos] = useState(50);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    compareSnapshots(monitorId, v1, v2)
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(getErrorMessage(e)); });
    return () => { cancelled = true; };
  }, [monitorId, v1, v2]);

  if (error) {
    return <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-5 py-8 text-center text-sm text-red-300">{error}</div>;
  }

  if (!data) {
    return (
      <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/30 p-4" aria-busy="true">
        <div className="flex items-center gap-2 text-xs text-zinc-500"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading comparison…</div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  const before = assetUrl(data.v1.image);
  const after = assetUrl(data.v2.image);
  const heat = assetUrl(data.visualDiff);
  const pct = data.diff.changeRatio * 100;

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/30">
      {/* summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-100">
            {pct.toFixed(1)}% of the page text changed
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">{data.diff.summary} · {fullDate(data.v1.createdAt)} → {fullDate(data.v2.createdAt)}</p>
        </div>
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-zinc-800" aria-hidden="true">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, Math.max(3, pct))}%` }} />
        </div>
      </div>

      {/* mode switcher */}
      <div role="tablist" aria-label="Comparison mode" className="flex gap-1 overflow-x-auto border-b border-zinc-800 p-2">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={mode === id}
            type="button"
            onClick={() => setMode(id)}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {mode === "split" && (
        <div className="scroll-thin grid max-h-[640px] grid-cols-2 gap-px overflow-y-auto bg-zinc-800">
          <Pane label="Before" date={fullDate(data.v1.createdAt)} tone="red" src={before} />
          <Pane label="After" date={fullDate(data.v2.createdAt)} tone="emerald" src={after} />
        </div>
      )}

      {mode === "swipe" && (
        <div>
          <div className="scroll-thin max-h-[600px] overflow-y-auto bg-zinc-950">
            <div className="relative">
              <Shot src={after} alt="After screenshot" />
              <div className="absolute inset-x-0 top-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
                <Shot src={before} alt="Before screenshot" />
              </div>
              <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.9)]" style={{ left: `${pos}%` }} />
              <span className="pointer-events-none absolute left-2 top-2 rounded bg-red-500/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">Before</span>
              <span className="pointer-events-none absolute right-2 top-2 rounded bg-emerald-500/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">After</span>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-zinc-800 px-4 py-3">
            <span className="text-xs text-zinc-500">Before</span>
            <input
              type="range" min={0} max={100} value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              aria-label="Swipe between before and after"
              className="range flex-1"
              style={{ background: `linear-gradient(to right, #6366f1 ${pos}%, #27272a ${pos}%)` }}
            />
            <span className="text-xs text-zinc-500">After</span>
          </div>
        </div>
      )}

      {mode === "heatmap" && (
        <div>
          {!adjacent && (
            <div className="flex items-start gap-2 border-b border-amber-500/20 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-300">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              The stored pixel diff compares the newer snapshot with the one right before it, not with the older snapshot you picked.
            </div>
          )}
          <div className="scroll-thin max-h-[640px] overflow-y-auto bg-zinc-100">
            <Shot src={heat} alt="Pixel difference heatmap" />
          </div>
          <p className="border-t border-zinc-800 px-4 py-2.5 text-xs text-zinc-500">Red marks every pixel that differs between the two screenshots.</p>
        </div>
      )}

      {mode === "text" && <TextDiff html={data.diff.html} />}
    </div>
  );
}
