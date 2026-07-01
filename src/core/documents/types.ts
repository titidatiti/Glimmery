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
    id: crypto.randomUUID(),
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

export function deriveTitleFromContent(content: string, fallback = '未命名文稿'): string {
  const firstLine = content
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (!firstLine) return fallback;
  const heading = firstLine.replace(/^#+\s*/, '');
  return heading.slice(0, 48) || fallback;
}
