export type MonitorStatus = "OK" | "ERROR" | "BLOCKED" | "PENDING";

export interface Monitor {
  id: string;
  url: string;
  name: string;
  intervalMins: number;
  /** Ignore changes smaller than this % of the page text. 0 = alert on any change. */
  sensitivity?: number;
  status: MonitorStatus;
  lastCheckedAt: string | null;
  lastChangedAt: string | null;
}

export interface Alert {
  id: string;
  monitorId: string;
  kind?: "change" | "status" | string;
  summary: string;
  sentAt: string;
  monitor: { name: string; url: string };
}

export interface Snapshot {
  id: string;
  contentHash: string;
  imagePath: string;
  diffPath: string | null;
  createdAt: string;
}

export interface CompareSide { id: string; createdAt: string; image: string; text: string }
export interface CompareResult {
  v1: CompareSide;
  v2: CompareSide;
  diff: { html: string; summary: string; changeRatio: number };
  visualDiff: string | null;
}

export type ChannelStatus = { discord: boolean; telegram: boolean; email: boolean };
export interface ChannelResult { channel: "discord" | "telegram" | "email"; status: "sent" | "skipped" | "failed"; error?: string }

export interface CreateMonitorInput {
  url: string;
  name: string;
  intervalMins: number;
  /** 0-100: ignore changes smaller than this percentage of the page text */
  sensitivity: number;
}

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(/\/+$/, "");
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

/** Screenshots and diff images are served by the API under /public (unguessable filenames). */


// To exactly this:
export const assetUrl = (path: string | null | undefined) => {
  if (!path) return undefined;
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const base = `${baseUrl}${path}`;
  
  if (baseUrl.includes("ngrok")) {
    return `${base}?ngrok-skip-browser-warning=true`;
  }
  
  return base;
};
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
  "ngrok-skip-browser-warning": "true", 
};
  // Only send a JSON content type when there is a body; some servers reject
  // empty bodies that claim to be JSON (e.g. on DELETE).
  if (init.body !== undefined) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      `Can't reach the API at ${API_BASE}. Check that the server is running and that CORS allows this origin and the x-api-key header.`,
      0
    );
  }

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!res.ok) {
    let message =
      res.status === 401 || res.status === 403
        ? "The API rejected the request. Check NEXT_PUBLIC_API_KEY."
        : `Request failed with status ${res.status}.`;
    if (data && typeof data === "object") {
      const body = data as { message?: unknown; error?: unknown };
      const m = body.message ?? body.error;
      if (typeof m === "string" && m) message = m;
      else if (Array.isArray(m) && m.length) message = m.join(", ");
    }
    throw new ApiError(message, res.status);
  }
  return data as T;
}

const enc = encodeURIComponent;

export const getMonitors = () => request<Monitor[]>("/monitors");
export const getMonitor = (id: string) => request<Monitor>(`/monitors/${enc(id)}`);
export const createMonitor = (input: CreateMonitorInput) => request<Monitor>("/monitors", { method: "POST", body: input });
export const deleteMonitor = (id: string) => request<void>(`/monitors/${enc(id)}`, { method: "DELETE" });
export const checkMonitor = (id: string) => request<unknown>(`/monitors/${enc(id)}/check`, { method: "POST" });

export const getHistory = (id: string) => request<Snapshot[]>(`/monitors/${enc(id)}/history`);
export const compareSnapshots = (id: string, v1: string, v2: string) =>
  request<CompareResult>(`/monitors/${enc(id)}/compare/${enc(v1)}/${enc(v2)}`);
export const askMonitor = (id: string, question: string) =>
  request<{ answer: string; basedOn: number }>(`/monitors/${enc(id)}/ask`, { method: "POST", body: { question } });

export const getAlerts = () => request<Alert[]>("/alerts");
export const getChannels = () => request<ChannelStatus>("/channels");
export const testChannels = () => request<{ results: ChannelResult[] }>("/channels/test", { method: "POST" });

export function getErrorMessage(err: unknown): string {
  return err instanceof Error && err.message ? err.message : "Something went wrong. Try again.";
}
export const asseturl = (path: string | null | undefined) => {
  if (!path) return undefined;
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const base = `${baseUrl}${path}`;
  
  if (baseUrl.includes("ngrok")) {
    return `${base}?ngrok-skip-browser-warning=true`;
  }
  
  return base;
};