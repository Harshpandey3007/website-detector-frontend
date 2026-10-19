// --- Config & Headers ---
// --- Config & Headers ---
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
export const API_BASE = API_URL; // Adding this for LiveProvider
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "secret-demo-key-2026-super-secure"; // Exporting this

const headers = {
  "Content-Type": "application/json",
  "x-api-key": API_KEY,
  "ngrok-skip-browser-warning": "true", 
};
// --- Types ---
export type Monitor = {
  id: string;
  url: string;
  name: string;
  status: string;
  lastCheckedAt: string | null;
  lastChangedAt: string | null;
  intervalMins: number;
  sensitivity: number;
};

export type Snapshot = {
  id: string;
  monitorId: string;
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

// --- Helpers ---
export function getErrorMessage(err: any): string {
  return err?.response?.data?.error || err?.message || "An error occurred";
}

export function assetUrl(path: string | null | undefined) {
  if (!path) return undefined;
  const base = `${API_URL}${path}`;
  if (API_URL.includes("ngrok")) {
    return `${base}?ngrok-skip-browser-warning=true`;
  }
  return base;
}

// --- Generic Fetch ---
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
    cache: "no-store",
  });

  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
    } catch {}
    throw new Error(errorMsg);
  }
  
  if (res.status === 204) return {} as T;
  return res.json();
}

// --- API Endpoints ---
export const getMonitors = () => fetchApi<Monitor[]>("/monitors");
export const getMonitor = (id: string) => fetchApi<Monitor>(`/monitors/${id}`);
export const createMonitor = (data: any) => fetchApi<Monitor>("/monitors", { method: "POST", body: JSON.stringify(data) });
export const deleteMonitor = (id: string) => fetchApi<{ ok: boolean }>(`/monitors/${id}`, { method: "DELETE" });
export const checkMonitor = (id: string) => fetchApi<{ queued: boolean }>(`/monitors/${id}/check`, { method: "POST" });
export const getHistory = (id: string) => fetchApi<Snapshot[]>(`/monitors/${id}/history`);
export const compareSnapshots = (id: string, v1: string, v2: string) => fetchApi<CompareResult>(`/monitors/${id}/compare/${v1}/${v2}`);
export const getAlerts = () => fetchApi<Alert[]>("/alerts");
export const getChannels = () => fetchApi<ChannelStatus>("/channels");
export const testChannels = () => fetchApi<{ results: ChannelResult[] }>("/channels/test", { method: "POST" });

// Fixed: Added askMonitor here to match AskAI.tsx
export const askMonitor = (id: string, question: string) => 
  fetchApi<{ answer: string; basedOn: number }>(`/monitors/${id}/ask`, { method: "POST", body: JSON.stringify({ question }) });