import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

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
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const { data } = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            { refresh_token: refreshToken },
          );
          const raw = data?.data || data;
          const newAccess = raw.access_token;
          const newRefresh = raw.refresh_token;
          localStorage.setItem('access_token', newAccess);
          localStorage.setItem('refresh_token', newRefresh);
          document.cookie = `access_token=${newAccess}; path=/; max-age=900`;
          document.cookie = `refresh_token=${newRefresh}; path=/; max-age=604800`;
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        document.cookie = 'access_token=; path=/; max-age=0';
        document.cookie = 'refresh_token=; path=/; max-age=0';
        if (typeof window !== 'undefined') window.location.href = '/auth/login';
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
