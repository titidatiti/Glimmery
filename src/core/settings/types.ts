export interface AppSettings {
  focusMode: boolean;
  settingsOpen: boolean;
  autoSaveDelayMs: number;
  /** 是否启用打字音效 */
  keystrokeAudioEnabled: boolean;
  /** 打字音音量 (0-1) */
  keystrokeVolume: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  focusMode: false,
  settingsOpen: false,
  autoSaveDelayMs: 800,
  keystrokeAudioEnabled: false,
  keystrokeVolume: 0.5,
};
