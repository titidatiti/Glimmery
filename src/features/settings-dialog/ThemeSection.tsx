import { useState } from 'react';
import { BUILTIN_THEMES, useThemeStore } from '@/core/themes';
import { Button } from '@/ui';
import styles from './ThemeSection.module.css';

export function ThemeSection() {
  const themes = useThemeStore((s) => s.themes);
  const activeThemeId = useThemeStore((s) => s.activeThemeId);
  const setActiveTheme = useThemeStore((s) => s.setActiveTheme);
  const addCustomTheme = useThemeStore((s) => s.addCustomTheme);

  const [showEditor, setShowEditor] = useState(false);
  const [customName, setCustomName] = useState('我的主题');
  const [accentColor, setAccentColor] = useState('#cc7832');
  const [baseThemeId, setBaseThemeId] = useState(activeThemeId);

  const handleCreate = () => {
    addCustomTheme(customName.trim() || '我的主题', baseThemeId, accentColor);
    setShowEditor(false);
  };

  return (
    <div className={styles.section}>
      <div className={styles.grid}>
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            className={`${styles.themeCard} ${theme.id === activeThemeId ? styles.active : ''}`}
            onClick={() => setActiveTheme(theme.id)}
            title={theme.description}
          >
            <span className={styles.swatch} style={{ background: theme.tokens.colors.bgBase }}>
              <span
                className={styles.accentDot}
                style={{ background: theme.tokens.colors.accent }}
              />
            </span>
            <span className={styles.themeName}>{theme.name}</span>
          </button>
        ))}
      </div>
      {!showEditor ? (
        <Button size="sm" onClick={() => setShowEditor(true)}>
          自定义主题
        </Button>
      ) : (
        <div className={styles.editor}>
          <input
            className={styles.input}
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="主题名称"
          />
          <select
            className={styles.select}
            value={baseThemeId}
            onChange={(e) => setBaseThemeId(e.target.value)}
          >
            {BUILTIN_THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                基于：{t.name}
              </option>
            ))}
          </select>
          <label className={styles.colorRow}>
            强调色
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
            />
          </label>
          <div className={styles.actions}>
            <Button size="sm" variant="primary" onClick={handleCreate}>
              保存
            </Button>
            <Button size="sm" onClick={() => setShowEditor(false)}>
              取消
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
