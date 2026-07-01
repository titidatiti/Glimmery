import { useThemeStore } from '@/core/themes';
import { Button } from '@/ui';
import { useCustomThemeEditorActions } from './customThemeEditorBridge';
import { ThemePreview } from './ThemePreview';
import styles from './ThemeTabPreview.module.css';

export function ThemeTabPreview() {
  const activeTheme = useThemeStore((s) => s.activeTheme);
  const previewTokens = useThemeStore((s) => s.previewTokens);
  const editorActions = useCustomThemeEditorActions();
  const tokens = previewTokens ?? activeTheme.tokens;

  return (
    <div className={styles.wrapper}>
      <ThemePreview tokens={tokens} size="large" />
      {editorActions && (
        <footer className={styles.editorActions}>
          {editorActions.onDelete ? (
            <Button size="sm" variant="danger" onClick={editorActions.onDelete}>
              删除主题
            </Button>
          ) : (
            <span className={styles.actionSpacer} />
          )}
          <div className={styles.actionGroup}>
            <Button size="sm" variant="primary" onClick={editorActions.onSave}>
              保存
            </Button>
            <Button size="sm" variant="outline" onClick={editorActions.onCancel}>
              取消
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
