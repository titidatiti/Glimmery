import type { ThemeShadowTokens, ThemeTokens } from './types';
import { parseHex6, rgbToHex } from './colorUtils';

export interface ThemeShadowRoles {
  shadowEnabled: boolean;
  shadowColor: string;
  /** 用户是否手动改过阴影（未改时保留基准主题原始 shadow CSS） */
  customized?: boolean;
}

export interface ThemeCustomSettings {
  colors: import('./colorRoles').ThemeColorRoles;
  shadows: ThemeShadowRoles;
}

const DEFAULT_SHADOW_COLOR = '#000000';

function parseFirstRgba(value: string): { r: number; g: number; b: number } | null {
  const match = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!match) return null;
  return {
    r: Number.parseInt(match[1], 10),
    g: Number.parseInt(match[2], 10),
    b: Number.parseInt(match[3], 10),
  };
}

function inferColorFromShadowCss(shadow: string, fallback: string): string {
  const rgb = parseFirstRgba(shadow);
  return rgb ? rgbToHex(rgb.r, rgb.g, rgb.b) : fallback;
}

function isShadowDisabled(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === 'none' || normalized === 'unset';
}

export function buildSmShadow(color: string): string {
  const rgb = parseHex6(color) ?? { r: 0, g: 0, b: 0 };
  return `0 1px 3px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`;
}

export function buildMdShadow(color: string): string {
  const rgb = parseHex6(color) ?? { r: 0, g: 0, b: 0 };
  return `0 4px 12px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`;
}

export function tokensToShadowRoles(tokens: ThemeTokens): ThemeShadowRoles {
  const { shadows } = tokens;
  const shadowEnabled =
    shadows.shadowEnabled ?? (!isShadowDisabled(shadows.sm) || !isShadowDisabled(shadows.md));
  const customized = shadows.shadowCustomized ?? shadows.shadowColor !== undefined;

  return {
    shadowEnabled,
    shadowColor:
      shadows.shadowColor ??
      inferColorFromShadowCss(shadows.md, inferColorFromShadowCss(shadows.sm, DEFAULT_SHADOW_COLOR)),
    customized,
  };
}

export function shadowRolesToShadowTokens(roles: ThemeShadowRoles): ThemeShadowTokens {
  return {
    shadowColor: roles.shadowColor,
    shadowEnabled: roles.shadowEnabled,
    shadowCustomized: roles.customized ?? true,
    sm: roles.shadowEnabled ? buildSmShadow(roles.shadowColor) : 'none',
    md: roles.shadowEnabled ? buildMdShadow(roles.shadowColor) : 'none',
  };
}

/** 将阴影设置合并到基准主题：未自定义时保留基准 sm/md，仅应用开关 */
export function applyShadowRolesToBase(
  base: ThemeShadowTokens,
  roles: ThemeShadowRoles,
): ThemeShadowTokens {
  const customized = roles.customized ?? false;

  if (!customized) {
    return {
      ...base,
      shadowEnabled: roles.shadowEnabled,
      shadowCustomized: false,
      sm: roles.shadowEnabled ? base.sm : 'none',
      md: roles.shadowEnabled ? base.md : 'none',
    };
  }

  return {
    ...base,
    ...shadowRolesToShadowTokens({ ...roles, customized: true }),
  };
}

/** 根据持久化设置解析最终阴影 CSS（内置主题无自定义字段时保留原值） */
export function resolveShadowCss(shadows: ThemeShadowTokens): Pick<ThemeShadowTokens, 'sm' | 'md'> {
  const sm =
    shadows.shadowEnabled === false
      ? 'none'
      : shadows.shadowColor !== undefined
        ? buildSmShadow(shadows.shadowColor)
        : shadows.sm;

  const md =
    shadows.shadowEnabled === false
      ? 'none'
      : shadows.shadowColor !== undefined
        ? buildMdShadow(shadows.shadowColor)
        : shadows.md;

  return { sm, md };
}

export function mergeShadowRoles(
  base: ThemeShadowRoles,
  patch: Partial<ThemeShadowRoles>,
): ThemeShadowRoles {
  return { ...base, ...patch };
}
