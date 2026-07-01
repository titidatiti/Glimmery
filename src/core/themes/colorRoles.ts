import type { ThemeColorTokens } from './types';

/** 用户可编辑的配色角色（与界面区域一一对应） */
export type ThemeColorRoleId =
  | 'sidebarBg'
  | 'editorBg'
  | 'chromeBg'
  | 'elevatedBg'
  | 'activeLineBg'
  | 'headingText'
  | 'bodyText'
  | 'auxiliaryText'
  | 'placeholderText'
  | 'accent'
  | 'accentSoft'
  | 'selectionBg'
  | 'selectionText'
  | 'danger'
  | 'caretColor'
  | 'border'
  | 'borderSubtle';

export type ThemeColorRoleGroup = 'background' | 'text' | 'accent' | 'border';

export interface ThemeColorRoleDefinition {
  id: ThemeColorRoleId;
  label: string;
  hint: string;
  group: ThemeColorRoleGroup;
}

export type ThemeColorRoles = Record<ThemeColorRoleId, string>;

export const THEME_COLOR_ROLE_GROUPS: { id: ThemeColorRoleGroup; label: string }[] = [
  { id: 'background', label: '背景' },
  { id: 'text', label: '文字' },
  { id: 'accent', label: '强调' },
  { id: 'border', label: '边框与分割' },
];

/**
 * 配色角色说明（与当前 UI 用法对齐）：
 * - 侧栏/写作区/顶栏/浮层：四大背景层
 * - 主标题/正文/辅助/弱提示：四级文字（主标题含品牌名与编辑区标题；辅助含顶栏文稿名、设置、搜索、沉浸按钮）
 * - 强调/柔强调：光标、选中标记、链接、选区
 * - 边框：输入框焦点与滚动条（深）；区域分割（浅）
 */
export const THEME_COLOR_ROLE_DEFINITIONS: ThemeColorRoleDefinition[] = [
  {
    id: 'sidebarBg',
    label: '侧栏背景',
    hint: '左侧边栏整体底色',
    group: 'background',
  },
  {
    id: 'editorBg',
    label: '写作区背景',
    hint: '右侧编辑区纸张底色',
    group: 'background',
  },
  {
    id: 'chromeBg',
    label: '顶栏与面板背景',
    hint: '顶栏、对话框、卡片等面板底色',
    group: 'background',
  },
  {
    id: 'elevatedBg',
    label: '浮层背景',
    hint: '悬停、输入框底、代码块等略抬升区域',
    group: 'background',
  },
  {
    id: 'activeLineBg',
    label: '选中行背景',
    hint: '编辑区光标所在行的柔和底色高亮',
    group: 'background',
  },
  {
    id: 'headingText',
    label: '主标题',
    hint: 'Glimmery 品牌名、编辑区标题、选中文稿标题',
    group: 'text',
  },
  {
    id: 'bodyText',
    label: '正文',
    hint: '编辑区正文与 Markdown 段落',
    group: 'text',
  },
  {
    id: 'auxiliaryText',
    label: '辅助文字',
    hint: '顶栏文稿名、设置按钮、沉浸按钮、搜索框文字',
    group: 'text',
  },
  {
    id: 'placeholderText',
    label: '弱提示文字',
    hint: '占位符、格言、未选中文稿、侧栏弱提示等次要文字',
    group: 'text',
  },
  {
    id: 'accent',
    label: '强调色',
    hint: '光标、侧栏选中标记、链接、激活边框',
    group: 'accent',
  },
  {
    id: 'accentSoft',
    label: '柔强调色',
    hint: '标题选区、侧栏柔和高亮等次要强调',
    group: 'accent',
  },
  {
    id: 'selectionBg',
    label: '选区背景',
    hint: '编辑区拖选文字的背景色；亦用于强调主按钮（如保存）',
    group: 'accent',
  },
  {
    id: 'selectionText',
    label: '选区文字',
    hint: '编辑区拖选文字的前景色；亦用于强调主按钮文字',
    group: 'accent',
  },
  {
    id: 'danger',
    label: '危险操作',
    hint: '删除等破坏性操作的文字颜色',
    group: 'accent',
  },
  {
    id: 'caretColor',
    label: '光标色',
    hint: '编辑区与标题输入光标；可与强调色形成互补',
    group: 'accent',
  },
  {
    id: 'border',
    label: '边框',
    hint: '输入框聚焦、滚动条滑块（较深）',
    group: 'border',
  },
  {
    id: 'borderSubtle',
    label: '浅边框',
    hint: '区域分割线、侧栏与顶栏边线',
    group: 'border',
  },
];

export function accentToFocusRing(accent: string): string {
  const hex = accent.trim();
  if (/^#[0-9a-fA-F]{8}$/.test(hex)) return hex;
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return `${hex}55`;
  return hex;
}

function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.trim().match(/^#([0-9a-fA-F]{6})$/);
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function toHexColor(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) => Math.min(255, Math.max(0, Math.round(channel))).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** 从写作区底色与强调色推导柔和的选中行背景 */
export function deriveActiveLineBg(editorBg: string, accent: string): string {
  return mixHexColors(editorBg, accent, 0.14);
}

/** 从写作区底色与强调色推导文字选区背景（对比度高于选中行） */
export function deriveSelectionBg(editorBg: string, accent: string, mix = 0.42): string {
  return mixHexColors(editorBg, accent, mix);
}

export const FALLBACK_SELECTION_TEXT_DARK = '#2a2a2a';
export const FALLBACK_SELECTION_TEXT_LIGHT = '#f5f5f5';

function srgbChannelToLinear(channel: number): number {
  const v = channel / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number | null {
  const rgb = parseHexColor(hex);
  if (!rgb) return null;
  const r = srgbChannelToLinear(rgb.r);
  const g = srgbChannelToLinear(rgb.g);
  const b = srgbChannelToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 对比度（简化相对亮度） */
export function contrastRatio(foreground: string, background: string): number | null {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  if (fg === null || bg === null) return null;
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

/** 在候选色与深浅回退色中选取与选区背景对比度最高的文字色 */
export function deriveSelectionText(selectionBg: string, candidates: string[]): string {
  const bgLum = relativeLuminance(selectionBg);
  if (bgLum === null) return FALLBACK_SELECTION_TEXT_DARK;

  const pool = [
    ...new Set([...candidates, FALLBACK_SELECTION_TEXT_DARK, FALLBACK_SELECTION_TEXT_LIGHT]),
  ];

  let best = bgLum > 0.52 ? FALLBACK_SELECTION_TEXT_DARK : FALLBACK_SELECTION_TEXT_LIGHT;
  let bestRatio = 0;

  for (const fg of pool) {
    const ratio = contrastRatio(fg, selectionBg);
    if (ratio !== null && ratio > bestRatio) {
      bestRatio = ratio;
      best = fg;
    }
  }

  if (bestRatio < 3.2) {
    return bgLum > 0.52 ? FALLBACK_SELECTION_TEXT_DARK : FALLBACK_SELECTION_TEXT_LIGHT;
  }

  return best;
}

function mixHexColors(baseHex: string, accentHex: string, mix: number): string {
  const bg = parseHexColor(baseHex);
  const accentRgb = parseHexColor(accentHex);
  if (!bg || !accentRgb) return baseHex;

  return toHexColor(
    bg.r + (accentRgb.r - bg.r) * mix,
    bg.g + (accentRgb.g - bg.g) * mix,
    bg.b + (accentRgb.b - bg.b) * mix,
  );
}

export function resolveSelectionBg(colors: ThemeColorTokens): string {
  if (colors.selectionBg) return colors.selectionBg;

  const editorLum = relativeLuminance(colors.editorBg) ?? 0.5;
  const derived = deriveSelectionBg(colors.editorBg, colors.accent);

  if (editorLum < 0.45) {
    const mutedLum = colors.accentMuted ? relativeLuminance(colors.accentMuted) : null;
    const derivedLum = relativeLuminance(derived);
    if (mutedLum !== null && mutedLum >= 0.58) return colors.accentMuted;
    if (derivedLum !== null && derivedLum >= 0.58) return derived;
    return deriveSelectionBg(colors.editorBg, colors.accent, 0.68);
  }

  return deriveSelectionBg(colors.editorBg, colors.accent, 0.52);
}

export function resolveSelectionText(colors: ThemeColorTokens): string {
  return finalizeSelectionPair(colors).text;
}

export function finalizeSelectionPair(
  colors: ThemeColorTokens,
): { bg: string; text: string } {
  if (colors.selectionBg && colors.selectionText) {
    return { bg: colors.selectionBg, text: colors.selectionText };
  }

  const candidates = [
    colors.headingText ?? colors.textPrimary,
    colors.bodyText ?? colors.textPrimary,
    colors.textSecondary,
    colors.textMuted,
  ];

  let bg = colors.selectionBg ?? resolveSelectionBg(colors);

  for (let step = 0; step < 5; step++) {
    const text = pickSelectionTextForBg(bg, candidates, colors.selectionText);
    const ratio = contrastRatio(text, bg) ?? 0;
    if (ratio >= 3.2) {
      return { bg, text };
    }

    const lum = relativeLuminance(bg) ?? 0.5;
    bg =
      lum < 0.58
        ? mixHexColors(bg, '#ffffff', 0.22)
        : mixHexColors(bg, '#000000', 0.14);
  }

  const text = pickSelectionTextForBg(bg, candidates, colors.selectionText);
  return { bg, text };
}

function pickSelectionTextForBg(
  selectionBg: string,
  candidates: string[],
  explicitText?: string,
): string {
  if (explicitText) return explicitText;

  let text = deriveSelectionText(selectionBg, candidates);
  if ((contrastRatio(text, selectionBg) ?? 0) >= 3.2) {
    return text;
  }

  const darkRatio = contrastRatio(FALLBACK_SELECTION_TEXT_DARK, selectionBg) ?? 0;
  const lightRatio = contrastRatio(FALLBACK_SELECTION_TEXT_LIGHT, selectionBg) ?? 0;
  return darkRatio >= lightRatio ? FALLBACK_SELECTION_TEXT_DARK : FALLBACK_SELECTION_TEXT_LIGHT;
}

export function tokensToColorRoles(colors: ThemeColorTokens): ThemeColorRoles {
  const selection = finalizeSelectionPair(colors);
  const heading = colors.headingText ?? colors.sidebarText ?? colors.textPrimary;
  return {
    sidebarBg: colors.sidebarBg,
    editorBg: colors.editorBg,
    chromeBg: colors.bgSurface,
    elevatedBg: colors.bgElevated,
    activeLineBg: colors.activeLineBg ?? deriveActiveLineBg(colors.editorBg, colors.caretColor ?? colors.accent),
    headingText: heading,
    bodyText: colors.bodyText ?? colors.textPrimary,
    auxiliaryText: colors.textSecondary,
    placeholderText: colors.sidebarTextMuted ?? colors.textMuted,
    accent: colors.accent,
    accentSoft: colors.accentMuted,
    selectionBg: selection.bg,
    selectionText: selection.text,
    danger: colors.danger ?? colors.textSecondary,
    caretColor: colors.caretColor ?? colors.accent,
    border: colors.border,
    borderSubtle: colors.borderSubtle,
  };
}

export function colorRolesToTokens(roles: ThemeColorRoles): ThemeColorTokens {
  return {
    bgBase: roles.editorBg,
    bgSurface: roles.chromeBg,
    bgElevated: roles.elevatedBg,
    textPrimary: roles.headingText,
    headingText: roles.headingText,
    bodyText: roles.bodyText,
    textSecondary: roles.auxiliaryText,
    textMuted: roles.placeholderText,
    sidebarText: roles.headingText,
    sidebarTextMuted: roles.placeholderText,
    accent: roles.accent,
    accentMuted: roles.accentSoft,
    selectionBg: roles.selectionBg,
    selectionText: roles.selectionText,
    danger: roles.danger,
    caretColor: roles.caretColor,
    border: roles.border,
    borderSubtle: roles.borderSubtle,
    focusRing: accentToFocusRing(roles.accent),
    editorBg: roles.editorBg,
    sidebarBg: roles.sidebarBg,
    activeLineBg: roles.activeLineBg,
  };
}

/** 在基准色板上应用角色覆盖，保留 bgBase 等未暴露给编辑器的字段 */
export function mergeColorRolesWithBase(
  roles: ThemeColorRoles,
  base: ThemeColorTokens,
): ThemeColorTokens {
  const mapped = colorRolesToTokens(roles);
  return {
    ...base,
    ...mapped,
    bgBase: base.bgBase,
  };
}

export function normalizeCustomThemeColors(colors: ThemeColorTokens): ThemeColorTokens {
  const heading = colors.headingText ?? colors.sidebarText ?? colors.textPrimary;
  const placeholder = colors.sidebarTextMuted ?? colors.textMuted;
  return {
    ...colors,
    headingText: heading,
    textPrimary: heading,
    sidebarText: heading,
    textMuted: placeholder,
    sidebarTextMuted: placeholder,
  };
}

export function mergeColorRoles(base: ThemeColorRoles, patch: Partial<ThemeColorRoles>): ThemeColorRoles {
  return { ...base, ...patch };
}
