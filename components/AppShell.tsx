"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { btnPrimary } from "@/lib/styles";
import AddMonitorModal from "./AddMonitorModal";
import Sidebar from "./Sidebar";

interface ShellContextValue {
  /** Opens the "Create monitor" modal. */
  openAddMonitor: () => void;
  /** Increments whenever a monitor is created. Pages refetch when it changes. */
  refreshKey: number;
}

const ShellContext = createContext<ShellContextValue>({
  openAddMonitor: () => {},
  refreshKey: 0,
});

export const useShell = () => useContext(ShellContext);

const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/monitors": "Monitors",
  "/alerts": "Alerts",
};

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const openAddMonitor = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const handleCreated = useCallback(() => setRefreshKey((k) => k + 1), []);

  const ctx = useMemo(
    () => ({ openAddMonitor, refreshKey }),
    [openAddMonitor, refreshKey]
  );

  // Close the mobile drawer on navigation
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Close the mobile drawer with Escape
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const title = TITLES[pathname] ?? "Dashboard";

  return (
    <ShellContext.Provider value={ctx}>
      <div className="min-h-screen">
        {/* Grid background */}
        <div
          aria-hidden="true"
          className="bg-grid pointer-events-none fixed inset-0 z-0 lg:left-60"
        />

        {/* Desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-zinc-800/80 bg-zinc-950 lg:block">
          <Sidebar />
        </aside>

        {/* Mobile drawer */}
        {navOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <div
              className="absolute inset-0 animate-fade-in bg-black/70"
              onClick={() => setNavOpen(false)}
            />
            <aside className="absolute inset-y-0 left-0 w-64 border-r border-zinc-800 bg-zinc-950">
              <Sidebar onNavigate={() => setNavOpen(false)} />
            </aside>
          </div>
        )}

        <div className="relative z-10 lg:pl-60">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-zinc-800/80 bg-zinc-950/70 px-4 backdrop-blur-md sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setNavOpen(true)}
                aria-label="Open navigation"
                className="-ml-1.5 inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="truncate text-sm font-semibold tracking-tight">{title}</h1>
            </div>

            <button
              type="button"
              onClick={openAddMonitor}
              aria-label="Create monitor"
              className={btnPrimary}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create monitor</span>
            </button>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>

        <AddMonitorModal open={modalOpen} onClose={closeModal} onCreated={handleCreated} />
      </div>
    </ShellContext.Provider>
  );
}