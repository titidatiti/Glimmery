export type EditorFontFamilyId =
  | 'sans'
  | 'rounded'
  | 'serif'
  | 'literary'
  | 'mono'
  | 'kai'
  | 'song'
  | 'gothic'
  | 'custom';

export type EditorLineHeightId = 'compact' | 'comfortable' | 'relaxed';

/** 持续输入时光标行在编辑区视口内距顶部的目标位置（百分比，40–80） */
export type EditorComfortScrollAnchorPercent = number;

export interface EditorTypographyPreferences {
  fontFamilyId: EditorFontFamilyId;
  customFontFamily: string;
  fontSizeScale: number;
  editorWidthScale: number;
  lineHeightId: EditorLineHeightId;
  comfortScrollAnchorPercent: EditorComfortScrollAnchorPercent;
}

export interface EditorTypographyOption<T extends string> {
  id: T;
  label: string;
}

export interface EditorFontFamilyPreset extends EditorTypographyOption<Exclude<EditorFontFamilyId, 'custom'>> {
  stack: string;
}

export interface EditorLineHeightPreset extends EditorTypographyOption<EditorLineHeightId> {
  title: string;
  body: string;
}

export const EDITOR_FONT_FAMILY_PRESETS: EditorFontFamilyPreset[] = [
  {
    id: 'sans',
    label: '现代无衬线',
    // Web Font 优先（iOS 等移动端系统字体名常无法切换中文）；离线时回退系统字体
    stack:
      "'Noto Sans SC', 'Segoe UI', system-ui, -apple-system, 'Roboto', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  },
  {
    id: 'rounded',
    label: '圆润幼圆',
    // iOS/macOS 优先系统圆体 Yuanti SC；无系统圆体时用 Nunito + Noto Sans SC 作柔和回退
    stack:
      "'Yuanti SC', 'STYuanti', 'YouYuan', 'Hiragino Maru Gothic ProN', 'Nunito', 'Noto Sans SC', sans-serif",
  },
  {
    id: 'serif',
    label: '经典衬线',
    stack:
      "'Georgia', 'Times New Roman', 'Noto Serif SC', 'Songti SC', 'SimSun', 'STSong', serif",
  },
  {
    id: 'literary',
    label: '书卷气质',
    stack:
      "'Palatino Linotype', 'Palatino', 'Book Antiqua', 'Georgia', 'Noto Serif SC', 'FangSong', 'STFangsong', 'Songti SC', serif",
  },
  {
    id: 'mono',
    label: '等宽代码',
    stack:
      "'JetBrains Mono', 'Cascadia Code', 'SF Mono', 'Menlo', 'Consolas', 'Noto Sans SC', monospace",
  },
  {
    id: 'kai',
    label: '楷体意韵',
    stack:
      "'LXGW WenKai TC', 'Kaiti SC', 'STKaiti', 'KaiTi', '楷体', serif",
  },
  {
    id: 'song',
    label: '宋体典雅',
    stack: "'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', serif",
  },
  {
    id: 'gothic',
    label: '几何简约',
    stack:
      "'Futura', 'Avenir Next', 'Avenir', 'Century Gothic', 'Noto Sans SC', 'Helvetica Neue', sans-serif",
  },
];

export const EDITOR_LINE_HEIGHT_PRESETS: EditorLineHeightPreset[] = [
  { id: 'compact', label: '紧凑', title: '1.35', body: '1.6' },
  { id: 'comfortable', label: '舒适', title: '1.45', body: '1.75' },
  { id: 'relaxed', label: '宽松', title: '1.55', body: '1.9' },
];

export const EDITOR_FONT_SIZE_MIN = 13;
export const EDITOR_FONT_SIZE_MAX = 32;
export const EDITOR_FONT_SIZE_DEFAULT_SCALE = 40;

export const EDITOR_WIDTH_MIN = 560;
export const EDITOR_WIDTH_MAX = 1200;
/** 默认约 880px，较原 720px 更适合大屏 */
export const EDITOR_WIDTH_DEFAULT_SCALE = 50;

/** 默认 62% */
export const EDITOR_COMFORT_SCROLL_ANCHOR_MIN = 40;
export const EDITOR_COMFORT_SCROLL_ANCHOR_MAX = 80;
export const EDITOR_COMFORT_SCROLL_ANCHOR_DEFAULT = 62;

export const DEFAULT_EDITOR_TYPOGRAPHY: EditorTypographyPreferences = {
  fontFamilyId: 'sans',
  customFontFamily: '',
  fontSizeScale: EDITOR_FONT_SIZE_DEFAULT_SCALE,
  editorWidthScale: EDITOR_WIDTH_DEFAULT_SCALE,
  lineHeightId: 'comfortable',
  comfortScrollAnchorPercent: EDITOR_COMFORT_SCROLL_ANCHOR_DEFAULT,
};

export const EDITOR_TYPOGRAPHY_STORAGE_KEY = 'glimmery:editor-typography';

const LEGACY_FONT_FAMILY_IDS: Record<string, EditorFontFamilyId> = {
  system: 'sans',
};

const LEGACY_FONT_SIZE_MAP: Record<string, number> = {
  small: 18,
  medium: 40,
  large: 62,
};

export function clampFontSizeScale(scale: number): number {
  return Math.min(100, Math.max(0, Math.round(scale)));
}

export function clampEditorWidthScale(scale: number): number {
  return clampFontSizeScale(scale);
}

export function clampComfortScrollAnchorPercent(percent: number): number {
  return Math.min(
    EDITOR_COMFORT_SCROLL_ANCHOR_MAX,
    Math.max(EDITOR_COMFORT_SCROLL_ANCHOR_MIN, Math.round(percent)),
  );
}

export function resolveComfortScrollAnchorRatio(percent: number): number {
  return clampComfortScrollAnchorPercent(percent) / 100;
}

export function resolveComfortScrollBottomPadding(percent: number): string {
  const clamped = clampComfortScrollAnchorPercent(percent);
  return `${100 - clamped}vh`;
}

export function getComfortScrollAnchorLabel(percent: number): string {
  const clamped = clampComfortScrollAnchorPercent(percent);
  if (clamped <= 50) return '偏上';
  if (clamped >= 68) return '偏下';
  return '适中';
}

export function resolveEditorWidth(scale: number): string {
  const clamped = clampEditorWidthScale(scale);
  const ratio = clamped / 100;
  const widthPx = EDITOR_WIDTH_MIN + ratio * (EDITOR_WIDTH_MAX - EDITOR_WIDTH_MIN);
  return `${Math.round(widthPx)}px`;
}

export function getEditorWidthLabel(scale: number): string {
  const clamped = clampEditorWidthScale(scale);
  if (clamped <= 20) return '较窄';
  if (clamped <= 40) return '适中';
  if (clamped <= 60) return '较宽';
  if (clamped <= 80) return '超宽';
  return '全宽';
}

export function resolveFontSizes(scale: number): { bodySize: string; titleSize: string } {
  const clamped = clampFontSizeScale(scale);
  const ratio = clamped / 100;
  const bodyPx = EDITOR_FONT_SIZE_MIN + ratio * (EDITOR_FONT_SIZE_MAX - EDITOR_FONT_SIZE_MIN);
  const titlePx = bodyPx * 1.35 + 4;
  return {
    bodySize: `${Math.round(bodyPx)}px`,
    titleSize: `${Math.round(titlePx)}px`,
  };
}

export function getFontSizeLabel(scale: number): string {
  const clamped = clampFontSizeScale(scale);
  if (clamped <= 18) return '偏小';
  if (clamped <= 38) return '较小';
  if (clamped <= 58) return '标准';
  if (clamped <= 78) return '偏大';
  return '特大';
}

export function getFontFamilyPreset(id: Exclude<EditorFontFamilyId, 'custom'>): EditorFontFamilyPreset {
  return EDITOR_FONT_FAMILY_PRESETS.find((preset) => preset.id === id) ?? EDITOR_FONT_FAMILY_PRESETS[0];
}

export function getLineHeightPreset(id: EditorLineHeightId): EditorLineHeightPreset {
  return EDITOR_LINE_HEIGHT_PRESETS.find((preset) => preset.id === id) ?? EDITOR_LINE_HEIGHT_PRESETS[1];
}

export function resolveEditorFontFamily(preferences: EditorTypographyPreferences): string {
  if (preferences.fontFamilyId === 'custom') {
    const custom = preferences.customFontFamily.trim();
    return custom || getFontFamilyPreset('sans').stack;
  }
  return getFontFamilyPreset(preferences.fontFamilyId).stack;
}

export function resolveEditorTypographyCssVars(
  preferences: EditorTypographyPreferences,
): Record<string, string> {
  const sizes = resolveFontSizes(preferences.fontSizeScale);
  const lineHeight = getLineHeightPreset(preferences.lineHeightId);

  return {
    '--editor-font-family': resolveEditorFontFamily(preferences),
    '--editor-font-size-body': sizes.bodySize,
    '--editor-font-size-title': sizes.titleSize,
    '--editor-line-height-body': lineHeight.body,
    '--editor-line-height-title': lineHeight.title,
    '--editor-title-body-gap': '32px',
    '--editor-paragraph-gap': '0.85em',
    '--shell-max-width': resolveEditorWidth(preferences.editorWidthScale),
    '--editor-comfort-scroll-anchor-percent': String(
      clampComfortScrollAnchorPercent(preferences.comfortScrollAnchorPercent),
    ),
    '--editor-comfort-scroll-padding-bottom': resolveComfortScrollBottomPadding(
      preferences.comfortScrollAnchorPercent,
    ),
  };
}

export function parseEditorTypographyPreferences(
  raw: unknown,
): EditorTypographyPreferences {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_EDITOR_TYPOGRAPHY;
  }

  const data = raw as Record<string, unknown>;

  let fontFamilyId: EditorFontFamilyId = DEFAULT_EDITOR_TYPOGRAPHY.fontFamilyId;
  if (data.fontFamilyId === 'custom') {
    fontFamilyId = 'custom';
  } else if (typeof data.fontFamilyId === 'string') {
    const legacyId = LEGACY_FONT_FAMILY_IDS[data.fontFamilyId];
    if (legacyId) {
      fontFamilyId = legacyId;
    } else if (EDITOR_FONT_FAMILY_PRESETS.some((preset) => preset.id === data.fontFamilyId)) {
      fontFamilyId = data.fontFamilyId as Exclude<EditorFontFamilyId, 'custom'>;
    }
  }

  const customFontFamily =
    typeof data.customFontFamily === 'string' ? data.customFontFamily : DEFAULT_EDITOR_TYPOGRAPHY.customFontFamily;

  let fontSizeScale = DEFAULT_EDITOR_TYPOGRAPHY.fontSizeScale;
  if (typeof data.fontSizeScale === 'number' && Number.isFinite(data.fontSizeScale)) {
    fontSizeScale = clampFontSizeScale(data.fontSizeScale);
  } else if (typeof data.fontSizeId === 'string' && data.fontSizeId in LEGACY_FONT_SIZE_MAP) {
    fontSizeScale = LEGACY_FONT_SIZE_MAP[data.fontSizeId];
  }

  let editorWidthScale = DEFAULT_EDITOR_TYPOGRAPHY.editorWidthScale;
  if (typeof data.editorWidthScale === 'number' && Number.isFinite(data.editorWidthScale)) {
    editorWidthScale = clampEditorWidthScale(data.editorWidthScale);
  }

  const lineHeightId = EDITOR_LINE_HEIGHT_PRESETS.some((preset) => preset.id === data.lineHeightId)
    ? (data.lineHeightId as EditorLineHeightId)
    : DEFAULT_EDITOR_TYPOGRAPHY.lineHeightId;

  let comfortScrollAnchorPercent = DEFAULT_EDITOR_TYPOGRAPHY.comfortScrollAnchorPercent;
  if (
    typeof data.comfortScrollAnchorPercent === 'number' &&
    Number.isFinite(data.comfortScrollAnchorPercent)
  ) {
    comfortScrollAnchorPercent = clampComfortScrollAnchorPercent(data.comfortScrollAnchorPercent);
  }

  return {
    fontFamilyId,
    customFontFamily,
    fontSizeScale,
    editorWidthScale,
    lineHeightId,
    comfortScrollAnchorPercent,
  };
}

export function loadEditorTypographyPreferences(): EditorTypographyPreferences {
  try {
    const raw = localStorage.getItem(EDITOR_TYPOGRAPHY_STORAGE_KEY);
    if (!raw) return DEFAULT_EDITOR_TYPOGRAPHY;
    return parseEditorTypographyPreferences(JSON.parse(raw));
  } catch {
    return DEFAULT_EDITOR_TYPOGRAPHY;
  }
}

export function saveEditorTypographyPreferences(preferences: EditorTypographyPreferences): void {
  localStorage.setItem(EDITOR_TYPOGRAPHY_STORAGE_KEY, JSON.stringify(preferences));
}
