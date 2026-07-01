import type { CSSProperties } from 'react';
import {
  useSettingsStore,
  resolveEditorTypographyCssVars,
} from '@/core/settings';
import styles from './TypographyPreview.module.css';

export function TypographyPreview() {
  const editorTypography = useSettingsStore((s) => s.editorTypography);
  const typographyVars = resolveEditorTypographyCssVars(editorTypography);

  return (
    <div
      className={styles.preview}
      style={typographyVars as CSSProperties}
    >
      <div className="editorWritingSurface">
        <input
          className="editorWritingTitle"
          type="text"
          readOnly
          tabIndex={-1}
          aria-hidden
          value="标题示例"
        />
        <p className="editorWritingBody">
          微光汇聚，字句成行。调整字体与行距，找到最舒适的书写节奏。
          <br />
          The quick brown fox jumps over the lazy dog.
        </p>
      </div>
    </div>
  );
}

