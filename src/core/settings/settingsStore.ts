import { create } from 'zustand';
import {
  DEFAULT_EDITOR_TYPOGRAPHY,
  loadEditorTypographyPreferences,
  saveEditorTypographyPreferences,
  clampFontSizeScale,
  clampEditorWidthScale,
  clampComfortScrollAnchorPercent,
  type EditorFontFamilyId,
  type EditorLineHeightId,
  type EditorTypographyPreferences,
} from './editorTypography';
import { DEFAULT_SETTINGS } from './types';

const AUDIO_SETTINGS_KEY = 'glimmery-audio-settings';

interface AudioSettings {
  keystrokeAudioEnabled: boolean;
  keystrokeVolume: number;
}

function loadAudioSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        keystrokeAudioEnabled: Boolean(parsed.keystrokeAudioEnabled),
        keystrokeVolume: Number(parsed.keystrokeVolume) || DEFAULT_SETTINGS.keystrokeVolume,
      };
    }
  } catch {
    // ignore
  }
  return {
    keystrokeAudioEnabled: DEFAULT_SETTINGS.keystrokeAudioEnabled,
    keystrokeVolume: DEFAULT_SETTINGS.keystrokeVolume,
  };
}

function persistAudioSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export interface SettingsStoreState {
  focusMode: boolean;
  settingsOpen: boolean;
  autoSaveDelayMs: number;
  keystrokeAudioEnabled: boolean;
  keystrokeVolume: number;
  editorTypography: EditorTypographyPreferences;
  setFocusMode: (value: boolean) => void;
  enterFocusMode: () => void;
  exitFocusMode: () => void;
  setSettingsOpen: (value: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
  setKeystrokeAudioEnabled: (enabled: boolean) => void;
  setKeystrokeVolume: (volume: number) => void;
  setEditorFontFamily: (fontFamilyId: EditorFontFamilyId) => void;
  setCustomFontFamily: (customFontFamily: string) => void;
  setEditorFontSizeScale: (fontSizeScale: number) => void;
  setEditorWidthScale: (editorWidthScale: number) => void;
  setEditorLineHeight: (lineHeightId: EditorLineHeightId) => void;
  setComfortScrollAnchorPercent: (comfortScrollAnchorPercent: number) => void;
}

function persistEditorTypography(preferences: EditorTypographyPreferences): void {
  saveEditorTypographyPreferences(preferences);
}

const audioDefaults = loadAudioSettings();

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  focusMode: DEFAULT_SETTINGS.focusMode,
  settingsOpen: DEFAULT_SETTINGS.settingsOpen,
  autoSaveDelayMs: DEFAULT_SETTINGS.autoSaveDelayMs,
  keystrokeAudioEnabled: audioDefaults.keystrokeAudioEnabled,
  keystrokeVolume: audioDefaults.keystrokeVolume,
  editorTypography: loadEditorTypographyPreferences(),

  setFocusMode: (value) => set({ focusMode: value }),
  enterFocusMode: () => set({ focusMode: true }),
  exitFocusMode: () => set({ focusMode: false }),
  setSettingsOpen: (value) => set({ settingsOpen: value }),
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  setKeystrokeAudioEnabled: (enabled) => {
    const audioSettings = { ...get(), keystrokeAudioEnabled: enabled };
    persistAudioSettings(audioSettings);
    set({ keystrokeAudioEnabled: enabled });
  },

  setKeystrokeVolume: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume));
    const audioSettings = { ...get(), keystrokeVolume: clamped };
    persistAudioSettings(audioSettings);
    set({ keystrokeVolume: clamped });
  },

  setEditorFontFamily: (fontFamilyId) => {
    const editorTypography = { ...get().editorTypography, fontFamilyId };
    persistEditorTypography(editorTypography);
    set({ editorTypography });
  },

  setCustomFontFamily: (customFontFamily) => {
    const editorTypography = {
      ...get().editorTypography,
      fontFamilyId: 'custom' as const,
      customFontFamily,
    };
    persistEditorTypography(editorTypography);
    set({ editorTypography });
  },

  setEditorFontSizeScale: (fontSizeScale) => {
    const editorTypography = {
      ...get().editorTypography,
      fontSizeScale: clampFontSizeScale(fontSizeScale),
    };
    persistEditorTypography(editorTypography);
    set({ editorTypography });
  },

  setEditorWidthScale: (editorWidthScale) => {
    const editorTypography = {
      ...get().editorTypography,
      editorWidthScale: clampEditorWidthScale(editorWidthScale),
    };
    persistEditorTypography(editorTypography);
    set({ editorTypography });
  },

  setEditorLineHeight: (lineHeightId) => {
    const editorTypography = { ...get().editorTypography, lineHeightId };
    persistEditorTypography(editorTypography);
    set({ editorTypography });
  },

  setComfortScrollAnchorPercent: (comfortScrollAnchorPercent) => {
    const editorTypography = {
      ...get().editorTypography,
      comfortScrollAnchorPercent: clampComfortScrollAnchorPercent(comfortScrollAnchorPercent),
    };
    persistEditorTypography(editorTypography);
    set({ editorTypography });
  },
}));

export { DEFAULT_EDITOR_TYPOGRAPHY };
