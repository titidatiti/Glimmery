import type { SerializedTheme, ThemeDefinition, ThemeTokens } from './types';
import { normalizeCustomThemeColors } from './colorRoles';

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

/** 默认主题：雅黑（原夜间） */
export const nightTheme = buildTheme(
  'night',
  '雅黑',
  '深灰底，浅灰高亮，沉稳书写',
  {
    bgBase: '#1e1e1e',
    bgSurface: '#252526',
    bgElevated: '#2d2d2d',
    textPrimary: '#cccccc',
    textSecondary: '#9d9d9d',
    textMuted: '#6e6e6e',
    accent: '#c5c5c5',
    accentMuted: '#a8a8a8',
    danger: '#ff6b6b',
    caretColor: '#d4d4d4',
    activeLineBg: '#282828',
    border: '#3e3e3e',
    borderSubtle: '#333333',
    focusRing: '#c5c5c566',
    editorBg: '#1e1e1e',
    sidebarBg: '#252526',
  },
  {
    sm: '0 1px 2px rgba(0,0,0,0.35)',
    md: '0 2px 8px rgba(0,0,0,0.4)',
    glow: '0 0 16px rgba(197,197,197,0.06)',
  },
);

/** 暗黑：比雅黑更高对比的纯黑底 */
export const abyssTheme = buildTheme(
  'abyss',
  '暗黑',
  '纯黑底，高亮白字，强对比书写',
  {
    bgBase: '#000000',
    bgSurface: '#0a0a0a',
    bgElevated: '#141414',
    textPrimary: '#f5f5f5',
    textSecondary: '#c4c4c4',
    textMuted: '#808080',
    accent: '#ffffff',
    accentMuted: '#d8d8d8',
    danger: '#ff5252',
    caretColor: '#ffffff',
    activeLineBg: '#0d0d0d',
    border: '#2e2e2e',
    borderSubtle: '#1c1c1c',
    focusRing: '#ffffff55',
    editorBg: '#000000',
    sidebarBg: '#060606',
  },
  {
    sm: '0 1px 2px rgba(0,0,0,0.6)',
    md: '0 2px 8px rgba(0,0,0,0.55)',
    glow: '0 0 20px rgba(255,255,255,0.04)',
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
    danger: '#ff6b6b',
    caretColor: '#ffe082',
    activeLineBg: '#121e34',
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
    danger: '#ff8a80',
    caretColor: '#ffcc80',
    activeLineBg: '#241808',
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
  '柔和米黄纸页，不刺眼',
  {
    bgBase: '#e6dfd3',
    bgSurface: '#ece6da',
    bgElevated: '#f2ede4',
    textPrimary: '#2c2820',
    textSecondary: '#5c5448',
    textMuted: '#8a8070',
    accent: '#8b6914',
    accentMuted: '#a88020',
    danger: '#8b0000',
    caretColor: '#6b4423',
    activeLineBg: '#d0cbc2',
    border: '#d4cdc0',
    borderSubtle: '#ddd6c9',
    focusRing: '#8b691455',
    editorBg: '#ebe4d8',
    sidebarBg: '#ded7c9',
  },
  {
    sm: '0 1px 3px rgba(0,0,0,0.06)',
    md: '0 4px 12px rgba(0,0,0,0.08)',
    glow: '0 0 20px rgba(139,105,20,0.06)',
  },
);

export const christmasTheme = buildTheme(
  'christmas',
  '圣诞',
  '深酒红底，红金暖光，节日气氛',
  {
    bgBase: '#180c10',
    bgSurface: '#201018',
    bgElevated: '#2a1420',
    textPrimary: '#f5ebe6',
    textSecondary: '#c9a8ae',
    textMuted: '#8a6870',
    accent: '#d93848',
    accentMuted: '#e8c04a',
    danger: '#ff5252',
    caretColor: '#48b878',
    activeLineBg: '#241018',
    border: '#4a2834',
    borderSubtle: '#301820',
    focusRing: '#d9384855',
    editorBg: '#1a0a10',
    sidebarBg: '#160810',
  },
  {
    sm: '0 1px 3px rgba(0,0,0,0.5)',
    md: '0 4px 16px rgba(120,20,40,0.25)',
    glow: '0 0 28px rgba(232,197,71,0.12)',
  },
);

export const earthTheme = buildTheme(
  'earth',
  '大地',
  '赭石沙褐，自然沉厚',
  {
    bgBase: '#2a2520',
    bgSurface: '#332e28',
    bgElevated: '#3e3830',
    textPrimary: '#e8e0d4',
    textSecondary: '#b8a890',
    textMuted: '#7a7060',
    accent: '#b8956b',
    accentMuted: '#967a52',
    danger: '#ff6b6b',
    caretColor: '#d4bc82',
    activeLineBg: '#302c24',
    selectionBg: '#c4a882',
    selectionText: '#2a2520',
    border: '#4a4438',
    borderSubtle: '#383228',
    focusRing: '#b8956b55',
    editorBg: '#2a2520',
    sidebarBg: '#2e2822',
  },
  {
    sm: '0 1px 3px rgba(0,0,0,0.35)',
    md: '0 4px 12px rgba(80,60,40,0.25)',
    glow: '0 0 20px rgba(184,149,107,0.1)',
  },
);

export const daoxiangTheme = buildTheme(
  'daoxiang',
  '稻香',
  '深褐稻纸，怀旧信笺',
  {
    bgBase: '#8a7458',
    bgSurface: '#9c8468',
    bgElevated: '#a08870',
    textPrimary: '#2a2218',
    textSecondary: '#3a2e22',
    textMuted: '#4a3828',
    accent: '#7a5c20',
    accentMuted: '#8a6828',
    danger: '#5c0000',
    caretColor: '#5c4420',
    activeLineBg: '#806850',
    selectionBg: '#b89878',
    selectionText: '#1a1208',
    border: '#7a6850',
    borderSubtle: '#867258',
    focusRing: '#7a5c2055',
    editorBg: '#907860',
    sidebarBg: '#806850',
  },
  {
    sm: '0 1px 3px rgba(40,30,15,0.18)',
    md: '0 4px 12px rgba(40,30,15,0.22)',
    glow: '0 0 18px rgba(122,92,32,0.1)',
  },
);

export const newspaperTheme = buildTheme(
  'newspaper',
  '报纸',
  '冷灰纸面，铅色正文，阅报心境',
  {
    bgBase: '#d4d4d4',
    bgSurface: '#cacaca',
    bgElevated: '#bfbfbf',
    headingText: '#1a1a1a',
    bodyText: '#141414',
    textPrimary: '#1a1a1a',
    textSecondary: '#212121',
    textMuted: '#3b3b3b',
    sidebarText: '#1a1a1a',
    sidebarTextMuted: '#3b3b3b',
    accent: '#b11616',
    accentMuted: '#902727',
    danger: '#8b0000',
    caretColor: '#0a0a0a',
    activeLineBg: '#bfbfbf',
    border: '#595959',
    borderSubtle: '#545454',
    focusRing: '#b1161655',
    editorBg: '#bababa',
    sidebarBg: '#8f8f8f',
  },
  {
    sm: '0 1px 3px rgba(0,0,0,0.08)',
    md: '0 4px 12px rgba(0,0,0,0.1)',
    glow: '0 0 16px rgba(0,0,0,0.05)',
  },
);

export const twilightTheme = buildTheme(
  'twilight',
  '紫夜',
  '深紫暮霭，薰衣草光，静谧幽深',
  {
    bgBase: '#12101a',
    bgSurface: '#181420',
    bgElevated: '#221c2c',
    textPrimary: '#e4dce8',
    textSecondary: '#a898b8',
    textMuted: '#6a5878',
    accent: '#b088d0',
    accentMuted: '#8868a8',
    danger: '#ff6b6b',
    caretColor: '#c8a8e8',
    activeLineBg: '#1c1626',
    border: '#3a3048',
    borderSubtle: '#282030',
    focusRing: '#b088d055',
    editorBg: '#12101a',
    sidebarBg: '#140e18',
  },
  {
    sm: '0 1px 3px rgba(0,0,0,0.5)',
    md: '0 4px 16px rgba(80,40,120,0.22)',
    glow: '0 0 24px rgba(176,136,208,0.12)',
  },
);

export const neonTheme = buildTheme(
  'neon',
  '霓虹',
  '深黑底上的荧光彩，如霓虹招牌般夺目',
  {
    bgBase: '#08080a',
    bgSurface: '#0c0c10',
    bgElevated: '#101018',
    textPrimary: '#fff8fc',
    textSecondary: '#00f0ff',
    textMuted: '#e878d8',
    accent: '#ff00aa',
    accentMuted: '#00ffee',
    danger: '#ff3366',
    caretColor: '#00ffff',
    activeLineBg: '#0e0814',
    border: '#5a1888',
    borderSubtle: '#1a1028',
    focusRing: '#ff00aa88',
    editorBg: '#06060a',
    sidebarBg: '#0a0a0e',
  },
  {
    sm: '0 1px 3px rgba(0,0,0,0.6)',
    md: '0 4px 20px rgba(255,0,170,0.28)',
    glow: '0 0 32px rgba(0,255,238,0.2), 0 0 48px rgba(255,0,170,0.14)',
  },
);

export const geekTheme = buildTheme(
  'geek',
  '极客',
  '终端黑屏，磷光绿字',
  {
    bgBase: '#0a0a0a',
    bgSurface: '#0f0f0f',
    bgElevated: '#141414',
    textPrimary: '#33ff66',
    textSecondary: '#22cc55',
    textMuted: '#118833',
    accent: '#00ff41',
    accentMuted: '#00cc33',
    danger: '#ff4444',
    caretColor: '#39ff14',
    activeLineBg: '#0a180e',
    border: '#1a3a1a',
    borderSubtle: '#122812',
    focusRing: '#00ff4155',
    editorBg: '#050505',
    sidebarBg: '#080808',
  },
  {
    sm: '0 1px 3px rgba(0,0,0,0.6)',
    md: '0 4px 16px rgba(0,255,65,0.08)',
    glow: '0 0 24px rgba(0,255,65,0.12)',
  },
);

export const DARK_BUILTIN_THEMES: ThemeDefinition[] = [
  nightTheme,
  abyssTheme,
  twilightTheme,
  starryTheme,
  campfireTheme,
  earthTheme,
  christmasTheme,
  neonTheme,
  geekTheme,
];

export const LIGHT_BUILTIN_THEMES: ThemeDefinition[] = [
  paperTheme,
  daoxiangTheme,
  newspaperTheme,
];

export const BUILTIN_THEMES: ThemeDefinition[] = [
  ...DARK_BUILTIN_THEMES,
  ...LIGHT_BUILTIN_THEMES,
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
    tokens: {
      ...data.tokens,
      colors: normalizeCustomThemeColors(data.tokens.colors),
    },
  };
}

export function createCustomTheme(
  id: string,
  name: string,
  baseTokens: ThemeTokens,
  colorOverrides: Partial<ThemeTokens['colors']>,
): ThemeDefinition {
  const merged = { ...baseTokens.colors, ...colorOverrides };
  return {
    id,
    name,
    isBuiltin: false,
    tokens: {
      ...baseTokens,
      colors: {
        ...merged,
        headingText: merged.headingText ?? merged.textPrimary,
        bodyText: merged.bodyText ?? merged.textPrimary,
      },
    },
  };
}
