import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, error.message ?? 'Request failed');
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Authenticated fetch — reads token from SecureStore automatically */
export async function authRequest<T>(path: string, options: Omit<RequestOptions, 'token'> = {}): Promise<T> {
  const token = await SecureStore.getItemAsync('accessToken');
  return request<T>(path, { ...options, token });
}

/** Unauthenticated fetch — for login/register */
export const api = {
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  get: <T>(path: string, token?: string) => request<T>(path, { token }),
};

/** Authenticated API calls — used by React Query hooks */
export const authedApi = {
  get: <T>(path: string) => authRequest<T>(path),
  post: <T>(path: string, body: unknown) => authRequest<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body: unknown) => authRequest<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => authRequest<T>(path, { method: 'DELETE' }),
};
