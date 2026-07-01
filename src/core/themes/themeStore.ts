import { create } from 'zustand';
import type { StorageProvider } from '@/services/storage';
import type { ThemeDefinition } from './types';
import {
  BUILTIN_THEMES,
  DEFAULT_THEME_ID,
  createCustomTheme,
  deserializeTheme,
  getBuiltinTheme,
  serializeTheme,
} from './builtinThemes';
import type { SerializedTheme } from './types';
import { generateId } from '@/lib';

const THEME_STORAGE_KEY = 'glimmery:active-theme';
const CUSTOM_THEMES_KEY = 'glimmery:custom-themes';

export interface ThemeStoreState {
  activeThemeId: string;
  themes: ThemeDefinition[];
  activeTheme: ThemeDefinition;
  setActiveTheme: (id: string) => void;
  addCustomTheme: (name: string, baseThemeId: string, accentColor: string) => ThemeDefinition;
  updateCustomTheme: (id: string, updates: Partial<Pick<ThemeDefinition, 'name'>> & { accentColor?: string }) => void;
  loadPersisted: (storage: StorageProvider) => Promise<void>;
  persist: (storage: StorageProvider) => Promise<void>;
}

function resolveTheme(id: string, customThemes: ThemeDefinition[]): ThemeDefinition {
  const builtin = getBuiltinTheme(id);
  if (builtin) return builtin;
  const custom = customThemes.find((t) => t.id === id);
  if (custom) return custom;
  return getBuiltinTheme(DEFAULT_THEME_ID) ?? BUILTIN_THEMES[0];
}

function loadCustomThemesFromLocal(): ThemeDefinition[] {
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SerializedTheme[];
    return parsed.map(deserializeTheme);
  } catch {
    return [];
  }
}

function saveCustomThemesToLocal(themes: ThemeDefinition[]): void {
  const custom = themes.filter((t) => !t.isBuiltin).map(serializeTheme);
  localStorage.setItem(CUSTOM_THEMES_KEY, JSON.stringify(custom));
}

export const useThemeStore = create<ThemeStoreState>((set, get) => {
  const customThemes = loadCustomThemesFromLocal();
  const allThemes = [...BUILTIN_THEMES, ...customThemes];
  const initialId = localStorage.getItem(THEME_STORAGE_KEY) ?? DEFAULT_THEME_ID;
  const activeTheme = resolveTheme(initialId, customThemes);

  return {
    activeThemeId: activeTheme.id,
    themes: allThemes,
    activeTheme,

    setActiveTheme: (id) => {
      const theme = resolveTheme(id, get().themes.filter((t) => !t.isBuiltin));
      localStorage.setItem(THEME_STORAGE_KEY, theme.id);
      set({ activeThemeId: theme.id, activeTheme: theme });
    },

    addCustomTheme: (name, baseThemeId, accentColor) => {
      const base = resolveTheme(baseThemeId, get().themes.filter((t) => !t.isBuiltin));
      const theme = createCustomTheme(generateId(), name, base.tokens, {
        accent: accentColor,
        accentMuted: accentColor,
        focusRing: `${accentColor}55`,
      });
      const themes = [...get().themes, theme];
      saveCustomThemesToLocal(themes);
      localStorage.setItem(THEME_STORAGE_KEY, theme.id);
      set({ themes, activeThemeId: theme.id, activeTheme: theme });
      return theme;
    },

    updateCustomTheme: (id, updates) => {
      const themes = get().themes.map((t) => {
        if (t.id !== id || t.isBuiltin) return t;
        const colors = updates.accentColor
          ? {
              ...t.tokens.colors,
              accent: updates.accentColor,
              accentMuted: updates.accentColor,
              focusRing: `${updates.accentColor}55`,
            }
          : t.tokens.colors;
        return {
          ...t,
          name: updates.name ?? t.name,
          tokens: { ...t.tokens, colors },
        };
      });
      saveCustomThemesToLocal(themes);
      const active = get().activeThemeId === id
        ? themes.find((t) => t.id === id) ?? get().activeTheme
        : get().activeTheme;
      set({ themes, activeTheme: active });
    },

    loadPersisted: async () => {
      const custom = loadCustomThemesFromLocal();
      const allThemes = [...BUILTIN_THEMES, ...custom];
      const savedId = localStorage.getItem(THEME_STORAGE_KEY) ?? DEFAULT_THEME_ID;
      const theme = resolveTheme(savedId, custom);
      set({ themes: allThemes, activeThemeId: theme.id, activeTheme: theme });
    },

    persist: async () => {
      localStorage.setItem(THEME_STORAGE_KEY, get().activeThemeId);
      saveCustomThemesToLocal(get().themes);
    },
  };
});
