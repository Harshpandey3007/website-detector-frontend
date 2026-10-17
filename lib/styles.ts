const base =
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-50";

export const btnPrimary = `${base} h-9 bg-zinc-100 px-3.5 text-zinc-900 hover:bg-white`;
export const btnSecondary = `${base} h-8 border border-zinc-800 bg-zinc-900 px-3 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800`;
export const btnGhost = `${base} h-9 px-3.5 text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100`;
export const btnDanger = `${base} h-8 px-3 text-zinc-400 hover:bg-red-500/10 hover:text-red-300`;
export const btnDangerActive = `${base} h-8 bg-red-500/10 px-3 text-red-300 hover:bg-red-500/20`;