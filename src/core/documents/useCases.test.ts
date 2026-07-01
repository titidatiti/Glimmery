import { describe, expect, it } from 'vitest';
import { deriveTitleFromContent, createDocument } from './types';
import { updateDocumentContent } from './useCases';

describe('deriveTitleFromContent', () => {
  it('从首行标题提取文稿名', () => {
    expect(deriveTitleFromContent('# 我的故事\n\n正文')).toBe('我的故事');
  });

  it('空内容返回 fallback', () => {
    expect(deriveTitleFromContent('', '默认名')).toBe('默认名');
  });
});

describe('updateDocumentContent', () => {
  it('更新内容并刷新标题', () => {
    const doc = createDocument('旧标题', '');
    const updated = updateDocumentContent(doc, '# 新标题\n');
    expect(updated.title).toBe('新标题');
    expect(updated.content).toBe('# 新标题\n');
  });
});

describe('createDocument', () => {
  it('生成带 id 与时间戳的文稿', () => {
    const doc = createDocument();
    expect(doc.id).toBeTruthy();
    expect(doc.createdAt).toBeTruthy();
    expect(doc.title).toBe('未命名文稿');
  });
});
