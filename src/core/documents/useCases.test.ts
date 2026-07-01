import { describe, expect, it } from 'vitest';
import { createDocument } from './types';
import { updateDocumentContent, updateDocumentTitle } from './useCases';

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
