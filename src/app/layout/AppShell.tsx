import { useCallback, useEffect, useMemo } from 'react';

import { useDocumentStore, formatDocumentTitle } from '@/core/documents';

import { useSettingsStore } from '@/core/settings';

import { DEFAULT_SETTINGS } from '@/core/settings';

import { debounce, formatUpdatedAt } from '@/lib';

import { useServices } from '@/services/context';

import { useAutoCloudBackup } from '@/app/hooks/useAutoCloudBackup';
import { useStartupCloudSync } from '@/app/hooks/useStartupCloudSync';
import { useFocusGestures } from '@/app/hooks/useFocusGestures';
import { useCloudSyncStore } from '@/core/sync';

import { MobilePanelScroller } from '@/app/mobile-panels';

import { EditorAdapter } from '@/features/editor';

import { DocumentList, NewDocumentButton } from '@/features/document-list';

import { DocumentSearch } from '@/features/document-search';

import { SettingsDialog, SettingsTrigger } from '@/features/settings-dialog';

import { FocusIcon, useIsMobileLayout } from '@/ui';

import { SidebarBrand } from './SidebarBrand';
import { CloudBackupIndicator } from './CloudBackupIndicator';
import { CloudSyncTrigger } from './CloudSyncTrigger';

import styles from './AppShell.module.css';

export function AppShell() {
  const { storage, sync } = useServices();

  const initialize = useDocumentStore((s) => s.initialize);

  const activeDocument = useDocumentStore((s) => s.activeDocument);

  const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);
  const activeDocumentEditorEpoch = useDocumentStore((s) => s.activeDocumentEditorEpoch);

  const isLoading = useDocumentStore((s) => s.isLoading);

  const updateTitle = useDocumentStore((s) => s.updateTitle);

  const updateContent = useDocumentStore((s) => s.updateContent);

  const persistActiveDocument = useDocumentStore((s) => s.persistActiveDocument);

  const error = useDocumentStore((s) => s.error);

  const focusMode = useSettingsStore((s) => s.focusMode);

  const enterFocusMode = useSettingsStore((s) => s.enterFocusMode);

  const exitFocusMode = useSettingsStore((s) => s.exitFocusMode);

  const autoSaveDelayMs = useSettingsStore((s) => s.autoSaveDelayMs);

  const isMobile = useIsMobileLayout();
  const isCloudBackingUp = useCloudSyncStore((s) => s.isCloudBackingUp);

  useAutoCloudBackup(storage, sync);

  const { ready: startupSyncReady, syncing: startupCloudSyncing } = useStartupCloudSync(storage, sync);

  useFocusGestures({
    enabled: !isMobile,
    focusMode,
    onExitFocus: exitFocusMode,
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

  if (!startupSyncReady || (isLoading && !activeDocument)) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingText}>
          {startupCloudSyncing ? '正在从云端同步…' : '微光汇聚中…'}
        </span>
      </div>
    );
  }

  const sidebarPanel = (
    <aside className={`${styles.sidebar} ${styles.sidebarScroll}`}>
      <div className={styles.sidebarInner}>
        <div className={styles.sidebarControls}>
          <SidebarBrand />
          <DocumentSearch />
          <NewDocumentButton />
        </div>
        <div className={styles.sidebarDocuments}>
          <DocumentList />
        </div>
        <div className={styles.sidebarControlsFooter}>
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
          <CloudSyncTrigger />
          <SettingsTrigger />
        </div>
      </div>
    </aside>
  );

  const mainPanel = (
    <main className={styles.main}>
      <div className={styles.editorScroll}>
        <div className={styles.writingArea}>
          {activeDocument && activeDocumentId && (
            <EditorAdapter
              key={`${activeDocumentId}:${activeDocumentEditorEpoch}`}
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
          {isCloudBackingUp && <CloudBackupIndicator />}
        </footer>
      )}

      {error && <div className={styles.error}>{error}</div>}
    </main>
  );

  return (
    <div className={`${styles.shell} ${focusMode ? styles.focusMode : ''} ${isMobile ? styles.mobileShell : ''}`}>
      <MobilePanelScroller
        enabled={isMobile}
        activeIndex={focusMode ? 1 : 0}
        onActiveIndexChange={(index) => (index === 1 ? enterFocusMode() : exitFocusMode())}
        panels={[sidebarPanel, mainPanel]}
      />

      <header className={styles.toolbar}>
        <span className={styles.docName}>
          {activeDocument ? formatDocumentTitle(activeDocument.title) : 'Glimmery'}
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
