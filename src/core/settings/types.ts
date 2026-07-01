export interface AppSettings {
  focusMode: boolean;
  settingsOpen: boolean;
  autoSaveDelayMs: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  focusMode: false,
  settingsOpen: false,
  autoSaveDelayMs: 800,
};
