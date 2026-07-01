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

export function deriveTitleFromContent(content: string, fallback = '未命名文稿'): string {
  const firstLine = content
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  if (!firstLine) return fallback;
  const heading = firstLine.replace(/^#+\s*/, '');
  return heading.slice(0, 48) || fallback;
}
