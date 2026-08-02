import { useAuthStore } from '../state/authStore';
import type { ApiErrorBody } from '../types/graph';

// Relative by default (proxied to the backend by Vite - see vite.config.ts)
// rather than a hardcoded localhost:4000, so it keeps working when the app
// is opened through a tunnel (ngrok etc.) from a different device, where
// "localhost" would otherwise resolve to that device instead of this host.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export class ApiError extends Error {
  code: string;
  details?: unknown;
  status: number;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  // getState() reads the store outside React - client.ts is a plain module,
  // not a component, so it can't use the useAuthStore hook directly.
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> | undefined) };
  // Only set Content-Type when there's actually a body - Fastify's JSON parser
  // rejects an empty body when this header is present (breaks bodyless DELETE).
  if (init?.body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const errBody = body as ApiErrorBody | null;
    throw new ApiError(
      res.status,
      errBody?.error?.code ?? 'UNKNOWN_ERROR',
      errBody?.error?.message ?? `Request failed with status ${res.status}`,
      errBody?.error?.details
    );
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(data ?? {}) }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(data ?? {}) }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(data ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
};
