// store/ui.store.ts - UI State Store (Zustand)

import { create } from 'zustand';

interface UIStore {
  isSidebarOpen: boolean;
  isLoading: boolean;
  notification: {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
  showNotification: (
    type: 'success' | 'error' | 'info' | 'warning',
    message: string
  ) => void;
  clearNotification: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSidebarOpen: true,
  isLoading: false,
  notification: null,
  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setLoading: (isLoading) => set({ isLoading }),
  showNotification: (type, message) =>
    set({ notification: { type, message } }),
  clearNotification: () => set({ notification: null }),
}));
