"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, ChevronDown, LayoutDashboard, Plus, Search, Send } from "lucide-react";
import { getMonitors, type Monitor } from "@/lib/api";
import { useLive } from "./LiveProvider";
import { StatusIcon, normalizeStatus } from "./StatusBadge";

interface SidebarProps {
  onNavigate?: () => void;
  onSearch: () => void;
  onCreate: () => void;
  /** Bumps when a monitor is created, so the list below refetches. */
  refreshKey: number;
}

const NAV = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Alerts", href: "/alerts", icon: Bell },
];
const WORKSPACE = [
  { name: "Monitors", href: "/monitors", icon: Activity },
  { name: "Channels", href: "/settings", icon: Send },
];

const itemCls = (active: boolean) =>
  `flex h-7 items-center gap-2 rounded-md px-2 text-[13px] transition-colors ${
    active ? "bg-zinc-800/80 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
  }`;

export default function Sidebar({ onNavigate, onSearch, onCreate, refreshKey }: SidebarProps) {
  const pathname = usePathname();
  const { connected, scanning, tick } = useLive();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMonitors().then((m) => { if (!cancelled) setMonitors(m); }).catch(() => {});
    return () => { cancelled = true; };
  }, [refreshKey, tick]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href);
  const sorted = [...monitors].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex h-full w-full flex-col">
      {/* workspace header */}
      <div className="flex h-12 shrink-0 items-center justify-between px-3">
        <Link href="/" onClick={onNavigate} className="flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 hover:bg-zinc-800/50">
          <span className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-indigo-500 text-[11px] font-semibold text-white">A</span>
          <span className="truncate text-[13px] font-medium text-zinc-100">Aegis Watch</span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-600" />
        </Link>
        <div className="flex items-center">
          <button type="button" onClick={onSearch} aria-label="Search (⌘K)" className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200">
            <Search className="h-4 w-4" />
          </button>
          <button type="button" onClick={onCreate} aria-label="Create monitor (C)" className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="scroll-thin min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        <div className="space-y-px">
          {NAV.map(({ name, href, icon: Icon }) => (
            <Link key={name} href={href} onClick={onNavigate} className={itemCls(isActive(href))}>
              <Icon className="h-4 w-4" /> {name}
            </Link>
          ))}
        </div>

        <p className="mb-1 mt-5 px-2 text-xs font-medium text-zinc-600">Workspace</p>
        <div className="space-y-px">
          {WORKSPACE.map(({ name, href, icon: Icon }) => (
            <Link key={name} href={href} onClick={onNavigate} className={itemCls(isActive(href))}>
              <Icon className="h-4 w-4" /> {name}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="group mb-1 mt-5 flex w-full items-center gap-1 px-2 text-xs font-medium text-zinc-600 hover:text-zinc-400"
          aria-expanded={open}
        >
          Your monitors
          <ChevronDown className={`h-3 w-3 opacity-0 transition-all group-hover:opacity-100 ${open ? "" : "-rotate-90"}`} />
        </button>
        {open && (
          <div className="space-y-px">
            {sorted.length === 0 && <p className="px-2 py-1 text-xs text-zinc-600">No monitors yet</p>}
            {sorted.slice(0, 14).map((m) => {
              const href = `/monitors/${m.id}`;
              return (
                <Link key={m.id} href={href} onClick={onNavigate} className={itemCls(pathname === href)}>
                  <StatusIcon status={scanning.has(m.id) ? "SCANNING" : normalizeStatus(m.status)} size={13} />
                  <span className="truncate">{m.name}</span>
                </Link>
              );
            })}
            {sorted.length > 14 && (
              <Link href="/monitors" onClick={onNavigate} className="block px-2 py-1 text-xs text-zinc-600 hover:text-zinc-400">
                +{sorted.length - 14} more
              </Link>
            )}
          </div>
        )}
      </nav>

      <div className="flex shrink-0 items-center justify-between border-t border-zinc-800/70 px-4 py-2.5 text-xs">
        <span className="inline-flex items-center gap-1.5 text-zinc-500">
          <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400" : "bg-zinc-600"}`} />
          {connected ? "Live" : "Reconnecting"}
        </span>
        <span className="text-zinc-600"><span className="kbd">⌘</span> <span className="kbd">K</span></span>
      </div>
    </div>
  );
}
