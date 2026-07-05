import { describe, expect, it } from 'vitest';

import { DEFAULT_THEME_ID } from '@/core/themes';
import type { DocumentData } from './types';
import { formatRestoreSummary, planRestore, planRestoreWithManifest, assessCloudBackupOverwrite, assessCloudBackupOverwriteFromManifest, buildAutoRestoreResolutions, needsStartupRestore } from './syncUseCases';
import type { DriveManifest } from '@/services/sync/drive/driveLayout';
import type { BackupSnapshot } from '@/services/sync';
import { parseDriveBackupPayload } from '@/services/sync';

function doc(id: string, updatedAt: string, title = 't'): DocumentData {
  return { id, title, content: '', createdAt: '2020-01-01T00:00:00.000Z', updatedAt };
}

function snapshot(documents: DocumentData[], customThemes: BackupSnapshot['customThemes'] = []): BackupSnapshot {
  return { documents, customThemes, activeThemeId: DEFAULT_THEME_ID };
}

describe('planRestore', () => {
  it('识别内容不同且 updatedAt 不同的冲突', () => {
    const local = [{ ...doc('a', '2024-01-02T00:00:00.000Z'), content: '本地' }];
    const remote = snapshot([{ ...doc('a', '2024-01-03T00:00:00.000Z'), content: '云端' }]);
    const plan = planRestore(local, remote);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.remoteOnly).toHaveLength(0);
  });

  it('云端新文稿归入 remoteOnly', () => {
    const plan = planRestore([], snapshot([doc('b', '2024-01-01T00:00:00.000Z')]));
    expect(plan.remoteOnly).toHaveLength(1);
    expect(plan.conflicts).toHaveLength(0);
  });

  it('相同 updatedAt 无冲突', () => {
    const d = doc('a', '2024-01-01T00:00:00.000Z');
    const plan = planRestore([d], snapshot([{ ...d }]));
    expect(plan.conflicts).toHaveLength(0);
  });

  it('携带云端自定义配色', () => {
    const plan = planRestore([], snapshot([], [{ version: 1, id: 't1', name: '我的', tokens: {} as never }]));
    expect(plan.remoteThemes).toHaveLength(1);
    expect(plan.remoteActiveThemeId).toBe(DEFAULT_THEME_ID);
  });
});

describe('buildAutoRestoreResolutions', () => {
  it('云端较新时采用云端版本', () => {
    const local = [{ ...doc('a', '2024-01-02T00:00:00.000Z'), content: '本地' }];
    const remote = snapshot([{ ...doc('a', '2024-01-03T00:00:00.000Z'), content: '云端' }]);
    const plan = planRestore(local, remote);
    const resolutions = buildAutoRestoreResolutions(plan);
    expect(resolutions.get('a')).toBe('use-remote');
  });

  it('本地较新时保留本地', () => {
    const local = [{ ...doc('a', '2024-01-04T00:00:00.000Z'), content: '本地' }];
    const remote = snapshot([{ ...doc('a', '2024-01-03T00:00:00.000Z'), content: '云端' }]);
    const plan = planRestore(local, remote);
    const resolutions = buildAutoRestoreResolutions(plan);
    expect(resolutions.get('a')).toBe('keep-local');
  });
});

describe('needsStartupRestore', () => {
  it('仅有云端新文稿时需要拉取', () => {
    const plan = planRestore([], snapshot([doc('b', '2024-01-01T00:00:00.000Z')]));
    const resolutions = buildAutoRestoreResolutions(plan);
    expect(needsStartupRestore(plan, resolutions)).toBe(true);
  });

  it('完全一致时无需拉取', () => {
    const d = doc('a', '2024-01-01T00:00:00.000Z');
    const plan = planRestore([d], snapshot([{ ...d }]));
    const resolutions = buildAutoRestoreResolutions(plan);
    expect(needsStartupRestore(plan, resolutions)).toBe(false);
  });
});

describe('planRestoreWithManifest', () => {
  const emptyManifest: DriveManifest = {
    version: 3,
    updatedAt: '2020-01-01T00:00:00.000Z',
    documents: {},
    settings: null,
  };

  it('manifest 有而本地无的文稿归入 remoteOnly', () => {
    const remoteDoc = doc('b', '2024-01-01T00:00:00.000Z');
    const manifest: DriveManifest = {
      ...emptyManifest,
      documents: { b: { updatedAt: remoteDoc.updatedAt } },
    };
    const plan = planRestoreWithManifest([], manifest, [remoteDoc], [], DEFAULT_THEME_ID);
    expect(plan.remoteOnly).toHaveLength(1);
  });

  it('updatedAt 相同的不同步', () => {
    const d = doc('a', '2024-01-01T00:00:00.000Z');
    const manifest: DriveManifest = {
      ...emptyManifest,
      documents: { a: { updatedAt: d.updatedAt } },
    };
    const plan = planRestoreWithManifest([d], manifest, [], [], DEFAULT_THEME_ID);
    expect(plan.conflicts).toHaveLength(0);
    expect(plan.remoteOnly).toHaveLength(0);
  });

  it('冲突时携带 manifest 中的修改者名称', () => {
    const local = [{ ...doc('a', '2024-01-02T00:00:00.000Z'), content: '本地' }];
    const remote = [{ ...doc('a', '2024-01-03T00:00:00.000Z'), content: '云端' }];
    const manifest: DriveManifest = {
      ...emptyManifest,
      documents: { a: { updatedAt: remote[0].updatedAt, clientName: '工作电脑' } },
    };
    const plan = planRestoreWithManifest(local, manifest, remote, [], DEFAULT_THEME_ID);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0]?.remoteClientName).toBe('工作电脑');
    expect(plan.conflicts[0]?.localClientName).toBeTruthy();
  });
});

describe('assessCloudBackupOverwriteFromManifest', () => {
  it('manifest 显示云端较新时需确认', () => {
    const local = snapshot([doc('a', '2024-01-02T00:00:00.000Z')]);
    const manifest: DriveManifest = {
      version: 3,
      updatedAt: '2020-01-01T00:00:00.000Z',
      documents: {
        a: { updatedAt: '2024-01-05T00:00:00.000Z', clientName: 'MacBook Pro' },
      },
      settings: null,
    };
    const warning = assessCloudBackupOverwriteFromManifest(
      local,
      manifest,
      '2024-01-01T00:00:00.000Z',
    );
    expect(warning?.newerRemoteConflictCount).toBe(1);
    expect(warning?.newerRemoteDocuments).toEqual([
      {
        id: 'a',
        title: 't',
        remoteUpdatedAt: '2024-01-05T00:00:00.000Z',
        remoteClientName: 'MacBook Pro',
      },
    ]);
  });
});

describe('assessCloudBackupOverwrite', () => {
  it('空云端无需确认', () => {
    const local = snapshot([doc('a', '2024-01-02T00:00:00.000Z')]);
    expect(assessCloudBackupOverwrite(local, snapshot([]))).toBeNull();
  });

  it('云端独有文稿需确认', () => {
    const local = snapshot([]);
    const remote = snapshot([doc('b', '2024-01-01T00:00:00.000Z')]);
    expect(assessCloudBackupOverwrite(local, remote)).toEqual({
      remoteOnlyCount: 1,
      newerRemoteConflictCount: 0,
      remoteOnlyThemeCount: 0,
      newerRemoteDocuments: [],
    });
  });

  it('云端版本更新需确认', () => {
    const local = snapshot([{ ...doc('a', '2024-01-02T00:00:00.000Z'), content: '本地' }]);
    const remote = snapshot([{ ...doc('a', '2024-01-03T00:00:00.000Z'), content: '云端' }]);
    expect(assessCloudBackupOverwrite(local, remote)).toEqual({
      remoteOnlyCount: 0,
      newerRemoteConflictCount: 1,
      remoteOnlyThemeCount: 0,
      newerRemoteDocuments: [
        {
          id: 'a',
          title: 't',
          remoteUpdatedAt: '2024-01-03T00:00:00.000Z',
          remoteClientName: undefined,
        },
      ],
    });
  });

  it('本地版本更新无需确认', () => {
    const local = snapshot([{ ...doc('a', '2024-01-04T00:00:00.000Z'), content: '本地' }]);
    const remote = snapshot([{ ...doc('a', '2024-01-03T00:00:00.000Z'), content: '云端' }]);
    expect(assessCloudBackupOverwrite(local, remote)).toBeNull();
  });
});

describe('formatRestoreSummary', () => {
  it('同时恢复文稿与配色', () => {
    expect(formatRestoreSummary(2, 1)).toContain('2 篇文稿');
    expect(formatRestoreSummary(2, 1)).toContain('1 个自定义配色');
  });
});

describe('parseDriveBackupPayload', () => {
  it('兼容 v1 仅文稿备份', () => {
    const parsed = parseDriveBackupPayload({
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      documents: [doc('a', '2024-01-01T00:00:00.000Z')],
    });
    expect(parsed.documents).toHaveLength(1);
    expect(parsed.customThemes).toEqual([]);
    expect(parsed.activeThemeId).toBe(DEFAULT_THEME_ID);
  });

  it('解析 v2 自定义配色', () => {
    const parsed = parseDriveBackupPayload({
      version: 2,
      exportedAt: '2024-01-01T00:00:00.000Z',
      documents: [],
      customThemes: [{ version: 1, id: 'c1', name: '夜读', tokens: {} as never }],
      activeThemeId: 'c1',
    });
    expect(parsed.customThemes).toHaveLength(1);
    expect(parsed.activeThemeId).toBe('c1');
  });
});
