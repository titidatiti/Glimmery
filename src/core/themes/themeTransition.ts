/** 参与主题过渡动画的 CSS 颜色变量 */
export const THEME_COLOR_CSS_VARS = [
  '--color-bg-base',
  '--color-bg-surface',
  '--color-bg-elevated',
  '--color-text-primary',
  '--color-text-heading',
  '--color-text-body',
  '--color-text-secondary',
  '--color-text-auxiliary',
  '--color-text-muted',
  '--color-accent',
  '--color-accent-muted',
  '--color-on-accent',
  '--color-danger',
  '--color-selection-bg',
  '--color-selection-text',
  '--color-caret',
  '--color-border',
  '--color-border-subtle',
  '--color-focus-ring',
  '--color-editor-bg',
  '--color-sidebar-bg',
  '--color-sidebar-text',
  '--color-sidebar-text-muted',
  '--color-active-line-bg',
] as const;

/** 不参与颜色插值，但需随主题同步的 CSS 变量 */
export const THEME_SHADOW_CSS_VARS = [
  '--shadow-sm',
  '--shadow-md',
] as const;

export function pickThemeShadowVars(allVars: Record<string, string>): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const key of THEME_SHADOW_CSS_VARS) {
    if (allVars[key] !== undefined) picked[key] = allVars[key];
  }
  return picked;
}

const DEFAULT_DURATION_MS = 520;

interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseHexColor(input: string): Rgb | null {
  const hex = input.trim();
  const match6 = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (match6) {
    const n = match6[1];
    return {
      r: parseInt(n.slice(0, 2), 16),
      g: parseInt(n.slice(2, 4), 16),
      b: parseInt(n.slice(4, 6), 16),
      a: 1,
    };
  }
  const match8 = /^#([0-9a-fA-F]{8})$/.exec(hex);
  if (match8) {
    const n = match8[1];
    return {
      r: parseInt(n.slice(0, 2), 16),
      g: parseInt(n.slice(2, 4), 16),
      b: parseInt(n.slice(4, 6), 16),
      a: parseInt(n.slice(6, 8), 16) / 255,
    };
  }
  return null;
}

function parseRgbFunction(input: string): Rgb | null {
  const match = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/.exec(
    input.trim(),
  );
  if (!match) return null;
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: match[4] !== undefined ? Number(match[4]) : 1,
  };
}

export function parseCssColor(input: string): Rgb | null {
  return parseHexColor(input) ?? parseRgbFunction(input);
}

function formatRgb({ r, g, b, a }: Rgb): string {
  const ri = Math.round(r);
  const gi = Math.round(g);
  const bi = Math.round(b);
  if (a >= 1) return `#${ri.toString(16).padStart(2, '0')}${gi.toString(16).padStart(2, '0')}${bi.toString(16).padStart(2, '0')}`;
  const ai = Math.round(a * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${ri.toString(16).padStart(2, '0')}${gi.toString(16).padStart(2, '0')}${bi.toString(16).padStart(2, '0')}${ai}`;
}

function lerpRgb(from: Rgb, to: Rgb, t: number): Rgb {
  return {
    r: from.r + (to.r - from.r) * t,
    g: from.g + (to.g - from.g) * t,
    b: from.b + (to.b - from.b) * t,
    a: from.a + (to.a - from.a) * t,
  };
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function pickThemeColorVars(allVars: Record<string, string>): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const key of THEME_COLOR_CSS_VARS) {
    if (allVars[key] !== undefined) picked[key] = allVars[key];
  }
  return picked;
}

export function readThemeColorVarsFromRoot(root: HTMLElement): Record<string, string> {
  const computed = getComputedStyle(root);
  const result: Record<string, string> = {};
  for (const key of THEME_COLOR_CSS_VARS) {
    result[key] = computed.getPropertyValue(key).trim();
  }
  return result;
}

export interface AnimateThemeColorsOptions {
  from: Record<string, string>;
  to: Record<string, string>;
  durationMs?: number;
  onFrame: (vars: Record<string, string>) => void;
  onComplete?: () => void;
}

export function animateThemeColors({
  from,
  to,
  durationMs = DEFAULT_DURATION_MS,
  onFrame,
  onComplete,
}: AnimateThemeColorsOptions): () => void {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion || durationMs <= 0) {
    onFrame(to);
    onComplete?.();
    return () => {};
  }

  const keys = THEME_COLOR_CSS_VARS.filter((key) => to[key] !== undefined);
  const startColors: Record<string, Rgb> = {};
  const endColors: Record<string, Rgb> = {};

  for (const key of keys) {
    const start = parseCssColor(from[key] ?? to[key]);
    const end = parseCssColor(to[key]);
    if (!start || !end) continue;
    startColors[key] = start;
    endColors[key] = end;
  }

  const instantKeys = keys.filter((key) => !startColors[key] || !endColors[key]);
  const animKeys = keys.filter((key) => startColors[key] && endColors[key]);

  if (animKeys.length === 0) {
    onFrame(to);
    onComplete?.();
    return () => {};
  }

  const startTime = performance.now();
  let rafId = 0;

  const tick = (now: number) => {
    const elapsed = now - startTime;
    const linear = Math.min(1, elapsed / durationMs);
    const eased = easeOutCubic(linear);
    const frame: Record<string, string> = { ...to };

    for (const key of animKeys) {
      frame[key] = formatRgb(lerpRgb(startColors[key], endColors[key], eased));
    }
    for (const key of instantKeys) {
      frame[key] = to[key];
    }

    onFrame(frame);

    if (linear < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      onFrame(to);
      onComplete?.();
    }
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
  };
}

export function applyCssVariables(root: HTMLElement, vars: Record<string, string>): void {
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
}

export function applyThemeTokensToRoot(
  root: HTMLElement,
  allVars: Record<string, string>,
  themeId: string,
  isPreview: boolean,
): void {
  applyCssVariables(root, allVars);
  root.dataset.theme = isPreview ? 'preview' : themeId;
}
