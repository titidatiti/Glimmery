import { create } from 'zustand';
import type { StorageProvider } from '@/services/storage';
import type { ThemeDefinition, ThemeTokens } from './types';
import {
  BUILTIN_THEMES,
  DEFAULT_THEME_ID,
  deserializeTheme,
  getBuiltinTheme,
  serializeTheme,
} from './builtinThemes';
import type { SerializedTheme } from './types';
import { mergeColorRolesWithBase } from './colorRoles';
import { applyShadowRolesToBase, type ThemeCustomSettings } from './shadowRoles';
import { generateId } from '@/lib';

const THEME_STORAGE_KEY = 'glimmery:active-theme';
const CUSTOM_THEMES_KEY = 'glimmery:custom-themes';

/** 旧版主题 id 迁移 */
const LEGACY_THEME_IDS: Record<string, string> = {
  kraft: 'daoxiang',
  baking: 'campfire',
  ink: 'night',
  matcha: 'earth',
  x: 'neon',
};

export interface ThemeStoreState {
  activeThemeId: string;
  themes: ThemeDefinition[];
  activeTheme: ThemeDefinition;
  previewTokens: ThemeTokens | null;
  setActiveTheme: (id: string) => void;
  setPreviewTokens: (tokens: ThemeTokens | null) => void;
  addCustomTheme: (name: string, baseThemeId: string, settings: ThemeCustomSettings) => ThemeDefinition;
  updateCustomThemeColors: (id: string, settings: ThemeCustomSettings, name?: string) => void;
  deleteCustomTheme: (id: string) => void;
  loadPersisted: (storage: StorageProvider) => Promise<void>;
  persist: (storage: StorageProvider) => Promise<void>;
}

function normalizeThemeId(id: string): string {
  return LEGACY_THEME_IDS[id] ?? id;
}

function resolveTheme(id: string, customThemes: ThemeDefinition[]): ThemeDefinition {
  const normalizedId = normalizeThemeId(id);
  const builtin = getBuiltinTheme(normalizedId);
  if (builtin) return builtin;
  const custom = customThemes.find((t) => t.id === normalizedId);
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

function buildCustomTheme(
  id: string,
  name: string,
  base: ThemeDefinition,
  settings: ThemeCustomSettings,
): ThemeDefinition {
  return {
    id,
    name,
    isBuiltin: false,
    tokens: {
      ...base.tokens,
      colors: mergeColorRolesWithBase(settings.colors, base.tokens.colors),
      shadows: applyShadowRolesToBase(base.tokens.shadows, settings.shadows),
    },
  };
}

export const useThemeStore = create<ThemeStoreState>((set, get) => {
  const customThemes = loadCustomThemesFromLocal();
  const allThemes = [...BUILTIN_THEMES, ...customThemes];
  const savedRaw = localStorage.getItem(THEME_STORAGE_KEY) ?? DEFAULT_THEME_ID;
  const activeTheme = resolveTheme(savedRaw, customThemes);

  if (savedRaw !== activeTheme.id) {
    localStorage.setItem(THEME_STORAGE_KEY, activeTheme.id);
  }

  return {
    activeThemeId: activeTheme.id,
    themes: allThemes,
    activeTheme,
    previewTokens: null,

    setActiveTheme: (id) => {
      const theme = resolveTheme(id, get().themes.filter((t) => !t.isBuiltin));
      localStorage.setItem(THEME_STORAGE_KEY, theme.id);
      set({ activeThemeId: theme.id, activeTheme: theme, previewTokens: null });
    },

    setPreviewTokens: (tokens) => set({ previewTokens: tokens }),

    addCustomTheme: (name, baseThemeId, settings) => {
      const base = resolveTheme(baseThemeId, get().themes.filter((t) => !t.isBuiltin));
      const theme = buildCustomTheme(generateId(), name.trim() || '我的主题', base, settings);
      const themes = [...get().themes, theme];
      saveCustomThemesToLocal(themes);
      localStorage.setItem(THEME_STORAGE_KEY, theme.id);
      set({ themes, activeThemeId: theme.id, activeTheme: theme, previewTokens: null });
      return theme;
    },

    updateCustomThemeColors: (id, settings, name) => {
      const existing = get().themes.find((t) => t.id === id);
      if (!existing || existing.isBuiltin) return;

      const updated = buildCustomTheme(
        id,
        name?.trim() || existing.name,
        existing,
        settings,
      );

      const themes = get().themes.map((t) => (t.id === id ? updated : t));
      saveCustomThemesToLocal(themes);
      const isActive = get().activeThemeId === id;
      set({
        themes,
        activeTheme: isActive ? updated : get().activeTheme,
        previewTokens: null,
      });
    },

    deleteCustomTheme: (id) => {
      const existing = get().themes.find((t) => t.id === id);
      if (!existing || existing.isBuiltin) return;

      const themes = get().themes.filter((t) => t.id !== id);
      saveCustomThemesToLocal(themes);

      if (get().activeThemeId === id) {
        const fallback = getBuiltinTheme(DEFAULT_THEME_ID) ?? BUILTIN_THEMES[0];
        localStorage.setItem(THEME_STORAGE_KEY, fallback.id);
        set({
          themes,
          activeThemeId: fallback.id,
          activeTheme: fallback,
          previewTokens: null,
        });
        return;
      }

      set({ themes, previewTokens: null });
    },

    loadPersisted: async () => {
      const custom = loadCustomThemesFromLocal();
      const allThemesList = [...BUILTIN_THEMES, ...custom];
      const savedId = localStorage.getItem(THEME_STORAGE_KEY) ?? DEFAULT_THEME_ID;
      const theme = resolveTheme(savedId, custom);
      set({ themes: allThemesList, activeThemeId: theme.id, activeTheme: theme });
    },

    persist: async () => {
      localStorage.setItem(THEME_STORAGE_KEY, get().activeThemeId);
      saveCustomThemesToLocal(get().themes);
    },
  };
});

export { tokensToColorRoles, colorRolesToTokens } from './colorRoles';
export {
  tokensToShadowRoles,
  shadowRolesToShadowTokens,
  applyShadowRolesToBase,
  mergeShadowRoles,
  type ThemeShadowRoles,
  type ThemeCustomSettings,
} from './shadowRoles';
