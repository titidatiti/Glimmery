import type { ReactNode } from 'react';
import styles from './SettingsPreviewPane.module.css';

export interface SettingsPreviewPaneProps {
  label?: string;
  children: ReactNode;
  collapsible?: boolean;
  expanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

export function SettingsPreviewPane({
  label = '预览',
  children,
  collapsible = false,
  expanded = true,
  onExpandedChange,
}: SettingsPreviewPaneProps) {
  const paneClassName = [
    styles.pane,
    collapsible && styles.paneCollapsible,
    collapsible && !expanded ? styles.paneCollapsed : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={paneClassName} aria-label={label}>
      {collapsible ? (
        <button
          type="button"
          className={styles.toggle}
          onClick={() => onExpandedChange?.(!expanded)}
          aria-expanded={expanded}
        >
          <span className={styles.toggleLabel}>
            {label}
            <span className={styles.toggleHint}>
              {expanded ? ' - 点击折叠' : ' - 点击展开'}
            </span>
          </span>
        </button>
      ) : (
        <p className={styles.label}>{label}</p>
      )}

      {(!collapsible || expanded) && <div className={styles.content}>{children}</div>}
    </aside>
  );
}
