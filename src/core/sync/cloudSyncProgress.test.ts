import { describe, expect, it } from 'vitest';

import {
  CLOUD_SYNC_UPLOAD_LABELS,
  formatCloudSyncActiveLabel,
  formatCloudSyncProgressCounts,
  formatCloudSyncProgressText,
  formatCloudSyncSidebarSubtitle,
} from './cloudSyncProgress';

describe('cloudSyncProgress', () => {
  it('无可计数文件时不显示进度', () => {
    expect(formatCloudSyncProgressText('正在云同步', null)).toBe('正在云同步');
    expect(formatCloudSyncProgressText('正在云同步', { completed: 0, total: 0 })).toBe(
      '正在云同步',
    );
  });

  it('按已完成/总数显示', () => {
    expect(formatCloudSyncProgressText('正在云同步', { completed: 1, total: 4 })).toBe(
      '正在云同步 1/4',
    );
    expect(formatCloudSyncProgressCounts({ completed: 3, total: 4 })).toBe('3/4');
    expect(formatCloudSyncProgressCounts({ completed: 5, total: 4 })).toBe('4/4');
  });

  it('准备阶段与传输阶段文案', () => {
    expect(formatCloudSyncActiveLabel(CLOUD_SYNC_UPLOAD_LABELS, null)).toBe('准备云同步');
    expect(formatCloudSyncActiveLabel(CLOUD_SYNC_UPLOAD_LABELS, { completed: 0, total: 5 })).toBe(
      '正在云同步 0/5',
    );
    expect(formatCloudSyncActiveLabel(CLOUD_SYNC_UPLOAD_LABELS, { completed: 2, total: 5 })).toBe(
      '正在云同步 2/5',
    );
  });

  it('侧栏副标题区分准备与传输', () => {
    expect(formatCloudSyncSidebarSubtitle(null)).toBe('正在获取云端数据…');
    expect(formatCloudSyncSidebarSubtitle({ completed: 2, total: 5 })).toBe('正在同步 2/5');
  });
});
