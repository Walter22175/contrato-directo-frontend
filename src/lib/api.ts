import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login') &&
      !refreshFailed
    ) {
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

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refresh_token: refreshToken },
        );
        const raw = data?.data || data;
        const newAccess = raw.access_token;
        const newRefresh = raw.refresh_token;

        if (newAccess && newRefresh) {
          localStorage.setItem('access_token', newAccess);
          localStorage.setItem('refresh_token', newRefresh);
          document.cookie = `access_token=${newAccess}; path=/; max-age=900`;
          document.cookie = `refresh_token=${newRefresh}; path=/; max-age=604800`;
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          processQueue(null, newAccess);
          return api(originalRequest);
        }
        throw new Error('Invalid refresh response');
      } catch (refreshError) {
        refreshFailed = true;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        document.cookie = 'access_token=; path=/; max-age=0';
        document.cookie = 'refresh_token=; path=/; max-age=0';
        processQueue(refreshError, null);
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export function extractData<T>(response: { data: any }): T {
  const raw = response.data;
  if (raw && typeof raw === 'object' && 'data' in raw && 'timestamp' in raw) {
    return raw.data as T;
  }
  return raw as T;
}

export default api;
