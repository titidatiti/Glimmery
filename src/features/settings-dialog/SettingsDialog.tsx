import { useEffect, useRef } from 'react';
import { useSettingsStore } from '@/core/settings';
import { IconButton } from '@/ui';
import { ThemeSection } from './ThemeSection';
import styles from './SettingsDialog.module.css';

export function SettingsDialog() {
  const settingsOpen = useSettingsStore((s) => s.settingsOpen);
  const closeSettings = useSettingsStore((s) => s.closeSettings);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettings();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [settingsOpen, closeSettings]);

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
          <IconButton label="关闭设置" onClick={closeSettings}>
            ×
          </IconButton>
        </header>
        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>主题</h3>
            <ThemeSection />
          </section>
          <section className={styles.section}>
            <p className={styles.hint}>音频与云同步将在后续版本开放。</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function SettingsTrigger() {
  const openSettings = useSettingsStore((s) => s.openSettings);

  return (
    <button type="button" className={styles.trigger} onClick={openSettings}>
      设置
    </button>
  );
}
