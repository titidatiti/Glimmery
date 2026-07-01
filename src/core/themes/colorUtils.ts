/**
 * 主题颜色纯工具函数（无 DOM 依赖，可在纯 Node 环境单测）。
 * 收敛此前分散在 colorRoles / shadowRoles 的重复 hex/RGB 逻辑。
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** 解析 6 位十六进制颜色（如 #1e1e1e），失败返回 null */
export function parseHex6(hex: string): Rgb | null {
  const match = hex.trim().match(/^#([0-9a-fA-F]{6})$/);
  if (!match) return null;
  const value = Number.parseInt(match[1], 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

/** RGB 通道转 6 位十六进制颜色，自动 clamp 到 [0,255] */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((channel) => Math.min(255, Math.max(0, Math.round(channel))).toString(16).padStart(2, '0'))
    .join('')}`;
}

/** 在 base 与 target 之间按比例混色；无法解析时返回 base */
export function mixHex(baseHex: string, targetHex: string, mix: number): string {
  const base = parseHex6(baseHex);
  const target = parseHex6(targetHex);
  if (!base || !target) return baseHex;
  return rgbToHex(
    base.r + (target.r - base.r) * mix,
    base.g + (target.g - base.g) * mix,
    base.b + (target.b - base.b) * mix,
  );
}

function srgbChannelToLinear(channel: number): number {
  const v = channel / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** WCAG 相对亮度；无法解析时返回 null */
export function relativeLuminance(hex: string): number | null {
  const rgb = parseHex6(hex);
  if (!rgb) return null;
  return (
    0.2126 * srgbChannelToLinear(rgb.r) +
    0.7152 * srgbChannelToLinear(rgb.g) +
    0.0722 * srgbChannelToLinear(rgb.b)
  );
}
