import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useDocumentStore } from '@/core/documents';

import { useSettingsStore } from '@/core/settings';

import { DEFAULT_SETTINGS } from '@/core/settings';

import { debounce, formatUpdatedAt } from '@/lib';

import { useServices } from '@/app/providers';

import { useFocusGestures } from '@/app/hooks/useFocusGestures';

import { useIsMobileLayout, useMobilePanelSwipe } from '@/app/hooks/useMobilePanelSwipe';

import { EditorAdapter } from '@/features/editor';

import { DocumentList, NewDocumentButton } from '@/features/document-list';

import { DocumentSearch } from '@/features/document-search';

import { SettingsDialog, SettingsTrigger } from '@/features/settings-dialog';

import { FocusIcon } from '@/ui';

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

  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobileLayout();

  const { trackStyle, isDragging } = useMobilePanelSwipe({
    enabled: isMobile,
    focusMode,
    onEnterFocus: enterFocusMode,
    onExitFocus: exitFocusMode,
    trackRef: mobileTrackRef,
    sidebarRef,
    mainRef,
  });

  useFocusGestures({
    enabled: !isMobile,
    focusMode,
    onExitFocus: exitFocusMode,
    mainRef,
  });

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

  if (isLoading && !activeDocument) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingText}>微光汇聚中…</span>
      </div>
    );
  }

  return (
    <div
      className={`${styles.shell} ${focusMode ? styles.focusMode : ''} ${isMobile ? styles.mobileShell : ''} ${isDragging ? styles.mobileDragging : ''}`}
    >
      <div
        ref={mobileTrackRef}
        className={styles.mobileTrack}
        style={isMobile ? trackStyle : undefined}
      >
        <aside ref={sidebarRef} className={`${styles.sidebar} ${styles.sidebarScroll}`}>
          <div className={styles.sidebarInner}>
            <SidebarBrand />
            <DocumentSearch />
            <NewDocumentButton />
            <DocumentList />
            <button
              type="button"
              className={styles.sidebarFocusEnter}
              onClick={enterFocusMode}
              aria-label="进入沉浸模式"
              title="进入沉浸模式"
            >
              <FocusIcon className={styles.sidebarFocusEnterIcon} />
              <span className={styles.sidebarFocusEnterLabel}>沉浸模式</span>
            </button>
            <SettingsTrigger />
          </div>
        </aside>

        <main ref={mainRef} className={styles.main}>
          <div className={styles.editorScroll}>
            <div className={styles.writingArea}>
              {activeDocument && activeDocumentId && (
                <EditorAdapter
                  key={activeDocumentId}
                  title={activeDocument.title}
                  initialContent={activeDocument.content}
                  onTitleChange={handleTitleChange}
                  onContentChange={handleContentChange}
                />
              )}
            </div>
          </div>

          {activeDocument && (
            <footer className={styles.editorFooter}>
              <time className={styles.updatedAt} dateTime={activeDocument.updatedAt}>
                最后修改 {formatUpdatedAt(activeDocument.updatedAt)}
              </time>
            </footer>
          )}

          {error && <div className={styles.error}>{error}</div>}
        </main>
      </div>

      <header className={styles.toolbar}>
        <span className={styles.docName}>
          {activeDocument ? displayTitle(activeDocument.title) : 'Glimmery'}
        </span>
        <button
          type="button"
          className={styles.focusEnter}
          onClick={enterFocusMode}
          aria-label="进入沉浸模式"
          title="进入沉浸模式"
        >
          <FocusIcon className={styles.focusEnterIcon} />
          <span className={styles.focusEnterLabel}>沉浸</span>
        </button>
      </header>

      <button
        type="button"
        className={styles.focusExit}
        onClick={exitFocusMode}
        aria-label="退出沉浸模式"
        title="退出沉浸模式（Esc）"
        aria-hidden={!focusMode}
        tabIndex={focusMode ? 0 : -1}
      >
        <span className={styles.focusExitIcon}>☰</span>
        <span className={styles.focusExitHint}>退出沉浸</span>
      </button>

      <SettingsDialog />
    </div>
  );
}
