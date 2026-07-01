import type { SerializedTheme, ThemeDefinition, ThemeTokens } from './types';

const SHARED_SPACING: ThemeTokens['spacing'] = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
};

const SHARED_TYPOGRAPHY: ThemeTokens['typography'] = {
  fontSans: "'Inter', 'Segoe UI', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', 'Fira Code', monospace",
  fontSizeBase: '16px',
  fontSizeSm: '14px',
  fontSizeLg: '18px',
  fontSizeXl: '24px',
  lineHeightBase: '1.7',
  lineHeightTight: '1.4',
};

const SHARED_RADIUS: ThemeTokens['radius'] = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
};

function buildTheme(
  id: string,
  name: string,
  description: string,
  colors: ThemeTokens['colors'],
  shadows: ThemeTokens['shadows'],
): ThemeDefinition {
  return {
    id,
    name,
    description,
    isBuiltin: true,
    tokens: {
      colors,
      spacing: SHARED_SPACING,
      typography: SHARED_TYPOGRAPHY,
      radius: SHARED_RADIUS,
      shadows,
    },
  };
}

export const nightTheme = buildTheme(
  'night',
  '夜间',
  '默认深色，微光屏幕',
  {
    bgBase: '#0d0d12',
    bgSurface: '#14141c',
    bgElevated: '#1c1c28',
    textPrimary: '#e8e6f0',
    textSecondary: '#a8a4b8',
    textMuted: '#6b667a',
    accent: '#e8c547',
    accentMuted: '#b89a2e',
    border: '#2a2a3a',
    borderSubtle: '#1f1f2e',
    focusRing: '#e8c54766',
    editorBg: '#0d0d12',
    sidebarBg: '#111118',
  },
  {
    sm: '0 1px 3px rgba(0,0,0,0.4)',
    md: '0 4px 12px rgba(0,0,0,0.5)',
    glow: '0 0 24px rgba(232,197,71,0.12)',
  },
);

export const starryTheme = buildTheme(
  'starry',
  '星空',
  '深蓝夜空，点点星光',
  {
    bgBase: '#0a0e1a',
    bgSurface: '#0f1525',
    bgElevated: '#151d30',
    textPrimary: '#dce4f5',
    textSecondary: '#8fa3c7',
    textMuted: '#5a6d8a',
    accent: '#7eb8ff',
    accentMuted: '#4a8fd4',
    border: '#1e2a42',
    borderSubtle: '#151f33',
    focusRing: '#7eb8ff55',
    editorBg: '#0a0e1a',
    sidebarBg: '#0c1220',
  },
  {
    sm: '0 1px 3px rgba(0,0,0,0.5)',
    md: '0 4px 16px rgba(30,60,120,0.3)',
    glow: '0 0 32px rgba(126,184,255,0.15)',
  },
);

export const campfireTheme = buildTheme(
  'campfire',
  '篝火',
  '暖色营地，微光摇曳',
  {
    bgBase: '#1a1208',
    bgSurface: '#221a0e',
    bgElevated: '#2e2214',
    textPrimary: '#f0e6d8',
    textSecondary: '#c4a882',
    textMuted: '#8a7355',
    accent: '#e87d3a',
    accentMuted: '#c45e20',
    border: '#3d2e1a',
    borderSubtle: '#2a1f10',
    focusRing: '#e87d3a55',
    editorBg: '#1a1208',
    sidebarBg: '#1e160a',
  },
  {
    sm: '0 1px 3px rgba(0,0,0,0.4)',
    md: '0 4px 16px rgba(200,80,20,0.2)',
    glow: '0 0 28px rgba(232,125,58,0.18)',
  },
);

export const paperTheme = buildTheme(
  'paper',
  '纸感',
  '柔和浅色，书写纸页',
  {
    bgBase: '#f5f0e8',
    bgSurface: '#faf7f2',
    bgElevated: '#ffffff',
    textPrimary: '#2c2820',
    textSecondary: '#5c5448',
    textMuted: '#9a9080',
    accent: '#8b6914',
    accentMuted: '#a88020',
    border: '#e0d8cc',
    borderSubtle: '#ebe4d8',
    focusRing: '#8b691455',
    editorBg: '#faf7f2',
    sidebarBg: '#f0ebe2',
  },
  {
    sm: '0 1px 3px rgba(0,0,0,0.08)',
    md: '0 4px 12px rgba(0,0,0,0.1)',
    glow: '0 0 20px rgba(139,105,20,0.08)',
  },
);

export const BUILTIN_THEMES: ThemeDefinition[] = [
  nightTheme,
  starryTheme,
  campfireTheme,
  paperTheme,
];

export const DEFAULT_THEME_ID = nightTheme.id;

export function getBuiltinTheme(id: string): ThemeDefinition | undefined {
  return BUILTIN_THEMES.find((t) => t.id === id);
}

export function serializeTheme(theme: ThemeDefinition): SerializedTheme {
  return {
    version: 1,
    id: theme.id,
    name: theme.name,
    tokens: theme.tokens,
  };
}

export function deserializeTheme(data: SerializedTheme): ThemeDefinition {
  return {
    id: data.id,
    name: data.name,
    isBuiltin: false,
    tokens: data.tokens,
  };
}

export function createCustomTheme(
  id: string,
  name: string,
  baseTokens: ThemeTokens,
  colorOverrides: Partial<ThemeTokens['colors']>,
): ThemeDefinition {
  return {
    id,
    name,
    isBuiltin: false,
    tokens: {
      ...baseTokens,
      colors: { ...baseTokens.colors, ...colorOverrides },
    },
  };
}
