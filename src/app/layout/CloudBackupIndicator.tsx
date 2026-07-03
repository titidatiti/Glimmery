import styles from './CloudBackupIndicator.module.css';

export function CloudBackupIndicator() {
  return (
    <span className={styles.indicator} role="status" aria-label="正在云同步">
      <span className={styles.label}>正在云同步</span>
      <span className={styles.spinner} aria-hidden="true" />
    </span>
  );
}
