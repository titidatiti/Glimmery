export interface AppSettings {
  focusMode: boolean;
  sidebarCollapsed: boolean;
  autoSaveDelayMs: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  focusMode: false,
  sidebarCollapsed: false,
  autoSaveDelayMs: 800,
};
