import { describe, expect, it } from 'vitest';

import { DEFAULT_THEME_ID } from '@/core/themes';
import type { DocumentData } from './types';
import { formatRestoreSummary, planRestore, assessCloudBackupOverwrite } from './syncUseCases';
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
    });
  });

  it('云端版本更新需确认', () => {
    const local = snapshot([{ ...doc('a', '2024-01-02T00:00:00.000Z'), content: '本地' }]);
    const remote = snapshot([{ ...doc('a', '2024-01-03T00:00:00.000Z'), content: '云端' }]);
    expect(assessCloudBackupOverwrite(local, remote)).toEqual({
      remoteOnlyCount: 0,
      newerRemoteConflictCount: 1,
      remoteOnlyThemeCount: 0,
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
