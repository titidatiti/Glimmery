import { create } from 'zustand';
import { useCloudSyncStore } from '@/core/sync';
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

/** 导出供云端备份的自定义配色与当前主题 id */
export function exportThemeBackupState(): {
  customThemes: SerializedTheme[];
  activeThemeId: string;
} {
  const state = useThemeStore.getState();
  return {
    customThemes: state.themes.filter((t) => !t.isBuiltin).map(serializeTheme),
    activeThemeId: state.activeThemeId,
  };
}

/** 从云端恢复自定义配色并刷新主题 store */
export function applyThemeBackupState(
  customThemes: SerializedTheme[],
  activeThemeId?: string,
): void {
  const deserialized = customThemes.map(deserializeTheme);
  saveCustomThemesToLocal([...BUILTIN_THEMES, ...deserialized]);

  const resolvedId = activeThemeId ?? useThemeStore.getState().activeThemeId;
  const activeTheme = resolveTheme(resolvedId, deserialized);
  localStorage.setItem(THEME_STORAGE_KEY, activeTheme.id);

  useThemeStore.setState({
    themes: [...BUILTIN_THEMES, ...deserialized],
    activeThemeId: activeTheme.id,
    activeTheme,
    previewTokens: null,
  });
}

function markThemeCloudPending(): void {
  useCloudSyncStore.getState().markPending();
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
      markThemeCloudPending();
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
      markThemeCloudPending();
    },

    deleteCustomTheme: (id) => {
      const existing = get().themes.find((t) => t.id === id);
      if (!existing || existing.isBuiltin) return;

      const themes = get().themes.filter((t) => t.id !== id);
      saveCustomThemesToLocal(themes);
      markThemeCloudPending();

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
