"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Loader2, Mail, MessageSquare, Send, XCircle, type LucideIcon } from "lucide-react";
import { getChannels, getErrorMessage, testChannels, type ChannelResult, type ChannelStatus } from "@/lib/api";
import { btnPrimary } from "@/lib/styles";
import ErrorState from "@/components/ErrorState";
import Skeleton from "@/components/Skeleton";

type Key = keyof ChannelStatus;
const CHANNELS: Array<{ key: Key; name: string; blurb: string; env: string; icon: LucideIcon }> = [
  { key: "telegram", name: "Telegram", blurb: "Instant push with the visual diff image and an Open button.", env: "TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID", icon: Send },
  { key: "email", name: "Email", blurb: "HTML email with the AI summary and the diff image inline.", env: "SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_TO", icon: Mail },
  { key: "discord", name: "Discord", blurb: "Webhook message into any channel of your server.", env: "DISCORD_WEBHOOK_URL", icon: MessageSquare },
];

export default function ChannelsPage() {
  const [status, setStatus] = useState<ChannelStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<Partial<Record<Key, ChannelResult>>>({});

  const load = useCallback(async () => {
    try { setStatus(await getChannels()); setError(null); }
    catch (err) { setError(getErrorMessage(err)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function runTest() {
    setTesting(true);
    try {
      const { results: r } = await testChannels();
      setResults(Object.fromEntries(r.map((x) => [x.channel, x])) as Partial<Record<Key, ChannelResult>>);
      const sent = r.filter((x) => x.status === "sent").length;
      if (sent) toast.success(`Test alert sent to ${sent} channel${sent === 1 ? "" : "s"}`);
      else toast.error("No channel delivered the test. Check your .env.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setTesting(false);
    }
  }

  if (error && !status) return <ErrorState message={error} onRetry={() => { setError(null); load(); }} />;

  const anyConfigured = !!status && Object.values(status).some(Boolean);

  return (
    <div className="mx-auto w-full max-w-3xl animate-slide-up px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Notification channels</h2>
          <p className="mt-1 max-w-md text-[13px] text-zinc-500">Every change fans out to all connected channels in parallel. Send a test before you rely on them.</p>
        </div>
        <button type="button" onClick={runTest} disabled={testing || !anyConfigured} className={btnPrimary}>
          {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Send test alert
        </button>
      </div>

      <ul className="mt-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/30">
        {CHANNELS.map(({ key, name, blurb, env, icon: Icon }) => {
          const on = status?.[key];
          const res = results[key];
          return (
            <li key={key} className="flex items-start gap-4 border-b border-zinc-800/60 px-4 py-4 last:border-b-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-300"><Icon className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-zinc-100">{name}</p>
                <p className="mt-0.5 text-[13px] text-zinc-500">{blurb}</p>
                {!on && status !== null && <p className="mt-2 inline-block rounded bg-zinc-900 px-2 py-1 font-mono text-[11px] text-zinc-500">{env}</p>}
                {res && (
                  <p className={`mt-2 inline-flex items-center gap-1.5 text-xs ${res.status === "sent" ? "text-emerald-400" : res.status === "failed" ? "text-red-400" : "text-zinc-500"}`}>
                    {res.status === "sent" ? <CheckCircle2 className="h-3.5 w-3.5" /> : res.status === "failed" ? <XCircle className="h-3.5 w-3.5" /> : null}
                    {res.status === "sent" ? "Test delivered" : res.status === "failed" ? res.error || "Delivery failed" : "Skipped"}
                  </p>
                )}
              </div>
              {status === null ? <Skeleton className="h-5 w-20" /> : (
                <span className={`inline-flex shrink-0 items-center gap-1.5 text-xs ${on ? "text-emerald-400" : "text-zinc-500"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  {on ? "Connected" : "Not set up"}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
