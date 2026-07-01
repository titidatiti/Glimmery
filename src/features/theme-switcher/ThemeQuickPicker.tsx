import { BUILTIN_THEMES, useThemeStore } from '@/core/themes';
import styles from './ThemeQuickPicker.module.css';

export function ThemeQuickPicker() {
  const activeThemeId = useThemeStore((s) => s.activeThemeId);
  const setActiveTheme = useThemeStore((s) => s.setActiveTheme);

  return (
    <div className={styles.picker} role="group" aria-label="主题切换">
      {BUILTIN_THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          className={`${styles.dot} ${theme.id === activeThemeId ? styles.active : ''}`}
          style={{ background: theme.tokens.colors.bgBase }}
          title={theme.name}
          aria-label={`切换到${theme.name}主题`}
          aria-pressed={theme.id === activeThemeId}
          onClick={() => setActiveTheme(theme.id)}
        >
          <span
            className={styles.accent}
            style={{ background: theme.tokens.colors.accent }}
          />
        </button>
      ))}
    </div>
  );
}
