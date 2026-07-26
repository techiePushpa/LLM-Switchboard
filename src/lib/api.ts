const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// The access token lives only here, in memory -- never localStorage, so
// it can't be read by an injected script. It's reset to null on reload,
// which is why App bootstraps a fresh one via the refresh cookie on load.
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

// A single in-flight refresh promise so concurrent 401s don't each try
// to refresh the session separately.
let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = await res.json();
        setAccessToken(data.accessToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** internal: prevents infinite retry loops on the refresh endpoint itself */
  _isRetry?: boolean;
}

interface StreamOptions {
  body: unknown;
  signal?: AbortSignal;
}

/**
 * Like apiFetch, but for the one endpoint (/api/chat) that streams NDJSON
 * instead of returning a single JSON body. Still gets the same one-shot
 * refresh-and-retry treatment on a 401 before the stream starts.
 */
export async function apiStream(
  path: string,
  { body, signal }: StreamOptions,
  onChunk: (rawChunk: string) => void
): Promise<void> {
  async function doFetch(isRetry: boolean): Promise<Response> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      credentials: "include",
      signal,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (res.status === 401 && !isRetry) {
      const refreshed = await refreshSession();
      if (refreshed) return doFetch(true);
    }
    return res;
  }

  const res = await doFetch(false);

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.error ?? "Something went wrong.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

export async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, headers, _isRetry, ...rest } = options;

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !_isRetry && path !== "/api/auth/refresh") {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, _isRetry: true });
    }
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? "Something went wrong.");
  }
  return data as T;
}
