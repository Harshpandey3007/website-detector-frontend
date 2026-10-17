import { Bell } from "lucide-react";
import type { Alert } from "@/lib/api";
import { fullDate, timeAgo } from "@/lib/format";
import Skeleton from "./Skeleton";

export default function AlertItem({
  alert,
  showUrl = false,
}: {
  alert: Alert;
  showUrl?: boolean;
}) {
  return (
    <li className="flex gap-3 px-4 py-3.5 sm:px-5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400">
        <Bell className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-medium text-zinc-100">
            {alert.monitor?.name ?? "Deleted monitor"}
          </p>
          <time
            dateTime={alert.sentAt}
            title={fullDate(alert.sentAt)}
            className="shrink-0 text-xs text-zinc-500"
          >
            {timeAgo(alert.sentAt)}
          </time>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{alert.summary}</p>
        {showUrl && alert.monitor?.url && (
          <p className="mt-1 truncate text-xs text-zinc-600">{alert.monitor.url}</p>
        )}
      </div>
    </li>
  );
}

export function AlertItemSkeleton() {
  return (
    <li className="flex gap-3 px-4 py-3.5 sm:px-5" aria-hidden="true">
      <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex justify-between gap-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-3.5 w-full max-w-md" />
      </div>
    </li>
  );
}