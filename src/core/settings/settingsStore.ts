import { create } from 'zustand';
import { DEFAULT_SETTINGS, type AppSettings } from './types';

export interface SettingsStoreState extends AppSettings {
  toggleFocusMode: () => void;
  setFocusMode: (value: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  ...DEFAULT_SETTINGS,

  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
  setFocusMode: (value) => set({ focusMode: value }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
}));
