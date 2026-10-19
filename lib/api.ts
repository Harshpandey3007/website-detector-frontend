// ───────────────────────── Config ─────────────────────────
// NEXT_PUBLIC_* values are baked in at BUILD time on Vercel: after changing them you must redeploy.
const rawUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").trim();
export const API_URL = rawUrl.replace(/\/+$/, ""); // no trailing slash, so `${API_URL}${path}` is always clean
export const API_BASE = API_URL; // used by LiveProvider
export const API_KEY = (process.env.NEXT_PUBLIC_API_KEY || "secret-demo-key-2026-super-secure").trim(); // used by LiveProvider

const isNgrok = /ngrok/i.test(API_URL);

/** Headers for every request. The ngrok header skips the free-tier "Visit Site" interstitial. */
export const API_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
  ...(isNgrok ? { "ngrok-skip-browser-warning": "true" } : {}),
};

// ───────────────────────── Types ─────────────────────────
export type Monitor = {
  id: string;
  url: string;
  name: string;
  status: string;
  lastCheckedAt: string | null;
  lastChangedAt: string | null;
  intervalMins: number;
  sensitivity: number;
  ignoreSelectors?: string | null;
  watchSelectors?: string | null;
};

export type Snapshot = {
  id: string;
  monitorId?: string; // /history does not return it, so it is optional
  contentHash: string;
  imagePath: string;
  diffPath: string | null;
  createdAt: string;
};

export type Alert = {
  id: string;
  kind: string;
  summary: string;
  sentAt: string;
  monitor: { name: string; url: string };
};

export type CompareResult = {
  v1: { id: string; image: string; text: string; createdAt: string };
  v2: { id: string; image: string; text: string; createdAt: string };
  diff: { html: string; summary: string; changeRatio: number };
  visualDiff: string | null;
};

export type ChannelStatus = {
  telegram: boolean;
  email: boolean;
  discord: boolean;
};

export type ChannelResult = {
  channel: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
};

// ───────────────────────── Helpers ─────────────────────────
export function getErrorMessage(err: any): string {
  return err?.response?.data?.error || err?.message || "An error occurred";
}

/**
 * Turns a path stored in the DB into a full image URL.
 * The backend stores "/screenshots/x.png" and "/diffs/y.png", but express.static serves them
 * under "/public", so we normalise to "/public/screenshots/x.png". Already-prefixed and
 * absolute URLs are left alone.
 */
export function assetUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  let p = path.replace(/\\/g, "/");
  if (!p.startsWith("/")) p = "/" + p;
  if (!p.startsWith("/public/")) p = "/public" + p;
  const url = `${API_URL}${p}`;
  return isNgrok ? `${url}?ngrok-skip-browser-warning=true` : url;
}

// ───────────────────────── Generic fetch ─────────────────────────
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { ...API_HEADERS, ...(options.headers as Record<string, string> | undefined) },
      cache: "no-store",
    });
  } catch {
    // CORS failures, DNS failures and "ngrok is offline" all surface as a bare TypeError.
    throw new Error(`Cannot reach the API at ${API_URL}. Is the backend running and is ngrok up?`);
  }

  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    let msg = `Request failed with status ${res.status}`;
    if (contentType.includes("application/json")) {
      try {
        const data = await res.json();
        if (data?.error) msg = String(data.error);
      } catch { /* keep default */ }
    } else if (res.status === 502 || res.status === 504 || res.status === 404) {
      msg = `Backend unreachable (HTTP ${res.status}). Check that npm run dev and ngrok are both running.`;
    }
    throw new Error(msg);
  }

  if (res.status === 204) return {} as T;

  // The ngrok warning page is HTML served with status 200. Fail loudly instead of crashing on res.json().
  if (!contentType.includes("application/json")) {
    throw new Error("API returned a non-JSON response (ngrok warning page?). Check NEXT_PUBLIC_API_URL.");
  }
  return res.json();
}

// ───────────────────────── Endpoints ─────────────────────────
export const getMonitors = () => fetchApi<Monitor[]>("/monitors");
export const getMonitor = (id: string) => fetchApi<Monitor>(`/monitors/${id}`);
export const createMonitor = (data: any) =>
  fetchApi<Monitor>("/monitors", { method: "POST", body: JSON.stringify(data) });
export const deleteMonitor = (id: string) => fetchApi<{ ok: boolean }>(`/monitors/${id}`, { method: "DELETE" });
export const checkMonitor = (id: string) => fetchApi<{ queued: boolean }>(`/monitors/${id}/check`, { method: "POST" });
export const getHistory = (id: string) => fetchApi<Snapshot[]>(`/monitors/${id}/history`);
export const compareSnapshots = (id: string, v1: string, v2: string) =>
  fetchApi<CompareResult>(`/monitors/${id}/compare/${v1}/${v2}`);
export const getAlerts = () => fetchApi<Alert[]>("/alerts");
export const getChannels = () => fetchApi<ChannelStatus>("/channels");
export const testChannels = () => fetchApi<{ results: ChannelResult[] }>("/channels/test", { method: "POST" });
export const askMonitor = (id: string, question: string) =>
  fetchApi<{ answer: string; basedOn: number }>(`/monitors/${id}/ask`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });