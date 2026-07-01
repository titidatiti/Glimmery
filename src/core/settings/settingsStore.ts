import { create } from 'zustand';
import { DEFAULT_SETTINGS } from './types';

export interface SettingsStoreState {
  focusMode: boolean;
  settingsOpen: boolean;
  autoSaveDelayMs: number;
  setFocusMode: (value: boolean) => void;
  enterFocusMode: () => void;
  exitFocusMode: () => void;
  setSettingsOpen: (value: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set) => ({
  focusMode: DEFAULT_SETTINGS.focusMode,
  settingsOpen: DEFAULT_SETTINGS.settingsOpen,
  autoSaveDelayMs: DEFAULT_SETTINGS.autoSaveDelayMs,

  setFocusMode: (value) => set({ focusMode: value }),
  enterFocusMode: () => set({ focusMode: true }),
  exitFocusMode: () => set({ focusMode: false }),
  setSettingsOpen: (value) => set({ settingsOpen: value }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}));
