import { generateId } from '@/lib';

/** 空标题时的展示与持久化回退名 */
export const DEFAULT_DOCUMENT_TITLE = '未命名文稿';

export interface DocumentMeta {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentData extends DocumentMeta {
  content: string;
}

/** 统一的标题展示逻辑：去空白，空则回退默认名 */
export function formatDocumentTitle(title: string): string {
  return title.trim() || DEFAULT_DOCUMENT_TITLE;
}

/** 按更新时间倒序排序（不修改入参） */
export function sortDocumentsByUpdatedAt<T extends Pick<DocumentMeta, 'updatedAt'>>(
  docs: readonly T[],
): T[] {
  return [...docs].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
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
