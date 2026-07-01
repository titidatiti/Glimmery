import type { ThemeTokens } from './types';

const CSS_VAR_MAP: Record<string, (tokens: ThemeTokens) => string> = {
  '--color-bg-base': (t) => t.colors.bgBase,
  '--color-bg-surface': (t) => t.colors.bgSurface,
  '--color-bg-elevated': (t) => t.colors.bgElevated,
  '--color-text-primary': (t) => t.colors.textPrimary,
  '--color-text-secondary': (t) => t.colors.textSecondary,
  '--color-text-muted': (t) => t.colors.textMuted,
  '--color-accent': (t) => t.colors.accent,
  '--color-accent-muted': (t) => t.colors.accentMuted,
  '--color-border': (t) => t.colors.border,
  '--color-border-subtle': (t) => t.colors.borderSubtle,
  '--color-focus-ring': (t) => t.colors.focusRing,
  '--color-editor-bg': (t) => t.colors.editorBg,
  '--color-sidebar-bg': (t) => t.colors.sidebarBg,
  '--spacing-xs': (t) => t.spacing.xs,
  '--spacing-sm': (t) => t.spacing.sm,
  '--spacing-md': (t) => t.spacing.md,
  '--spacing-lg': (t) => t.spacing.lg,
  '--spacing-xl': (t) => t.spacing.xl,
  '--spacing-xxl': (t) => t.spacing.xxl,
  '--font-sans': (t) => t.typography.fontSans,
  '--font-mono': (t) => t.typography.fontMono,
  '--font-size-base': (t) => t.typography.fontSizeBase,
  '--font-size-sm': (t) => t.typography.fontSizeSm,
  '--font-size-lg': (t) => t.typography.fontSizeLg,
  '--font-size-xl': (t) => t.typography.fontSizeXl,
  '--line-height-base': (t) => t.typography.lineHeightBase,
  '--line-height-tight': (t) => t.typography.lineHeightTight,
  '--radius-sm': (t) => t.radius.sm,
  '--radius-md': (t) => t.radius.md,
  '--radius-lg': (t) => t.radius.lg,
  '--radius-full': (t) => t.radius.full,
  '--shadow-sm': (t) => t.shadows.sm,
  '--shadow-md': (t) => t.shadows.md,
  '--shadow-glow': (t) => t.shadows.glow,
};

export function tokensToCssVariables(tokens: ThemeTokens): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [varName, getter] of Object.entries(CSS_VAR_MAP)) {
    result[varName] = getter(tokens);
  }
  return result;
}
