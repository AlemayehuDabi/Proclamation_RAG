import { getApiBaseUrl } from "@/config/env";

const DEFAULT_TIMEOUT_MS = 120_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function parseErrorMessage(status: number, body: unknown): string {
  if (body == null) return status ? `Request failed (${status})` : "Request failed";
  if (typeof body === "string" && body.trim()) return body;
  if (typeof body === "object" && body !== null && "detail" in body) {
    const d = (body as { detail: unknown }).detail;
    if (typeof d === "string") return d;
    if (Array.isArray(d)) return d.map(String).join("; ");
  }
  return status ? `Request failed (${status})` : "Request failed";
}

export type ApiRequestInit = Omit<RequestInit, "body"> & {
  body?: BodyInit | null;
  timeoutMs?: number;
  /** Skip JSON Content-Type (e.g. GET) */
  skipJsonContentType?: boolean;
};

/**
 * Centralized fetch: base URL, timeout, JSON errors, empty body handling.
 */
export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    skipJsonContentType,
    headers: initHeaders,
    ...rest
  } = init;

  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  const headers = new Headers(initHeaders);
  if (!skipJsonContentType && rest.method && rest.method !== "GET" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    const res = await fetch(url, {
      ...rest,
      headers,
      signal: controller.signal,
    });

    const text = await res.text();
    const json =
      text.length === 0
        ? null
        : (() => {
            try {
              return JSON.parse(text) as unknown;
            } catch {
              return text;
            }
          })();

    if (!res.ok) {
      throw new ApiError(parseErrorMessage(res.status, json), res.status, json);
    }

    if (json === null || json === undefined) {
      return undefined as T;
    }
    return json as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ApiError("Request timed out or was cancelled", 0);
    }
    if (e instanceof TypeError) {
      throw new ApiError("Network error — check your connection and API URL", 0);
    }
    throw e;
  } finally {
    window.clearTimeout(timer);
  }
}
