import { create } from 'zustand';

interface UiState {
  sidebarAbierta: boolean;
  alternarSidebar: () => void;
  cerrarSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarAbierta: false,
  alternarSidebar: () => set((s) => ({ sidebarAbierta: !s.sidebarAbierta })),
  cerrarSidebar: () => set({ sidebarAbierta: false }),
}));
