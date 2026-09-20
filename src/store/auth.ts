import { create } from 'zustand';
import api, { extractData } from '@/lib/api';
import type { Usuario, LoginDto, RegisterDto, AuthResponse } from '@/types';

function setCookies(access: string, refresh: string) {
  document.cookie = `access_token=${access}; path=/; max-age=900`;
  document.cookie = `refresh_token=${refresh}; path=/; max-age=604800`;
}

function clearCookies() {
  document.cookie = 'access_token=; path=/; max-age=0';
  document.cookie = 'refresh_token=; path=/; max-age=0';
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
}

export const useAuthStore = create<AuthState>((set) => ({
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
      setCookies(data.access_token, data.refresh_token);
      set({ user: data.usuario, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al iniciar sesión';
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
      setCookies(data.access_token, data.refresh_token);
      set({ user: data.usuario, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error al registrarse';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    clearCookies();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  loadUser: async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const res = await api.get('/auth/me');
      const data = extractData<any>(res);
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      clearCookies();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
