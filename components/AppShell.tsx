"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Menu, Plus } from "lucide-react";
import { btnPrimary } from "@/lib/styles";
import AddMonitorModal from "./AddMonitorModal";
import CommandPalette from "./CommandPalette";
import Sidebar from "./Sidebar";

interface ShellContextValue {
  /** Opens the "Create monitor" modal. */
  openAddMonitor: () => void;
  /** Increments whenever a monitor is created. Pages refetch when it changes. */
  refreshKey: number;
}

const ShellContext = createContext<ShellContextValue>({ openAddMonitor: () => {}, refreshKey: 0 });
export const useShell = () => useContext(ShellContext);

const TITLES: Record<string, string> = {
  "/": "Overview",
  "/monitors": "Monitors",
  "/alerts": "Alerts",
  "/settings": "Channels",
};

const titleFor = (pathname: string) =>
  TITLES[pathname] ?? (pathname.startsWith("/monitors/") ? "Monitors" : "Overview");

/** True when the keystroke is going into a form control, so single-key shortcuts must not fire. */
const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
};

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const gPressedAt = useRef(0);

  const openAddMonitor = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const handleCreated = useCallback(() => setRefreshKey((k) => k + 1), []);

  const ctx = useMemo(() => ({ openAddMonitor, refreshKey }), [openAddMonitor, refreshKey]);

  useEffect(() => { setNavOpen(false); }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setNavOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen]);

  // Keyboard-first, like Linear:  ⌘K palette · C create · G then O/M/A/C to navigate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || modalOpen || paletteOpen) return;

      const key = e.key.toLowerCase();
      if (key === "c") { e.preventDefault(); setModalOpen(true); return; }
      if (key === "g") { gPressedAt.current = Date.now(); return; }
      if (Date.now() - gPressedAt.current < 1200) {
        const dest: Record<string, string> = { o: "/", m: "/monitors", a: "/alerts", c: "/settings" };
        if (dest[key]) { e.preventDefault(); gPressedAt.current = 0; router.push(dest[key]); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router, modalOpen, paletteOpen]);

  const sidebar = (onNavigate?: () => void) => (
    <Sidebar onNavigate={onNavigate} onSearch={openPalette} onCreate={openAddMonitor} refreshKey={refreshKey} />
  );

  return (
    <ShellContext.Provider value={ctx}>
      <div className="flex h-dvh bg-canvas text-zinc-100">
        <aside className="hidden w-60 shrink-0 lg:block">{sidebar()}</aside>

        {navOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <div className="absolute inset-0 animate-fade-in bg-black/70" onClick={() => setNavOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-64 border-r border-zinc-800 bg-canvas">{sidebar(() => setNavOpen(false))}</aside>
          </div>
        )}

        {/* Content lives in an inset, bordered panel, the signature Linear layout */}
        <div className="flex min-w-0 flex-1 flex-col lg:py-2 lg:pr-2">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-950 lg:rounded-lg lg:border lg:border-zinc-800">
            <header className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
              <div className="flex min-w-0 items-center gap-2 text-[13px]">
                <button
                  type="button"
                  onClick={() => setNavOpen(true)}
                  aria-label="Open navigation"
                  className="-ml-1.5 flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100 lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <span className="hidden text-zinc-500 sm:inline">Aegis Watch</span>
                <ChevronRight className="hidden h-3.5 w-3.5 text-zinc-700 sm:inline" />
                <h1 className="truncate font-medium text-zinc-100">{titleFor(pathname)}</h1>
              </div>
              <button type="button" onClick={openAddMonitor} aria-label="Create monitor" className={btnPrimary}>
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New monitor</span>
              </button>
            </header>

            <main className="scroll-thin min-h-0 flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>

        <AddMonitorModal open={modalOpen} onClose={closeModal} onCreated={handleCreated} />
        <CommandPalette open={paletteOpen} onClose={closePalette} onCreate={openAddMonitor} />
      </div>
    </ShellContext.Provider>
  );
}
