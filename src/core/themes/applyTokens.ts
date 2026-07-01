import type { ThemeTokens } from './types';
import {
  accentToFocusRing,
  deriveActiveLineBg,
  finalizeSelectionPair,
} from './colorRoles';
import { resolveShadowCss } from './shadowRoles';
function headingText(tokens: ThemeTokens): string {
  return tokens.colors.headingText ?? tokens.colors.textPrimary;
}

function bodyText(tokens: ThemeTokens): string {
  return tokens.colors.bodyText ?? tokens.colors.textPrimary;
}

const CSS_VAR_MAP: Record<string, (tokens: ThemeTokens) => string> = {
  '--color-bg-base': (t) => t.colors.bgBase,
  '--color-bg-surface': (t) => t.colors.bgSurface,
  '--color-bg-elevated': (t) => t.colors.bgElevated,
  '--color-text-primary': headingText,
  '--color-text-heading': headingText,
  '--color-text-body': bodyText,
  '--color-text-secondary': (t) => t.colors.textSecondary,
  '--color-text-auxiliary': (t) => t.colors.textSecondary,
  '--color-text-muted': (t) => t.colors.textMuted,
  '--color-accent': (t) => t.colors.accent,
  '--color-accent-muted': (t) => t.colors.accentMuted,
  '--color-on-accent': (t) =>
    t.colors.buttonOnAccent ?? t.colors.headingText ?? t.colors.textPrimary,
  '--color-danger': (t) => t.colors.danger ?? t.colors.textSecondary,
  '--color-selection-bg': (t) => finalizeSelectionPair(t.colors).bg,
  '--color-selection-text': (t) => finalizeSelectionPair(t.colors).text,
  '--color-caret': (t) => t.colors.caretColor ?? t.colors.accent,
  '--color-border': (t) => t.colors.border,
  '--color-border-subtle': (t) => t.colors.borderSubtle,
  '--color-focus-ring': (t) => t.colors.focusRing || accentToFocusRing(t.colors.accent),
  '--color-editor-bg': (t) => t.colors.editorBg,
  '--color-sidebar-bg': (t) => t.colors.sidebarBg,
  '--color-sidebar-text': (t) =>
    t.colors.sidebarText ?? t.colors.headingText ?? t.colors.textPrimary,
  '--color-sidebar-text-muted': (t) => t.colors.sidebarTextMuted ?? t.colors.textMuted,
  '--color-active-line-bg': (t) =>
    t.colors.activeLineBg ??
    deriveActiveLineBg(t.colors.editorBg, t.colors.caretColor ?? t.colors.accent),
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
  '--shadow-sm': (t) => resolveShadowCss(t.shadows).sm,
  '--shadow-md': (t) => resolveShadowCss(t.shadows).md,
};

export function tokensToCssVariables(tokens: ThemeTokens): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [varName, getter] of Object.entries(CSS_VAR_MAP)) {
    result[varName] = getter(tokens);
  }
  return result;
}

export function previewTokensFromBase(
  base: ThemeTokens,
  colorOverrides: Partial<ThemeTokens['colors']>,
): ThemeTokens {
  return {
    ...base,
    colors: { ...base.colors, ...colorOverrides },
  };
}
