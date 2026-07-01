export interface ThemeColorTokens {
  bgBase: string;
  bgSurface: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  border: string;
  borderSubtle: string;
  focusRing: string;
  editorBg: string;
  sidebarBg: string;
}

export interface ThemeSpacingTokens {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface ThemeTypographyTokens {
  fontSans: string;
  fontMono: string;
  fontSizeBase: string;
  fontSizeSm: string;
  fontSizeLg: string;
  fontSizeXl: string;
  lineHeightBase: string;
  lineHeightTight: string;
}

export interface ThemeRadiusTokens {
  sm: string;
  md: string;
  lg: string;
  full: string;
}

export interface ThemeShadowTokens {
  sm: string;
  md: string;
  glow: string;
}

export interface ThemeTokens {
  colors: ThemeColorTokens;
  spacing: ThemeSpacingTokens;
  typography: ThemeTypographyTokens;
  radius: ThemeRadiusTokens;
  shadows: ThemeShadowTokens;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  description?: string;
  tokens: ThemeTokens;
  isBuiltin: boolean;
}

export interface SerializedTheme {
  version: 1;
  id: string;
  name: string;
  tokens: ThemeTokens;
}
