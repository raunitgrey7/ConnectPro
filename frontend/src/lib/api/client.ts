/* ------------------------------------------------------------------ */
/* Centralized HTTP client for backend API communication.             */
/* Wraps fetch with base URL, JSON handling, error mapping, retry.    */
/* ------------------------------------------------------------------ */

import type { APIResponse, APIError } from "@/lib/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Maximum number of retries for transient failures (5xx / network). */
const MAX_RETRIES = 2;

/** Delay between retries in ms (simple linear backoff). */
const RETRY_DELAY_MS = 500;

// ─── Error class ─────────────────────────────────────────────────────

export class ApiError extends Error {
  code: string;
  status: number;
  details: Record<string, unknown>;

  constructor(status: number, code: string, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ─── Internal helpers ────────────────────────────────────────────────

function isRetryable(status: number): boolean {
  return status >= 500 || status === 0; // 0 = network error
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function parseErrorResponse(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as APIError;
    return new ApiError(
      res.status,
      body.error?.code ?? "UNKNOWN",
      body.error?.message ?? res.statusText,
      body.error?.details ?? {}
    );
  } catch {
    return new ApiError(res.status, "UNKNOWN", res.statusText);
  }
}

// ─── Core request function ───────────────────────────────────────────

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, params } = options;

  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, String(value));
    }
    url += `?${searchParams.toString()}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
  };

  if (body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, fetchOptions);

      if (!res.ok) {
        const apiError = await parseErrorResponse(res);
        if (isRetryable(res.status) && attempt < MAX_RETRIES) {
          lastError = apiError;
          await delay(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        throw apiError;
      }

      const data = (await res.json()) as APIResponse<T>;
      return data.data as T;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      // Network error
      lastError = err as Error;
      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
    }
  }

  throw lastError ?? new Error("Request failed after retries");
}

// ─── Public API ──────────────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    return request<T>(path, { method: "GET", params });
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: "POST", body });
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: "PUT", body });
  },

  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },
};
