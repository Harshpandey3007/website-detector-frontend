"use client";

import { GitCompareArrows, Image as ImageIcon } from "lucide-react";
import type { Snapshot } from "@/lib/api";
import { fullDate, shortAgo } from "@/lib/format";

interface Props {
  /** Newest first, exactly as the API returns them. */
  snapshots: Snapshot[];
  selectedId: string | null;
  /** Snapshots currently shown in the Compare tab. */
  pair: { v1: string; v2: string } | null;
  picked: string[];
  onSelect: (id: string) => void;
  onComparePrev: (id: string) => void;
  onTogglePick: (id: string) => void;
  onCompareSelected: () => void;
}

const mini = "inline-flex h-6 items-center gap-1 rounded px-1.5 text-[11px] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100";

export default function SnapshotTimeline({ snapshots, selectedId, pair, picked, onSelect, onComparePrev, onTogglePick, onCompareSelected }: Props) {
  const total = snapshots.length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium text-zinc-500">Snapshots</h2>
        <span className="text-xs tabular-nums text-zinc-600">{total}</span>
      </div>

      {picked.length === 2 && (
        <button
          type="button"
          onClick={onCompareSelected}
          className="mt-2 flex h-7 w-full items-center justify-center gap-1.5 rounded-md bg-indigo-500 text-[13px] font-medium text-white transition-colors hover:bg-indigo-400"
        >
          <GitCompareArrows className="h-3.5 w-3.5" /> Compare selected
        </button>
      )}

      <ol className="scroll-thin -mx-1 mt-2 max-h-[480px] overflow-y-auto px-1">
        {snapshots.map((s, idx) => {
          const older = snapshots[idx + 1];
          const isBaseline = idx === total - 1;
          const inPair = pair && (pair.v1 === s.id || pair.v2 === s.id);
          const isPicked = picked.includes(s.id);
          const isSelected = selectedId === s.id;

          return (
            <li key={s.id} className="relative pl-5">
              {idx < total - 1 && <span className="absolute bottom-0 left-[5px] top-[18px] w-px bg-zinc-800" aria-hidden="true" />}
              <span
                aria-hidden="true"
                className={`absolute left-0 top-[11px] h-[11px] w-[11px] rounded-full border-[1.5px] ${
                  idx === 0 ? "border-indigo-400 bg-indigo-500" : inPair ? "border-indigo-400 bg-zinc-950" : "border-zinc-600 bg-zinc-950"
                }`}
              />
              <div className={`group mb-0.5 rounded-md px-2 py-1.5 transition-colors ${isSelected ? "bg-zinc-800/70" : "hover:bg-zinc-900"}`}>
                <button type="button" onClick={() => onSelect(s.id)} className="flex w-full items-center justify-between gap-2 text-left">
                  <span className="flex items-center gap-1.5 text-[13px] font-medium text-zinc-100">
                    v{total - idx}
                    {idx === 0 && <span className="rounded bg-indigo-500/15 px-1 text-[10px] font-medium text-indigo-300">Latest</span>}
                    {isBaseline && <span className="rounded bg-zinc-800 px-1 text-[10px] font-medium text-zinc-400">Baseline</span>}
                  </span>
                  <span className="text-xs text-zinc-500" title={fullDate(s.createdAt)}>{shortAgo(s.createdAt)}</span>
                </button>

                <div className="mt-1 hidden items-center gap-0.5 group-hover:flex group-focus-within:flex">
                  <button type="button" onClick={() => onSelect(s.id)} className={mini}><ImageIcon className="h-3 w-3" /> View</button>
                  {older && (
                    <button type="button" onClick={() => onComparePrev(s.id)} className={mini}>
                      <GitCompareArrows className="h-3 w-3" /> vs v{total - idx - 1}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onTogglePick(s.id)}
                    aria-pressed={isPicked}
                    className={`${mini} ml-auto ${isPicked ? "!bg-indigo-500/15 !text-indigo-200" : ""}`}
                  >
                    {isPicked ? "Selected" : "Select"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
