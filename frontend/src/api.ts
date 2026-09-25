const BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:9001";

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

/** GET `path`, or POST `body` as JSON when one is given. `method` overrides either. */
export const api = async <T>(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
): Promise<T> => {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body !== undefined && { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    // An expired or revoked session: drop it so the app shows sign-in.
    if (res.status === 401 && token) setToken(null);
    const err = await res.json().catch(() => null);
    throw new ApiError(res.status, err?.detail ?? res.statusText);
  }
  return res.status === 204 ? (undefined as T) : res.json();
};
