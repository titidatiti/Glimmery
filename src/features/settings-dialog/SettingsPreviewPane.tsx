import type { ReactNode } from 'react';
import styles from './SettingsPreviewPane.module.css';

export interface SettingsPreviewPaneProps {
  label?: string;
  children: ReactNode;
}

export function SettingsPreviewPane({ label = '预览', children }: SettingsPreviewPaneProps) {
  return (
    <aside className={styles.pane} aria-label={label}>
      <p className={styles.label}>{label}</p>
      <div className={styles.content}>{children}</div>
    </aside>
  );
}
