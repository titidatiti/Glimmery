import { describe, expect, it, beforeEach } from 'vitest';
import { IndexedDBAdapter } from './IndexedDBAdapter';
import type { DocumentData } from '@/core/documents';

describe('IndexedDBAdapter', () => {
  let adapter: IndexedDBAdapter;

  beforeEach(() => {
    adapter = new IndexedDBAdapter();
  });

  const sampleDoc = (): DocumentData => ({
    id: 'test-1',
    title: '测试文稿',
    content: '# Hello',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  it('save + load 往返', async () => {
    const doc = sampleDoc();
    await adapter.save(doc);
    const loaded = await adapter.load(doc.id);
    expect(loaded).toEqual(doc);
  });

  it('list 返回元数据', async () => {
    const doc = sampleDoc();
    await adapter.save(doc);
    const list = await adapter.list();
    expect(list.some((m: { id: string }) => m.id === doc.id)).toBe(true);
  });

  it('remove 删除文稿', async () => {
    const doc = sampleDoc();
    await adapter.save(doc);
    await adapter.remove(doc.id);
    const loaded = await adapter.load(doc.id);
    expect(loaded).toBeNull();
  });

  it('kv 存取', async () => {
    await adapter.setItem('key', 'value');
    expect(await adapter.getItem('key')).toBe('value');
    await adapter.removeItem('key');
    expect(await adapter.getItem('key')).toBeNull();
  });
});
