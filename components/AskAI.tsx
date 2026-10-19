"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { askMonitor, getErrorMessage } from "@/lib/api";

const SUGGESTIONS = [
  "What changed most recently?",
  "Did any prices or numbers change?",
  "Summarize everything that changed so far",
];

interface Turn { q: string; a?: string; error?: string }

export default function AskAI({ monitorId, disabled }: { monitorId: string; disabled?: boolean }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [turns]);

  async function ask(question: string) {
    const q = question.trim();
    if (q.length < 3 || busy) return;
    setBusy(true);
    setInput("");
    setTurns((t) => [...t, { q }]);
    try {
      const { answer } = await askMonitor(monitorId, q);
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, a: answer } : x)));
    } catch (err) {
      setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, error: getErrorMessage(err) } : x)));
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(input);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/30">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <Sparkles className="h-4 w-4 text-indigo-300" />
        <h3 className="text-sm font-medium text-zinc-100">Ask this page&rsquo;s history</h3>
        <span className="ml-auto text-xs text-zinc-600">Gemini · last 6 snapshots</span>
      </div>

      <div className="scroll-thin max-h-[420px] min-h-[220px] space-y-4 overflow-y-auto px-4 py-4">
        {turns.length === 0 && (
          <div className="py-4 text-center">
            <p className="text-sm text-zinc-400">Ask anything about how this page has changed over time.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={disabled || busy}
                  onClick={() => ask(s)}
                  className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-indigo-500/40 hover:text-indigo-200 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {turns.map((t, i) => (
          <div key={i} className="space-y-2">
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-indigo-500/20 px-3.5 py-2 text-sm text-indigo-100">{t.q}</div>
            <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm leading-relaxed text-zinc-200">
              {t.error ? (
                <span className="text-red-300">{t.error}</span>
              ) : t.a ? (
                t.a
              ) : (
                <span className="inline-flex items-center gap-2 text-zinc-500"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Reading the snapshots…</span>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-zinc-800 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={300}
          disabled={disabled || busy}
          placeholder={disabled ? "Run a check first to create a snapshot" : "e.g. Did the price go down?"}
          className="h-8 flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || busy || input.trim().length < 3}
          aria-label="Send question"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500 text-white transition-colors hover:bg-indigo-400 disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
