export type MonitorStatus = "OK" | "ERROR" | "PENDING";

export interface Monitor {
  id: string;
  url: string;
  name: string;
  intervalMins: number;
  status: MonitorStatus;
  lastCheckedAt: string | null;
  lastChangedAt: string | null;
}

export interface Alert {
  id: string;
  summary: string;
  sentAt: string;
  monitor: {
    name: string;
    url: string;
  };
}

export interface CreateMonitorInput {
  url: string;
  name: string;
  intervalMins: number;
  /** 1-100 (percent) */
  sensitivity: number;
}

export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "x-api-key": API_KEY,
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
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
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

export const getMonitors = () => request<Monitor[]>("/monitors");

export const createMonitor = (input: CreateMonitorInput) =>
  request<Monitor>("/monitors", { method: "POST", body: input });

export const deleteMonitor = (id: string) =>
  request<void>(`/monitors/${encodeURIComponent(id)}`, { method: "DELETE" });

export const checkMonitor = (id: string) =>
  request<unknown>(`/monitors/${encodeURIComponent(id)}/check`, {
    method: "POST",
  });

export const getAlerts = () => request<Alert[]>("/alerts");

export function getErrorMessage(err: unknown): string {
  return err instanceof Error && err.message
    ? err.message
    : "Something went wrong. Try again.";
}