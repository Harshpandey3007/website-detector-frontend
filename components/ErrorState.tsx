import { AlertTriangle, RefreshCw } from "lucide-react";
import { btnSecondary } from "@/lib/styles";

export default function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-red-500/20 bg-red-500/5 px-6 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-red-400">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="mt-4 text-sm font-medium text-zinc-100">Couldn&rsquo;t load your data</h2>
      <p className="mt-1 max-w-md text-sm text-zinc-400">{message}</p>
      <button type="button" onClick={onRetry} className={`${btnSecondary} mt-5`}>
        <RefreshCw className="h-3.5 w-3.5" />
        Try again
      </button>
    </div>
  );
}