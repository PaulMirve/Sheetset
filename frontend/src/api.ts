const BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:9002";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/* Session token: kept in localStorage, observable with useSyncExternalStore. */
const listeners = new Set<() => void>();

export const getToken = () => localStorage.getItem("token");

export const setToken = (token: string | null) => {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
  listeners.forEach((l) => l());
};

export const subscribeToken = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const request = async (path: string, body?: unknown, method?: string) => {
  const token = getToken();
  // A File/Blob goes up as the raw body with its own type; anything else as JSON.
  const raw = body instanceof Blob;
  const res = await fetch(`${BASE}${path}`, {
    method: method ?? (body === undefined ? "GET" : "POST"),
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body !== undefined && {
        "Content-Type": raw
          ? body.type || "application/octet-stream"
          : "application/json",
      }),
    },
    body: body === undefined || raw ? body : JSON.stringify(body),
  });
  if (!res.ok) {
    // An expired or revoked session: drop it so the app shows sign-in.
    if (res.status === 401 && token) setToken(null);
    const err = await res.json().catch(() => null);
    throw new ApiError(res.status, err?.detail ?? res.statusText);
  }
  return res;
};

/** GET `path`, or POST `body` (JSON, or a File/Blob sent raw) when one is given. `method` overrides either. */
export const api = async <T>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> => {
  const res = await request(path, body, method);
  return res.status === 204 ? (undefined as T) : res.json();
};

/** GET `path` as a Blob, for files an <img> or link can't fetch with the session header. */
export const apiBlob = async (path: string) => (await request(path)).blob();
