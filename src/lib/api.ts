import axios from 'axios';
import { setTokenCookies, clearTokenCookies } from './cookies';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];
let refreshFailed = false;

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error || !token) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Una autenticación exitosa (login/register/refresh) reactiva el auto-refresh.
    const url = response.config?.url || '';
    if (
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh')
    ) {
      refreshFailed = false;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    const esAuthBasica = url.includes('/auth/refresh') || url.includes('/auth/login');
    const es401 = error.response?.status === 401;

    // Sesión irrecuperable (el auto-refresh ya falló): limpiar tokens y cookies
    // para que el proxy y el guard del dashboard no queden en bucle.
    if (es401 && !esAuthBasica && refreshFailed) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      clearTokenCookies();
      return Promise.reject(error);
    }

    if (es401 && !originalRequest._retry && !esAuthBasica && !refreshFailed) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(() => Promise.reject(error));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');

      try {
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refresh_token: refreshToken },
          { withCredentials: true },
        );
        const raw = data?.data || data;
        const newAccess = raw.access_token;
        const newRefresh = raw.refresh_token;

        if (newAccess && newRefresh) {
          localStorage.setItem('access_token', newAccess);
          localStorage.setItem('refresh_token', newRefresh);
          setTokenCookies(newAccess, newRefresh);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          processQueue(null, newAccess);
          return api(originalRequest);
        }
        throw new Error('Invalid refresh response');
      } catch (refreshError) {
        // Si la sesión cambió mientras esperábamos (logout o un login nuevo),
        // no tocar el estado actual: el refresh que falló quedó obsoleto.
        const actual = localStorage.getItem('refresh_token');
        if (refreshToken && actual === refreshToken) {
          refreshFailed = true;
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          clearTokenCookies();
        }
        processQueue(refreshError, null);
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export function extractData<T>(response: { data: unknown }): T {
  const raw = response.data;
  if (raw && typeof raw === 'object' && 'data' in raw && 'timestamp' in raw) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

export function mensajeError(error: unknown, fallback = 'Error inesperado'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string' && msg) return msg;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default api;
