import { useCallback, useEffect, useMemo } from 'react';
import { useDocumentStore } from '@/core/documents';
import { useSettingsStore } from '@/core/settings';
import { DEFAULT_SETTINGS } from '@/core/settings';
import { debounce } from '@/lib';
import { useServices } from '@/app/providers';
import { EditorAdapter } from '@/features/editor';
import { DocumentList } from '@/features/document-list';
import { ThemeSwitcher } from '@/features/theme-switcher';
import { SettingsPanel } from '@/features/settings-panel';
import { IconButton } from '@/ui';
import styles from './AppShell.module.css';

export function AppShell() {
  const { storage } = useServices();
  const initialize = useDocumentStore((s) => s.initialize);
  const activeDocument = useDocumentStore((s) => s.activeDocument);
  const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);
  const isLoading = useDocumentStore((s) => s.isLoading);
  const updateContent = useDocumentStore((s) => s.updateContent);
  const persistContent = useDocumentStore((s) => s.persistContent);
  const error = useDocumentStore((s) => s.error);

  const focusMode = useSettingsStore((s) => s.focusMode);
  const sidebarCollapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const toggleFocusMode = useSettingsStore((s) => s.toggleFocusMode);
  const toggleSidebar = useSettingsStore((s) => s.toggleSidebar);
  const autoSaveDelayMs = useSettingsStore((s) => s.autoSaveDelayMs);

  useEffect(() => {
    void initialize(storage);
  }, [initialize, storage]);

  const debouncedSave = useMemo(
    () =>
      debounce(() => {
        void persistContent(storage);
      }, autoSaveDelayMs || DEFAULT_SETTINGS.autoSaveDelayMs),
    [persistContent, storage, autoSaveDelayMs],
  );

  const handleContentChange = useCallback(
    (markdown: string) => {
      updateContent(markdown);
      debouncedSave();
    },
    [updateContent, debouncedSave],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFocusMode();
      }
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFocusMode, toggleSidebar]);

  if (isLoading && !activeDocument) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingText}>微光汇聚中…</span>
      </div>
    );
  }

  return (
    <div className={`${styles.shell} ${focusMode ? styles.focusMode : ''} ${sidebarCollapsed ? styles.sidebarHidden : ''}`}>
      {!focusMode && (
        <aside
          className={`${styles.sidebar} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}
        >
          <DocumentList />
          <ThemeSwitcher />
          <SettingsPanel />
        </aside>
      )}

      {!focusMode && (
        <header className={styles.toolbar}>
          <IconButton label={sidebarCollapsed ? '展开侧栏' : '折叠侧栏'} onClick={toggleSidebar}>
            ☰
          </IconButton>
          <span className={styles.docName}>{activeDocument?.title ?? 'Glimmery'}</span>
          <IconButton label="专注模式 (F11)" onClick={toggleFocusMode}>
            ◎
          </IconButton>
        </header>
      )}

      {focusMode && (
        <button
          type="button"
          className={styles.focusExit}
          onClick={toggleFocusMode}
          aria-label="退出专注模式"
          title="退出专注模式 (F11)"
        />
      )}

      <main className={styles.main}>
        <div className={styles.writingArea}>
          {activeDocument && activeDocumentId && (
            <EditorAdapter
              key={activeDocumentId}
              content={activeDocument.content}
              onChange={handleContentChange}
            />
          )}
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </main>
    </div>
  );
}
