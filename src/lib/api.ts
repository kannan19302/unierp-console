/**
 * Typed console API client.
 *
 * Talks to the control-plane API through the Next rewrites (`/api/v1/*` →
 * `API_URL`, /api/platform/v1 → API_URL too in dev, or direct env base in
 * production). Attaches the session token from the `auth_token` effect cookie
 * or the legacy `__session` cookie staging token, plus CSRF for mutating verbs.
 *
 * Everything the console reads/writes goes through here or the hooks in
 * `./data.ts` — never inline fetch into pages.
 */
import type {
  ApiClient,
  ApiError,
  ApiRequestOptions,
  ApiResponse,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function getSessionToken(): string {
  const bearer = readCookie("auth_token");
  if (bearer && !bearer.endsWith(".devsignature")) return bearer;
  const session = readCookie("__session");
  if (session && !session.endsWith(".devsignature")) return session;
  if (typeof localStorage !== "undefined") {
    const local = localStorage.getItem("token");
    if (local && !local.endsWith(".devsignature")) return local;
  }
  return "";
}

function getCsrfToken(): string {
  return readCookie("csrf_token") ?? "";
}

function paramString(
  params?: Record<string, string | number | boolean | undefined>,
): string {
  if (!params) return "";
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Status-text helpers so every surface shows a consistent, real message. */
export function messageForStatus(status: number): string {
  switch (status) {
    case 400: return "The request was invalid.";
    case 401: return "Your session expired. Re-authenticate and retry.";
    case 403: return "You do not have permission to perform this action.";
    case 404: return "The requested resource was not found.";
    case 409: return "The request conflicts with the current state.";
    case 422: return "One or more fields failed validation.";
    case 429: return "Rate limit exceeded. Try again shortly.";
    default: return `Unexpected response (HTTP ${status}).`;
  }
}

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: ApiRequestOptions,
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${path}${paramString(options?.params)}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = getSessionToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (METHODS_WITH_BODY.has(method) && body !== undefined) {
    headers["Content-Type"] = "application/json";
    const csrf = getCsrfToken();
    if (csrf) headers["x-csrf-token"] = csrf;
  }
  for (const [name, value] of Object.entries(options?.headers ?? {})) {
    if (value) headers[name] = value;
  }
  const res = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = null; }
  }

  if (!res.ok) {
    const err = new Error(messageForStatus(res.status)) as ApiError;
    err.status = res.status;
    err.statusText = res.statusText;
    if (data && typeof data === "object" && "message" in data) {
      err.message = String((data as { message: unknown }).message);
    }
    if (data && typeof data === "object" && "code" in data) {
      (err as { code?: unknown }).code = (data as { code: unknown }).code;
    }
    throw err;
  }

  return { status: res.status, data: (data as T) ?? ({} as T) };
}

export const api: ApiClient = {
  get: async <T>(path: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>("GET", path, undefined, { params }),
  post: async <T>(path: string, body?: unknown, options?: ApiRequestOptions) => request<T>("POST", path, body, options),
  put: async <T>(path: string, body?: unknown, options?: ApiRequestOptions) => request<T>("PUT", path, body, options),
  patch: async <T>(path: string, body?: unknown, options?: ApiRequestOptions) => request<T>("PATCH", path, body, options),
  del: async <T>(path: string, params?: Record<string, string | number | boolean | undefined>) =>
    request<T>("DELETE", path, undefined, { params }),
};

/** Unwrap envelope responses ({ data: [...] } or { items: [...] }). */
export function unwrapList<T>(resp: unknown): T[] {
  if (resp && typeof resp === "object") {
    const r = resp as Record<string, unknown>;
    if (Array.isArray(r.items)) return r.items as T[];
    if (Array.isArray(r.results)) return r.results as T[];
    if (Array.isArray(r.data)) return r.data as T[];
  }
  if (Array.isArray(resp)) return resp as T[];
  return [];
}

export function unwrapTotal(resp: unknown): number | undefined {
  if (resp && typeof resp === "object") {
    const r = resp as Record<string, unknown>;
    if (typeof r.total === "number") return r.total as number;
    const meta = (r.meta ?? null) as { total?: number } | null;
    if (typeof meta?.total === "number") return meta.total;
    const inner = r.data as { total?: number } | undefined;
    if (typeof inner?.total === "number") return inner.total;
  }
  return undefined;
}

export { API_BASE };
