import { create } from 'zustand';
import api, { extractData } from '@/lib/api';
import type { Notificacion } from '@/types';

interface NotificationState {
  notificaciones: Notificacion[];
  noLeidas: number;
  isLoading: boolean;
  fetchNotificaciones: () => Promise<void>;
  fetchNoLeidas: () => Promise<void>;
  addNotificacion: (notificacion: Notificacion) => void;
  marcarLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notificaciones: [],
  noLeidas: 0,
  isLoading: false,

  fetchNotificaciones: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/notificaciones');
      const data = extractData<Notificacion[]>(res);
      set({ notificaciones: Array.isArray(data) ? data : [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchNoLeidas: async () => {
    try {
      const res = await api.get('/notificaciones/no-leidas');
      const data = extractData<{ count: number }>(res);
      set({ noLeidas: data?.count || 0 });
    } catch {
      // silent
    }
  },

  addNotificacion: (notificacion) => {
    set((state) => ({
      notificaciones: [notificacion, ...state.notificaciones].slice(0, 50),
      noLeidas: state.noLeidas + (notificacion.leida ? 0 : 1),
    }));
  },

  marcarLeida: async (id: string) => {
    try {
      await api.patch(`/notificaciones/${id}/leer`);
      set((state) => ({
        notificaciones: state.notificaciones.map((n) =>
          n.id_notificacion === id ? { ...n, leida: true } : n
        ),
        noLeidas: Math.max(0, state.noLeidas - 1),
      }));
    } catch {
      // silent
    }
  },

  marcarTodasLeidas: async () => {
    try {
      await api.patch('/notificaciones/leer-todas');
      set((state) => ({
        notificaciones: state.notificaciones.map((n) => ({ ...n, leida: true })),
        noLeidas: 0,
      }));
    } catch {
      // silent
    }
  },
}));
