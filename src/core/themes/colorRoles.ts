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
    hint: '文字选区背景、柔和高亮',
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
  const bg = parseHexColor(editorBg);
  const accentRgb = parseHexColor(accent);
  if (!bg || !accentRgb) return editorBg;

  const mix = 0.14;
  return toHexColor(
    bg.r + (accentRgb.r - bg.r) * mix,
    bg.g + (accentRgb.g - bg.g) * mix,
    bg.b + (accentRgb.b - bg.b) * mix,
  );
}

export function tokensToColorRoles(colors: ThemeColorTokens): ThemeColorRoles {
  return {
    sidebarBg: colors.sidebarBg,
    editorBg: colors.editorBg,
    chromeBg: colors.bgSurface,
    elevatedBg: colors.bgElevated,
    activeLineBg: colors.activeLineBg ?? deriveActiveLineBg(colors.editorBg, colors.caretColor ?? colors.accent),
    headingText: colors.headingText ?? colors.sidebarText ?? colors.textPrimary,
    bodyText: colors.bodyText ?? colors.textPrimary,
    auxiliaryText: colors.textSecondary,
    placeholderText: colors.sidebarTextMuted ?? colors.textMuted,
    accent: colors.accent,
    accentSoft: colors.accentMuted,
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
