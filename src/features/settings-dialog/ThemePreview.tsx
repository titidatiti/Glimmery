import type { CSSProperties } from 'react';
import { useSettingsStore, resolveEditorTypographyCssVars } from '@/core/settings';
import { tokensToCssVariables, type ThemeTokens } from '@/core/themes';
import styles from './ThemePreview.module.css';

export interface ThemePreviewProps {
  tokens: ThemeTokens;
  size?: 'default' | 'large';
}

export function ThemePreview({ tokens, size = 'default' }: ThemePreviewProps) {
  const editorTypography = useSettingsStore((s) => s.editorTypography);
  const typographyVars = resolveEditorTypographyCssVars(editorTypography);
  const cssVars = { ...tokensToCssVariables(tokens), ...typographyVars };
  const previewClass =
    size === 'large' ? `${styles.preview} ${styles.previewLarge}` : styles.preview;

  return (
    <div className={previewClass} style={cssVars as CSSProperties}>
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.brandRow}>
            <img className={styles.brandIcon} src="/icon.png" alt="" width={16} height={16} />
            <div className={styles.brand}>Glimmery</div>
          </div>
          <div className={styles.tagline}>Where every glimmer becomes memory.</div>
          <div className={styles.search}>搜索文稿…</div>
          <div className={styles.newDoc}>
            <span className={styles.newDocLabelWrap}>
              <span className={styles.newDocIcon} aria-hidden>
                +
              </span>
              <span className={styles.newDocLabel}>新建文稿</span>
            </span>
          </div>
          <div className={`${styles.docItem} ${styles.docActive}`}>示例文稿</div>
          <div className={styles.docItem}>另一篇草稿</div>
          <div className={styles.settings}>⚙ 设置</div>
        </aside>
        <div className={styles.main}>
          <header className={styles.toolbar}>
            <span className={styles.toolbarTitle}>示例文稿</span>
            <span className={styles.focusBtn}>沉浸</span>
          </header>
          <div className={styles.editor}>
            <div className={`themePreviewEditorWriting ${styles.editorWriting}`}>
              <div className="themePreviewTitle">标题示例</div>
              <p className="themePreviewBody">
                微光汇聚，字句成行。配色会实时反映在整个界面。
              </p>
              <div className={styles.activeLineRow}>
                <div className={styles.activeLineOverlay} aria-hidden />
                <span className={styles.activeLineContent}>
                  <span className={styles.caret} aria-hidden />
                  当前选中行
                </span>
              </div>
            </div>
            <div className={styles.shadowSamples} aria-hidden>
              <div className={styles.shadowSampleCard}>
                <span className={styles.shadowSampleLabel}>阴影预览</span>
              </div>
            </div>
            <div className={styles.borderSamples} aria-hidden>
              <div className={styles.borderSampleSubtle}>
                <span className={styles.borderSampleLabel}>浅边框</span>
              </div>
              <div className={styles.borderSampleStrong}>
                <span className={styles.borderSampleLabel}>边框</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
