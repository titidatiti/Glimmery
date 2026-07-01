export interface ThemeColorTokens {
  bgBase: string;
  bgSurface: string;
  bgElevated: string;
  /** 主标题文字；缺省时与 textPrimary 相同 */
  headingText?: string;
  /** 正文文字；缺省时与 textPrimary 相同 */
  bodyText?: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentMuted: string;
  /** 编辑区光标色；缺省时与 accent 相同 */
  caretColor?: string;
  border: string;
  borderSubtle: string;
  focusRing: string;
  editorBg: string;
  sidebarBg: string;
  /** 侧栏文字（品牌名、文稿列表）；缺省时与 headingText / textPrimary 相同 */
  sidebarText?: string;
  /** 侧栏弱提示文字；缺省时与 textMuted 相同 */
  sidebarTextMuted?: string;
  /** 编辑区光标所在行背景；缺省时由 deriveActiveLineBg 推导 */
  activeLineBg?: string;
  /** 编辑区文字选区背景；缺省时由 deriveSelectionBg 推导 */
  selectionBg?: string;
  /** 编辑区文字选区前景；缺省时由 deriveSelectionText 推导 */
  selectionText?: string;
  /** 危险操作（如删除）文字色 */
  danger?: string;
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
  /** 内置主题遗留字段，不再导出为 CSS 变量 */
  glow?: string;
  /** 阴影着色；设置后由 shadowColor 生成 sm / md */
  shadowColor?: string;
  /** 是否启用阴影（sm / md） */
  shadowEnabled?: boolean;
  /** 是否由用户自定义阴影（否则沿用基准主题 CSS） */
  shadowCustomized?: boolean;
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
