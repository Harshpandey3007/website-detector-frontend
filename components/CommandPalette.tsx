"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Activity, Bell, CornerDownLeft, Globe, LayoutDashboard, Plus, Search, Send, type LucideIcon } from "lucide-react";
import { getMonitors, type Monitor } from "@/lib/api";

interface Item { id: string; label: string; hint?: string; icon: LucideIcon; run: () => void }

export default function CommandPalette({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [monitors, setMonitors] = useState<Monitor[]>([]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setActive(0);
    inputRef.current?.focus();
    getMonitors().then(setMonitors).catch(() => {});
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => { router.push(href); onClose(); };
    const base: Item[] = [
      { id: "new", label: "Create monitor", hint: "Action", icon: Plus, run: () => { onClose(); onCreate(); } },
      { id: "dash", label: "Dashboard", hint: "Go to", icon: LayoutDashboard, run: go("/") },
      { id: "mons", label: "Monitors", hint: "Go to", icon: Activity, run: go("/monitors") },
      { id: "alerts", label: "Alerts", hint: "Go to", icon: Bell, run: go("/alerts") },
      { id: "channels", label: "Notification channels", hint: "Go to", icon: Send, run: go("/settings") },
    ];
    const mons: Item[] = monitors.map((m) => ({
      id: `m-${m.id}`,
      label: m.name,
      hint: m.url.replace(/^https?:\/\//, ""),
      icon: Globe,
      run: go(`/monitors/${m.id}`),
    }));
    const needle = q.trim().toLowerCase();
    const all = [...base, ...mons];
    return needle ? all.filter((i) => `${i.label} ${i.hint ?? ""}`.toLowerCase().includes(needle)) : all;
  }, [monitors, q, router, onClose, onCreate]);

  if (!open) return null;

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); items[active]?.run(); }
    else if (e.key === "Escape") onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex animate-fade-in items-start justify-center bg-black/70 px-4 pt-[15vh] backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-label="Command palette"
        className="w-full max-w-lg animate-modal-in overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60">
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={onKeyDown}
            placeholder="Search monitors, jump to a page…"
            className="h-11 w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          />
          <kbd className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-500">ESC</kbd>
        </div>
        <ul className="scroll-thin max-h-80 overflow-y-auto p-2">
          {items.length === 0 && <li className="px-3 py-8 text-center text-sm text-zinc-500">No results</li>}
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={item.run}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${i === active ? "bg-indigo-500/10 text-indigo-200" : "text-zinc-300"}`}
                >
                  <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
                  <span className="truncate">{item.label}</span>
                  {item.hint && <span className="ml-auto truncate text-xs text-zinc-600">{item.hint}</span>}
                  {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-indigo-300" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
