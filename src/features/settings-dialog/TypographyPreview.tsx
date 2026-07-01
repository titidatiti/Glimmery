import type { CSSProperties } from 'react';
import {
  useSettingsStore,
  resolveEditorTypographyCssVars,
  resolveEditorWidth,
} from '@/core/settings';
import styles from './TypographyPreview.module.css';

export function TypographyPreview() {
  const editorTypography = useSettingsStore((s) => s.editorTypography);
  const typographyVars = resolveEditorTypographyCssVars(editorTypography);
  const editorWidth = resolveEditorWidth(editorTypography.editorWidthScale);

  return (
    <div
      className={styles.preview}
      style={
        {
          ...typographyVars,
          maxWidth: editorWidth,
        } as CSSProperties
      }
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
          微光汇聚，字句成行。调整字体与行距，找到最舒适的书写节奏。预览栏会随你的设置实时更新，方便在大屏幕上对照查看。
        </p>
        <p className="editorWritingBody">
          The quick brown fox jumps over the lazy dog. 0123456789
        </p>
      </div>
    </div>
  );
}
