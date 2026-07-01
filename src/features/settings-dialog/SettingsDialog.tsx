import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '@/core/settings';
import { IconButton } from '@/ui';
import { AboutSection } from './AboutSection';
import { PlaceholderSection } from './PlaceholderSection';
import { SettingsPreviewPane } from './SettingsPreviewPane';
import { SETTINGS_TABS, tabHasPreview, type SettingsTabId } from './settingsTabs';
import { ThemeSection } from './ThemeSection';
import { ThemeTabPreview } from './ThemeTabPreview';
import { TypographyPreview } from './TypographyPreview';
import { TypographySection } from './TypographySection';
import styles from './SettingsDialog.module.css';

function SettingsPanel({ tab }: { tab: SettingsTabId }) {
  switch (tab) {
    case 'theme':
      return <ThemeSection />;
    case 'typography':
      return <TypographySection />;
    case 'audio':
      return (
        <PlaceholderSection
          title="音频效果"
          description="环境音与白噪音将在后续版本开放，为写作营造更沉浸的氛围。"
        />
      );
    case 'sync':
      return (
        <PlaceholderSection
          title="云同步"
          description="文稿与设置的云端备份将在后续版本开放，本地数据始终优先。"
        />
      );
    case 'about':
      return <AboutSection />;
    default:
      return null;
  }
}

function SettingsTabPreview({ tab }: { tab: SettingsTabId }) {
  if (tab === 'theme') return <ThemeTabPreview />;
  if (tab === 'typography') return <TypographyPreview />;
  return null;
}

export function SettingsDialog() {
  const settingsOpen = useSettingsStore((s) => s.settingsOpen);
  const closeSettings = useSettingsStore((s) => s.closeSettings);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<SettingsTabId>('theme');

  const showPreview = tabHasPreview(activeTab);

  useEffect(() => {
    if (!settingsOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettings();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [settingsOpen, closeSettings]);

  useEffect(() => {
    if (settingsOpen) setActiveTab('theme');
  }, [settingsOpen]);

  if (!settingsOpen) return null;

  return (
    <div className={styles.backdrop} onClick={closeSettings} role="presentation">
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="settings-dialog-title" className={styles.title}>
            设置
          </h2>
          <IconButton label="关闭设置" onClick={closeSettings} className={styles.closeButton}>
            ×
          </IconButton>
        </header>

        <div className={`${styles.layout} ${showPreview ? styles.layoutWithPreview : ''}`}>
          <nav className={styles.tabNav} aria-label="设置分类">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-selected={activeTab === tab.id}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className={styles.panel}>
            <SettingsPanel tab={activeTab} />
          </div>

          {showPreview && (
            <SettingsPreviewPane>
              <SettingsTabPreview tab={activeTab} />
            </SettingsPreviewPane>
          )}
        </div>
      </div>
    </div>
  );
}
