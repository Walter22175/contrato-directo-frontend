import { create } from 'zustand';
import api, { extractData } from '@/lib/api';
import { setTokenCookies, clearTokenCookies } from '@/lib/cookies';
import type { Usuario, LoginDto, RegisterDto, AuthResponse } from '@/types';

function mensajeDeError(err: unknown, fallback: string, separador = ', '): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const data = (err as { response?: { data?: { message?: unknown } } }).response?.data;
    const message = data?.message;
    if (typeof message === 'string' && message) return message;
    if (Array.isArray(message)) return message.join(separador);
    if (typeof message === 'number' || typeof message === 'boolean') return String(message);
  }
  return fallback;
}

interface AuthState {
  user: Partial<Usuario> | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  clearError: () => void;
  cambiarContexto: (rol: 'cliente' | 'proveedor') => Promise<string>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (dto: LoginDto) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post('/auth/login', dto);
      const data = extractData<AuthResponse>(res);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setTokenCookies(data.access_token, data.refresh_token);
      set({ user: data.usuario, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = mensajeDeError(err, 'Error al iniciar sesión');
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (dto: RegisterDto) => {
    try {
      set({ isLoading: true, error: null });
      const res = await api.post('/auth/register', dto);
      const data = extractData<AuthResponse>(res);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setTokenCookies(data.access_token, data.refresh_token);
      set({ user: data.usuario, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = mensajeDeError(err, 'Error al registrarse');
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    clearTokenCookies();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadUser: async () => {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!token && !refreshToken) {
      set({ isLoading: false });
      return;
    }

    if (!token && refreshToken) {
      try {
        const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken });
        const raw = extractData<{ access_token: string; refresh_token: string; usuario: Partial<Usuario> }>(data);
        if (raw.access_token && raw.refresh_token && raw.usuario) {
          localStorage.setItem('access_token', raw.access_token);
          localStorage.setItem('refresh_token', raw.refresh_token);
          setTokenCookies(raw.access_token, raw.refresh_token);
          set({ user: raw.usuario, isAuthenticated: true, isLoading: false });
          return;
        }
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        clearTokenCookies();
        set({ isLoading: false });
        return;
      }
    }

    try {
      const res = await api.get('/auth/me');
      const data = extractData<{ usuario?: Partial<Usuario> } & Partial<Usuario>>(res);
      // /auth/me retorna { usuario }; el interceptor ya desenvuelve el envelope data/timestamp
      const usuario = data?.usuario ?? data;
      set({ user: usuario, isAuthenticated: true, isLoading: false });
    } catch (err) {
      // Interceptor already handled refresh attempt. Si la sesión no es
      // recuperable, hacer logout completo (también limpia las cookies) para
      // que el proxy no rebotie /auth/login hacia /dashboard en bucle.
      const status = (err as { response?: { status?: number } })?.response?.status;
      const currentToken = localStorage.getItem('access_token');
      if (!currentToken || status === 401 || status === 403) {
        get().logout();
      } else {
        set({ isLoading: false });
      }
    }
  },

  clearError: () => set({ error: null }),

  cambiarContexto: async (rol: 'cliente' | 'proveedor') => {
    try {
      const res = await api.post('/auth/contexto', { rol });
      const data = extractData<{ access_token: string; refresh_token: string; contexto: string; usuario: Partial<Usuario> }>(res);
      if (data.access_token && data.refresh_token) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        setTokenCookies(data.access_token, data.refresh_token);
      }
      localStorage.setItem('contexto_activo', data.contexto || rol);
      if (data.usuario) set({ user: data.usuario });
      return data.contexto || rol;
    } catch (err) {
      const message = mensajeDeError(err, 'No se pudo cambiar de rol', ' — ');
      set({ error: message });
      throw err;
    }
  },
}));
