// Linear-style controls: 28px high, 13px text, 6px radius, one accent color.
const base =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 disabled:pointer-events-none disabled:opacity-50";

export const btnPrimary = `${base} h-7 bg-indigo-500 px-2.5 text-white hover:bg-indigo-400`;
export const btnAccent = btnPrimary;
export const btnSecondary = `${base} h-7 border border-zinc-800 bg-zinc-900 px-2.5 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800`;
export const btnGhost = `${base} h-7 px-2.5 text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100`;
export const btnIcon = `${base} h-7 w-7 text-zinc-500 hover:bg-zinc-800/70 hover:text-zinc-100`;
export const btnDanger = `${base} h-7 px-2.5 text-zinc-400 hover:bg-red-500/10 hover:text-red-300`;
export const btnDangerActive = `${base} h-7 bg-red-500/10 px-2.5 text-red-300 hover:bg-red-500/20`;

export const card = "rounded-lg border border-zinc-800 bg-zinc-900/40";
export const inputCls =
  "h-8 w-full rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 text-[13px] text-zinc-100 placeholder:text-zinc-600 transition-colors focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
