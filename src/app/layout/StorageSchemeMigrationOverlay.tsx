import styles from './StorageSchemeMigrationOverlay.module.css';

export interface StorageSchemeMigrationOverlayProps {
  title: string;
  message: string;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onDefer?: () => void;
  confirmLabel?: string;
  deferLabel?: string;
}

export function StorageSchemeMigrationOverlay({
  title,
  message,
  busy = false,
  error,
  onConfirm,
  onDefer,
  confirmLabel = '开始迁移',
  deferLabel = '稍后（暂不使用云同步）',
}: StorageSchemeMigrationOverlayProps) {
  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="scheme-migration-title">
      <div className={styles.card}>
        <h2 id="scheme-migration-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.message}>{message}</p>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            disabled={busy}
            onClick={() => void onConfirm()}
          >
            {busy ? '迁移中…' : confirmLabel}
          </button>
          {onDefer && (
            <button type="button" className={styles.secondary} disabled={busy} onClick={() => void onDefer()}>
              {deferLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
