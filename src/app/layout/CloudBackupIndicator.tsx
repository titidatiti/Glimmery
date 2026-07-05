import {
  CLOUD_SYNC_UPLOAD_LABELS,
  formatCloudSyncActiveLabel,
  useCloudSyncStore,
} from '@/core/sync';
import styles from './CloudBackupIndicator.module.css';

export function CloudBackupIndicator() {
  const syncProgress = useCloudSyncStore((s) => s.syncProgress);
  const label = formatCloudSyncActiveLabel(CLOUD_SYNC_UPLOAD_LABELS, syncProgress);

  return (
    <span className={styles.indicator} role="status" aria-label={label}>
      <span className={styles.label}>{label}</span>
      <span className={styles.spinner} aria-hidden="true" />
    </span>
  );
}
