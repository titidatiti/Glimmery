import { describe, expect, it, vi } from 'vitest';
import {
  createDocument,
  formatDocumentTitle,
  sortDocumentsByUpdatedAt,
  DEFAULT_DOCUMENT_TITLE,
} from './types';
import { saveDocument, updateDocumentContent, updateDocumentTitle } from './useCases';
import type { StorageProvider } from '@/services/storage';

describe('formatDocumentTitle', () => {
  it('去除首尾空白', () => {
    expect(formatDocumentTitle('  故事  ')).toBe('故事');
  });

  it('空标题回退默认名', () => {
    expect(formatDocumentTitle('   ')).toBe(DEFAULT_DOCUMENT_TITLE);
  });
});

describe('sortDocumentsByUpdatedAt', () => {
  it('按更新时间倒序且不改原数组', () => {
    const input = [
      { updatedAt: '2026-01-01T00:00:00.000Z' },
      { updatedAt: '2026-03-01T00:00:00.000Z' },
      { updatedAt: '2026-02-01T00:00:00.000Z' },
    ];
    const sorted = sortDocumentsByUpdatedAt(input);
    expect(sorted.map((d) => d.updatedAt)).toEqual([
      '2026-03-01T00:00:00.000Z',
      '2026-02-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    ]);
    expect(input[0].updatedAt).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('saveDocument', () => {
  it('落盘时不改写 updatedAt', async () => {
    const doc = createDocument('标题', '正文');
    const storage: StorageProvider = {
      list: vi.fn(),
      load: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
    };

    await saveDocument(storage, doc);

    expect(storage.save).toHaveBeenCalledWith(doc);
  });
});

describe('updateDocumentContent', () => {
  it('仅更新正文，不改标题', () => {
    const doc = createDocument('旧标题', '');
    const updated = updateDocumentContent(doc, '正文内容');
    expect(updated.title).toBe('旧标题');
    expect(updated.content).toBe('正文内容');
  });
});

describe('updateDocumentTitle', () => {
  it('更新标题', () => {
    const doc = createDocument('', '');
    const updated = updateDocumentTitle(doc, '新标题');
    expect(updated.title).toBe('新标题');
  });
});

describe('createDocument', () => {
  it('生成带 id 与时间戳的文稿', () => {
    const doc = createDocument();
    expect(doc.id).toBeTruthy();
    expect(doc.createdAt).toBeTruthy();
    expect(doc.title).toBe('');
  });
});
