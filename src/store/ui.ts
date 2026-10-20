import { create } from 'zustand';

interface UiState {
  sidebarAbierta: boolean;
  blacklight: boolean;
  alternarSidebar: () => void;
  cerrarSidebar: () => void;
  setBlacklight: (v: boolean) => void;
  alternarBlacklight: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarAbierta: false,
  blacklight: false,
  alternarSidebar: () => set((s) => ({ sidebarAbierta: !s.sidebarAbierta })),
  cerrarSidebar: () => set({ sidebarAbierta: false }),
  setBlacklight: (v) => set({ blacklight: v }),
  alternarBlacklight: () => set((s) => ({ blacklight: !s.blacklight })),
}));
