const STORAGE_KEY = 'glimmery-cloud-backup-interval-sec';

export const DEFAULT_CLOUD_BACKUP_INTERVAL_SEC = 60;

export const MIN_CLOUD_BACKUP_INTERVAL_SEC = 15;

export const MAX_CLOUD_BACKUP_INTERVAL_SEC = 600;

export function clampCloudBackupIntervalSec(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_CLOUD_BACKUP_INTERVAL_SEC;
  return Math.min(
    MAX_CLOUD_BACKUP_INTERVAL_SEC,
    Math.max(MIN_CLOUD_BACKUP_INTERVAL_SEC, Math.round(value)),
  );
}

export function loadCloudBackupIntervalSec(): number {
  if (typeof localStorage === 'undefined') return DEFAULT_CLOUD_BACKUP_INTERVAL_SEC;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return DEFAULT_CLOUD_BACKUP_INTERVAL_SEC;
    return clampCloudBackupIntervalSec(Number.parseInt(raw, 10));
  } catch {
    return DEFAULT_CLOUD_BACKUP_INTERVAL_SEC;
  }
}

export function saveCloudBackupIntervalSec(seconds: number): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, String(clampCloudBackupIntervalSec(seconds)));
}

export function notifyCloudBackupIntervalChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('glimmery-cloud-backup-interval-changed'));
}
