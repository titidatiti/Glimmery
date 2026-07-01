import { generateId } from '@/lib';

export interface DocumentMeta {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentData extends DocumentMeta {
  content: string;
}

export function createDocument(title = '', content = ''): DocumentData {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };
}

/** 兼容旧数据：忽略已废弃的 summary 等额外字段 */
export function normalizeDocument(doc: DocumentData & { summary?: string }): DocumentData {
  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
