import { afterEach, describe, expect, it } from 'vitest';

import {
  formatSyncClientLabel,
  generateDefaultSyncClientName,
  loadSyncClientName,
  saveSyncClientName,
  sanitizeSyncClientName,
} from './syncClientName';

describe('syncClientName', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('生成默认名称含系统与随机后缀', () => {
    expect(generateDefaultSyncClientName()).toMatch(/^[A-Za-z]+ \([0-9a-f]{4}\)$/);
  });

  it('首次加载时写入 localStorage', () => {
    const name = loadSyncClientName();
    expect(localStorage.getItem('glimmery-sync-client-name')).toBe(name);
  });

  it('保存空字符串时回退为默认名', () => {
    const saved = saveSyncClientName('   ');
    expect(saved).toMatch(/^[A-Za-z]+ \([0-9a-f]{4}\)$/);
  });

  it('截断过长名称', () => {
    const long = 'a'.repeat(100);
    expect(sanitizeSyncClientName(long)).toHaveLength(64);
  });

  it('formatSyncClientLabel 处理空值', () => {
    expect(formatSyncClientLabel(undefined)).toBe('未知设备');
    expect(formatSyncClientLabel('  MacBook  ')).toBe('MacBook');
  });
});
