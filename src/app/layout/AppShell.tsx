import { useCallback, useEffect, useMemo } from 'react';
import { useDocumentStore } from '@/core/documents';
import { useSettingsStore } from '@/core/settings';
import { DEFAULT_SETTINGS } from '@/core/settings';
import { debounce } from '@/lib';
import { useServices } from '@/app/providers';
import { useFocusGestures } from '@/app/hooks/useFocusGestures';
import { EditorAdapter } from '@/features/editor';
import { DocumentList } from '@/features/document-list';
import { DocumentSearch } from '@/features/document-search';
import { SettingsDialog, SettingsTrigger } from '@/features/settings-dialog';
import { SidebarBrand } from './SidebarBrand';
import styles from './AppShell.module.css';

function displayTitle(title: string): string {
  return title.trim() || '未命名文稿';
}

export function AppShell() {
  const { storage } = useServices();
  const initialize = useDocumentStore((s) => s.initialize);
  const activeDocument = useDocumentStore((s) => s.activeDocument);
  const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);
  const isLoading = useDocumentStore((s) => s.isLoading);
  const updateTitle = useDocumentStore((s) => s.updateTitle);
  const updateContent = useDocumentStore((s) => s.updateContent);
  const persistActiveDocument = useDocumentStore((s) => s.persistActiveDocument);
  const error = useDocumentStore((s) => s.error);

  const focusMode = useSettingsStore((s) => s.focusMode);
  const enterFocusMode = useSettingsStore((s) => s.enterFocusMode);
  const exitFocusMode = useSettingsStore((s) => s.exitFocusMode);
  const autoSaveDelayMs = useSettingsStore((s) => s.autoSaveDelayMs);

  useFocusGestures(focusMode, exitFocusMode);

  useEffect(() => {
    void initialize(storage);
  }, [initialize, storage]);

  const debouncedPersist = useMemo(
    () =>
      debounce(() => {
        void persistActiveDocument(storage);
      }, autoSaveDelayMs || DEFAULT_SETTINGS.autoSaveDelayMs),
    [persistActiveDocument, storage, autoSaveDelayMs],
  );

  const handleTitleChange = useCallback(
    (title: string) => {
      updateTitle(title);
      debouncedPersist();
    },
    [updateTitle, debouncedPersist],
  );

  const handleContentChange = useCallback(
    (content: string) => {
      updateContent(content);
      debouncedPersist();
    },
    [updateContent, debouncedPersist],
  );

  const handleBeginWriting = useCallback(() => {
    enterFocusMode();
  }, [enterFocusMode]);

  if (isLoading && !activeDocument) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingText}>微光汇聚中…</span>
      </div>
    );
  }

  return (
    <div className={`${styles.shell} ${focusMode ? styles.focusMode : ''}`}>
      {!focusMode && (
        <aside className={`${styles.sidebar} ${styles.sidebarScroll}`}>
          <SidebarBrand />
          <DocumentSearch />
          <DocumentList />
          <SettingsTrigger />
        </aside>
      )}

      {!focusMode && (
        <header className={styles.toolbar}>
          <span className={styles.docName}>
            {activeDocument ? displayTitle(activeDocument.title) : 'Glimmery'}
          </span>
        </header>
      )}

      {focusMode && (
        <button
          type="button"
          className={styles.focusExit}
          onClick={exitFocusMode}
          aria-label="退出专注模式"
          title="退出专注模式（Esc）"
        >
          <span className={styles.focusExitIcon}>☰</span>
          <span className={styles.focusExitHint}>退出专注</span>
        </button>
      )}

      <main className={styles.main}>
        <div className={styles.writingArea} onPointerDown={handleBeginWriting}>
          {activeDocument && activeDocumentId && (
            <EditorAdapter
              key={activeDocumentId}
              title={activeDocument.title}
              initialContent={activeDocument.content}
              onTitleChange={handleTitleChange}
              onContentChange={handleContentChange}
              onBeginWriting={handleBeginWriting}
            />
          )}
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </main>

      <SettingsDialog />
    </div>
  );
}
