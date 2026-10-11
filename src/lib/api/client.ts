// Centralised API client for the TripFlyer NestJS backend.
// Base URL comes from VITE_API_BASE_URL. Auth tokens (Clerk) are injected via setAuthTokenGetter.

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ?? "";
export const isApiConfigured = () => API_BASE_URL.length > 0;

export class ApiError extends Error {
  constructor(message: string, public status: number, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

type TokenGetter = () => Promise<string | null> | string | null;
let getToken: TokenGetter = () => null;
/** Integration point for Clerk: setAuthTokenGetter(() => clerk.session?.getToken()). */
export function setAuthTokenGetter(fn: TokenGetter) { getToken = fn; }

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (!isApiConfigured()) throw new ApiError("Backend API is not configured (VITE_API_BASE_URL is missing).", 0);
  const url = new URL(API_BASE_URL + path);
  Object.entries(opts.query ?? {}).forEach(([k, v]) => v !== undefined && url.searchParams.set(k, String(v)));
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { method: opts.method ?? "GET", headers, body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined, signal: opts.signal });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiError("Could not reach the TripFlyer server. Check your connection and try again.", 0);
  }
  const text = await res.text();
  let data: unknown = undefined;
  try { data = text ? JSON.parse(text) : undefined; } catch { data = text; }
  if (!res.ok) {
    const msg = (data as { message?: string | string[] } | undefined)?.message;
    throw new ApiError(Array.isArray(msg) ? msg.join(", ") : msg || `Request failed (${res.status})`, res.status, data);
  }
  return data as T;
}

export interface Page<T> { items: T[]; page: number; limit: number; total?: number }

/** Normalises common paginated shapes ({data, meta}, {items, total}, or a bare array). */
export function toPage<T>(raw: unknown, page: number, limit: number): Page<T> {
  if (Array.isArray(raw)) return { items: raw as T[], page, limit };
  const r = (raw ?? {}) as Record<string, unknown>;
  const items = (r.data ?? r.items ?? r.results ?? []) as T[];
  const meta = (r.meta ?? r.pagination ?? r) as Record<string, unknown>;
  const total = typeof meta.total === "number" ? meta.total : undefined;
  return { items: Array.isArray(items) ? items : [], page, limit, total };
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");
