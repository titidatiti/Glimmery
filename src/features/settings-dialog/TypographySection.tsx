import { useMediaQuery } from '@/app/hooks/useMediaQuery';
import {
  useSettingsStore,
  EDITOR_FONT_FAMILY_PRESETS,
  EDITOR_LINE_HEIGHT_PRESETS,
  getEditorWidthLabel,
  getFontSizeLabel,
  resolveEditorWidth,
  resolveFontSizes,
} from '@/core/settings';
import styles from './TypographySection.module.css';

export function TypographySection() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const editorTypography = useSettingsStore((s) => s.editorTypography);
  const setEditorFontFamily = useSettingsStore((s) => s.setEditorFontFamily);
  const setCustomFontFamily = useSettingsStore((s) => s.setCustomFontFamily);
  const setEditorFontSizeScale = useSettingsStore((s) => s.setEditorFontSizeScale);
  const setEditorWidthScale = useSettingsStore((s) => s.setEditorWidthScale);
  const setEditorLineHeight = useSettingsStore((s) => s.setEditorLineHeight);

  const sizes = resolveFontSizes(editorTypography.fontSizeScale);
  const sizeLabel = getFontSizeLabel(editorTypography.fontSizeScale);
  const editorWidth = resolveEditorWidth(editorTypography.editorWidthScale);
  const widthLabel = getEditorWidthLabel(editorTypography.editorWidthScale);

  return (
    <div className={styles.section}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>字体</legend>
        <div className={styles.optionGrid}>
          {EDITOR_FONT_FAMILY_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`${styles.option} ${editorTypography.fontFamilyId === preset.id ? styles.active : ''}`}
              onClick={() => setEditorFontFamily(preset.id)}
              style={{ fontFamily: preset.stack }}
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            className={`${styles.option} ${editorTypography.fontFamilyId === 'custom' ? styles.active : ''}`}
            onClick={() => setEditorFontFamily('custom')}
          >
            自定义
          </button>
        </div>
        {editorTypography.fontFamilyId === 'custom' && (
          <label className={styles.customFontRow}>
            <span className={styles.customFontLabel}>字体族名称</span>
            <input
              className={styles.customFontInput}
              type="text"
              value={editorTypography.customFontFamily}
              onChange={(e) => setCustomFontFamily(e.target.value)}
              placeholder="例如：Helvetica, Arial, sans-serif"
              spellCheck={false}
            />
          </label>
        )}
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>字号</legend>
        <div className={styles.sliderRow}>
          <span className={styles.sliderMark}>偏小</span>
          <input
            className={styles.slider}
            type="range"
            min={0}
            max={100}
            step={1}
            value={editorTypography.fontSizeScale}
            onChange={(e) => setEditorFontSizeScale(Number(e.target.value))}
            aria-valuetext={`${sizeLabel}，正文 ${sizes.bodySize}`}
          />
          <span className={styles.sliderMark}>特大</span>
        </div>
        <p className={styles.sliderValue}>
          {sizeLabel} · 正文 {sizes.bodySize} · 标题 {sizes.titleSize}
        </p>
      </fieldset>

      <fieldset className={`${styles.fieldset} ${isMobile ? styles.fieldsetDisabled : ''}`}>
        <legend className={styles.legend}>编辑区宽度</legend>
        <div className={styles.sliderRow}>
          <span className={styles.sliderMark}>较窄</span>
          <input
            className={styles.slider}
            type="range"
            min={0}
            max={100}
            step={1}
            value={editorTypography.editorWidthScale}
            onChange={(e) => setEditorWidthScale(Number(e.target.value))}
            aria-valuetext={`${widthLabel}，${editorWidth}`}
            disabled={isMobile}
            aria-disabled={isMobile}
          />
          <span className={styles.sliderMark}>全宽</span>
        </div>
        <p className={styles.sliderValue}>
          {isMobile ? '手机端自动使用全宽' : `${widthLabel} · ${editorWidth}`}
        </p>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>行距</legend>
        <div className={styles.segmented}>
          {EDITOR_LINE_HEIGHT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`${styles.segment} ${editorTypography.lineHeightId === preset.id ? styles.active : ''}`}
              onClick={() => setEditorLineHeight(preset.id)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
