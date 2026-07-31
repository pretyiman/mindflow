import type { ApiErrorBody } from '../types/graph';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

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
  // Only set Content-Type when there's actually a body - Fastify's JSON parser
  // rejects an empty body when this header is present (breaks bodyless DELETE).
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers
  });

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
