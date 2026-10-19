import Link from "next/link";
import { AlertTriangle, Bell } from "lucide-react";
import type { Alert } from "@/lib/api";
import { fullDate, shortAgo } from "@/lib/format";
import Skeleton from "./Skeleton";

/** Compact inbox-style row: icon · monitor · summary (one line) · age. */
export default function AlertItem({ alert, showUrl = false }: { alert: Alert; showUrl?: boolean }) {
  const isStatus = alert.kind === "status";
  const Icon = isStatus ? AlertTriangle : Bell;

  const body = (
    <>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${isStatus ? "text-amber-400" : "text-indigo-300"}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="shrink-0 max-w-[40%] truncate text-[13px] font-medium text-zinc-100">{alert.monitor?.name ?? "Deleted monitor"}</p>
          <p className="min-w-0 flex-1 truncate text-[13px] text-zinc-400">{alert.summary}</p>
          <time dateTime={alert.sentAt} title={fullDate(alert.sentAt)} className="shrink-0 text-xs text-zinc-500">
            {shortAgo(alert.sentAt)}
          </time>
        </div>
        {showUrl && alert.monitor?.url && <p className="mt-0.5 truncate text-xs text-zinc-600">{alert.monitor.url}</p>}
      </div>
    </>
  );

  const cls = "flex gap-3 px-4 py-2.5";
  return (
    <li className="border-b border-zinc-800/60 last:border-b-0">
      {alert.monitor && alert.monitorId ? (
        <Link href={`/monitors/${alert.monitorId}`} className={`${cls} transition-colors hover:bg-zinc-900/60`}>
          {body}
        </Link>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </li>
  );
}

export function AlertItemSkeleton() {
  return (
    <li className="flex items-center gap-3 border-b border-zinc-800/60 px-4 py-3 last:border-b-0" aria-hidden="true">
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-3.5 w-32" />
      <Skeleton className="h-3.5 w-full max-w-md" />
    </li>
  );
}
