import { describe, expect, it } from 'vitest';

import { DEFAULT_THEME_ID } from '@/core/themes';
import type { DriveManifest } from './driveLayout';
import {
  manifestChangedDocumentIds,
  planManifestPull,
  remoteManifestsEqual,
  shouldUploadSettingsForSync,
} from './manifestSyncPlan';

function manifest(
  docs: Record<string, string>,
  settingsAt: string | null = null,
): DriveManifest {
  return {
    version: 3,
    updatedAt: '2026-01-01T00:00:00.000Z',
    documents: Object.fromEntries(Object.entries(docs).map(([id, updatedAt]) => [id, { updatedAt }])),
    settings: settingsAt ? { updatedAt: settingsAt } : null,
  };
}

describe('manifestSyncPlan', () => {
  it('manifest 相同时 skipDocumentReads', () => {
    const remote = manifest({ a: '2024-01-02T00:00:00.000Z' });
    const plan = planManifestPull(
      remote,
      [{ id: 'a', updatedAt: '2024-01-02T00:00:00.000Z' }],
      remote,
      '2024-01-01T00:00:00.000Z',
    );
    expect(plan.skipDocumentReads).toBe(true);
    expect(plan.documentIdsToFetch).toEqual([]);
  });

  it('本地较旧时拉取该篇', () => {
    const remote = manifest({ a: '2024-01-03T00:00:00.000Z' });
    const plan = planManifestPull(
      remote,
      [{ id: 'a', updatedAt: '2024-01-02T00:00:00.000Z' }],
      remote,
      '2024-01-01T00:00:00.000Z',
    );
    expect(plan.documentIdsToFetch).toEqual(['a']);
    expect(plan.skipDocumentReads).toBe(false);
  });

  it('云端新增文稿需拉取', () => {
    const remote = manifest({ b: '2024-01-01T00:00:00.000Z' });
    const plan = planManifestPull(remote, [], null, '2024-01-01T00:00:00.000Z');
    expect(plan.documentIdsToFetch).toEqual(['b']);
  });

  it('manifest 相对缓存变化时拉取有差异的篇', () => {
    const cached = manifest({ a: '2024-01-02T00:00:00.000Z' });
    const remote = manifest({ a: '2024-01-04T00:00:00.000Z' });
    expect(manifestChangedDocumentIds(remote, cached)).toEqual(['a']);
    const plan = planManifestPull(
      remote,
      [{ id: 'a', updatedAt: '2024-01-04T00:00:00.000Z' }],
      cached,
      '2024-01-01T00:00:00.000Z',
    );
    expect(plan.documentIdsToFetch).toEqual([]);
  });

  it('设置 updatedAt 较新时 fetchSettings', () => {
    const remote = manifest({}, '2024-06-01T00:00:00.000Z');
    const plan = planManifestPull(remote, [], null, '2024-01-01T00:00:00.000Z');
    expect(plan.fetchSettings).toBe(true);
  });

  it('remoteManifestsEqual 忽略顶层 updatedAt', () => {
    const a = manifest({ x: '1' });
    const b = { ...a, updatedAt: '2099-01-01T00:00:00.000Z' };
    expect(remoteManifestsEqual(a, b)).toBe(true);
  });

  it('无自定义主题且云端无设置索引时不重复上传设置', () => {
    const snapshot = { customThemes: [], activeThemeId: DEFAULT_THEME_ID };
    const emptyManifest = manifest({});
    expect(
      shouldUploadSettingsForSync(snapshot, emptyManifest, '2024-01-01T00:00:00.000Z', false),
    ).toBe(false);
  });

  it('有自定义主题且云端无设置索引时需上传', () => {
    const snapshot = {
      customThemes: [{ version: 1 as const, id: 't1', name: '夜', tokens: {} as never }],
      activeThemeId: 't1',
    };
    expect(
      shouldUploadSettingsForSync(snapshot, manifest({}), '2024-01-01T00:00:00.000Z', false),
    ).toBe(true);
  });

  it('设置 updatedAt 较新时需上传', () => {
    const snapshot = { customThemes: [], activeThemeId: DEFAULT_THEME_ID };
    expect(
      shouldUploadSettingsForSync(
        snapshot,
        manifest({}, '2024-06-01T00:00:00.000Z'),
        '2024-07-01T00:00:00.000Z',
        false,
      ),
    ).toBe(true);
  });
});
