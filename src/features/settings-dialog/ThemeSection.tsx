import { useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import {
  DARK_BUILTIN_THEMES,
  LIGHT_BUILTIN_THEMES,
  useThemeStore,
  type ThemeDefinition,
} from '@/core/themes';
import { CustomThemeEditor } from './CustomThemeEditor';
import styles from './ThemeSection.module.css';

function ThemeCard({
  theme,
  isActive,
  onSelect,
  onEdit,
}: {
  theme: ThemeDefinition;
  isActive: boolean;
  onSelect: () => void;
  onEdit?: (e: MouseEvent) => void;
}) {
  const showEdit = !theme.isBuiltin && isActive && onEdit;

  return (
    <div className={`${styles.themeCard} ${isActive ? styles.active : ''}`}>
      <button
        type="button"
        className={styles.cardSelect}
        onClick={onSelect}
        title={theme.description}
        aria-pressed={isActive}
      >
        <span className={styles.swatch} style={{ background: theme.tokens.colors.editorBg }}>
          <span
            className={styles.accentDot}
            style={{ background: theme.tokens.colors.accent }}
          />
        </span>
        <span className={styles.themeName}>{theme.name}</span>
      </button>
      {showEdit && (
        <button
          type="button"
          className={styles.editBtn}
          onClick={onEdit}
          aria-label={`编辑主题 ${theme.name}`}
        >
          编辑
        </button>
      )}
    </div>
  );
}

function ThemeGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.group}>
      <h3 className={styles.groupTitle}>{title}</h3>
      <div className={styles.grid}>{children}</div>
    </section>
  );
}

export function ThemeSection() {
  const themes = useThemeStore((s) => s.themes);
  const activeThemeId = useThemeStore((s) => s.activeThemeId);
  const setActiveTheme = useThemeStore((s) => s.setActiveTheme);

  const [editorMode, setEditorMode] = useState<'closed' | 'create' | 'edit'>('closed');
  const [editingThemeId, setEditingThemeId] = useState<string | undefined>();

  const customThemes = useMemo(() => themes.filter((t) => !t.isBuiltin), [themes]);

  const handleCloseEditor = () => {
    setEditorMode('closed');
    setEditingThemeId(undefined);
  };

  const handleEditTheme = (themeId: string, e: MouseEvent) => {
    e.stopPropagation();
    setEditingThemeId(themeId);
    setEditorMode('edit');
  };

  if (editorMode !== 'closed') {
    return (
      <CustomThemeEditor
        editingThemeId={editorMode === 'edit' ? editingThemeId : undefined}
        onClose={handleCloseEditor}
      />
    );
  }

  return (
    <div className={styles.section}>
      <ThemeGroup title="深色主题">
        {DARK_BUILTIN_THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={theme.id === activeThemeId}
            onSelect={() => setActiveTheme(theme.id)}
          />
        ))}
      </ThemeGroup>

      <ThemeGroup title="浅色主题">
        {LIGHT_BUILTIN_THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={theme.id === activeThemeId}
            onSelect={() => setActiveTheme(theme.id)}
          />
        ))}
      </ThemeGroup>

      <ThemeGroup title="自定义主题">
        {customThemes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            isActive={theme.id === activeThemeId}
            onSelect={() => setActiveTheme(theme.id)}
            onEdit={(e) => handleEditTheme(theme.id, e)}
          />
        ))}
        <button
          type="button"
          className={`${styles.themeCard} ${styles.createCard}`}
          onClick={() => setEditorMode('create')}
          title="创建自定义主题"
        >
          <span className={`${styles.swatch} ${styles.createSwatch}`}>
            <span className={styles.plusIcon} aria-hidden>
              +
            </span>
          </span>
          <span className={styles.themeName}>新建主题</span>
        </button>
      </ThemeGroup>
    </div>
  );
}
