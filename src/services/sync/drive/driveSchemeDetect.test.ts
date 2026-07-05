import { describe, expect, it } from 'vitest';

import { DRIVE_LEGACY_BACKUP_FILENAME, DRIVE_MANIFEST_FILENAME } from './driveLayout';
import { detectCloudSyncSchemeFromStore } from './driveSchemeDetect';
import type { GoogleDriveFileStore } from './googleDriveFileStore';

function mockFileStore(files: Record<string, string>): GoogleDriveFileStore {
  const names = new Set(Object.keys(files));
  return {
    has: (name: string) => names.has(name),
    read: async (_token: string, name: string) => files[name] ?? null,
  } as GoogleDriveFileStore;
}

describe('detectCloudSyncSchemeFromStore', () => {
  it('空云端', async () => {
    const status = await detectCloudSyncSchemeFromStore(mockFileStore({}), 'token');
    expect(status.kind).toBe('empty');
    expect(status.version).toBeNull();
  });

  it('当前 v3 manifest', async () => {
    const status = await detectCloudSyncSchemeFromStore(
      mockFileStore({
        [DRIVE_MANIFEST_FILENAME]: JSON.stringify({ version: 3, documents: {} }),
      }),
      'token',
    );
    expect(status.kind).toBe('current');
    expect(status.version).toBe(3);
  });

  it('旧版单文件备份', async () => {
    const status = await detectCloudSyncSchemeFromStore(
      mockFileStore({
        [DRIVE_LEGACY_BACKUP_FILENAME]: JSON.stringify({ version: 2, documents: [] }),
      }),
      'token',
    );
    expect(status.kind).toBe('legacy');
    expect(status.version).toBe(2);
  });

  it('v3 manifest 与 legacy 并存时仍视为待迁移', async () => {
    const status = await detectCloudSyncSchemeFromStore(
      mockFileStore({
        [DRIVE_MANIFEST_FILENAME]: JSON.stringify({ version: 3, documents: {} }),
        [DRIVE_LEGACY_BACKUP_FILENAME]: JSON.stringify({ version: 2, documents: [] }),
      }),
      'token',
    );
    expect(status.kind).toBe('legacy');
  });
});
