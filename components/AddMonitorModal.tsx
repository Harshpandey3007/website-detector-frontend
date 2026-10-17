"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { ChevronDown, Loader2, X } from "lucide-react";
import { createMonitor, getErrorMessage } from "@/lib/api";
import { btnGhost, btnPrimary } from "@/lib/styles";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const INTERVALS = [
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 60, label: "Every hour" },
  { value: 1440, label: "Every day" },
];

const inputBase =
  "h-10 w-full rounded-md border bg-zinc-900/60 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-500/50 disabled:opacity-60";
const inputCls = (hasError: boolean) =>
  `${inputBase} ${hasError ? "border-red-500/60" : "border-zinc-800 focus:border-zinc-600"}`;

function normalizeUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const u = new URL(withScheme);
    if (!u.hostname.includes(".") && u.hostname !== "localhost") return null;
    return u.toString();
  } catch {
    return null;
  }
}

export default function AddMonitorModal({ open, onClose, onCreated }: Props) {
  const uid = useId();
  const nameRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [intervalMins, setIntervalMins] = useState(60);
  const [sensitivity, setSensitivity] = useState(50);
  const [errors, setErrors] = useState<{ name?: string; url?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  // Reset the form and focus the first field each time the modal opens
  useEffect(() => {
    if (!open) return;
    setName("");
    setUrl("");
    setIntervalMins(60);
    setSensitivity(50);
    setErrors({});
    setSubmitting(false);
    const t = setTimeout(() => nameRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  // Escape to close and lock page scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, submitting, onClose]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const cleanName = name.trim();
    const normalizedUrl = normalizeUrl(url);
    const next: { name?: string; url?: string } = {};

    if (!cleanName) next.name = "Enter a name for this monitor.";
    if (!url.trim()) next.url = "Enter the URL of the page to watch.";
    else if (!normalizedUrl) next.url = "Enter a valid URL, like https://example.com/pricing.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await createMonitor({
        name: cleanName,
        url: normalizedUrl as string,
        intervalMins,
        sensitivity,
      });
      toast.success("Monitor created");
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  const nameId = `${uid}-name`;
  const urlId = `${uid}-url`;
  const intervalId = `${uid}-interval`;
  const sensitivityId = `${uid}-sensitivity`;
  const titleId = `${uid}-title`;

  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[92vh] w-full max-w-md animate-modal-in overflow-y-auto rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800/80 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold tracking-tight">
              Create monitor
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              We&rsquo;ll check this page on a schedule and alert you when it changes.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="-mr-1.5 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5 px-5 py-5">
          <div>
            <label htmlFor={nameId} className="mb-1.5 block text-sm font-medium text-zinc-200">
              Name
            </label>
            <input
              ref={nameRef}
              id={nameId}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pricing page"
              disabled={submitting}
              autoComplete="off"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? `${nameId}-error` : undefined}
              className={inputCls(!!errors.name)}
            />
            {errors.name && (
              <p id={`${nameId}-error`} className="mt-1.5 text-xs text-red-400">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={urlId} className="mb-1.5 block text-sm font-medium text-zinc-200">
              URL
            </label>
            <input
              id={urlId}
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/pricing"
              disabled={submitting}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-invalid={!!errors.url}
              aria-describedby={errors.url ? `${urlId}-error` : undefined}
              className={inputCls(!!errors.url)}
            />
            {errors.url && (
              <p id={`${urlId}-error`} className="mt-1.5 text-xs text-red-400">
                {errors.url}
              </p>
            )}
          </div>

          <div>
            <label htmlFor={intervalId} className="mb-1.5 block text-sm font-medium text-zinc-200">
              Check interval
            </label>
            <div className="relative">
              <select
                id={intervalId}
                value={intervalMins}
                onChange={(e) => setIntervalMins(Number(e.target.value))}
                disabled={submitting}
                className={`${inputCls(false)} appearance-none pr-9`}
              >
                {INTERVALS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            </div>
          </div>

          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <label htmlFor={sensitivityId} className="text-sm font-medium text-zinc-200">
                Sensitivity
              </label>
              <span className="text-sm tabular-nums text-zinc-400">{sensitivity}%</span>
            </div>
            <input
              id={sensitivityId}
              type="range"
              min={1}
              max={100}
              step={1}
              value={sensitivity}
              onChange={(e) => setSensitivity(Number(e.target.value))}
              disabled={submitting}
              className="range w-full"
              style={{
                background: `linear-gradient(to right, #e4e4e7 ${sensitivity}%, #27272a ${sensitivity}%)`,
              }}
            />
            <p className="mt-2 text-xs text-zinc-500">
              Higher sensitivity flags smaller changes on the page.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={submitting} className={btnGhost}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className={btnPrimary}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Creating monitor" : "Create monitor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
