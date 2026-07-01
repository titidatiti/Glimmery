import type { StorageProvider } from '@/services/storage';
import type { DocumentData, DocumentMeta } from './types';
import { createDocument, deriveTitleFromContent } from './types';

export async function listDocuments(storage: StorageProvider): Promise<DocumentMeta[]> {
  return storage.list();
}

export async function loadDocument(
  storage: StorageProvider,
  id: string,
): Promise<DocumentData | null> {
  return storage.load(id);
}

export async function saveDocument(
  storage: StorageProvider,
  doc: DocumentData,
): Promise<void> {
  await storage.save({
    ...doc,
    updatedAt: new Date().toISOString(),
  });
}

export async function createNewDocument(storage: StorageProvider): Promise<DocumentData> {
  const doc = createDocument();
  await storage.save(doc);
  return doc;
}

export async function renameDocument(
  storage: StorageProvider,
  id: string,
  title: string,
): Promise<DocumentData | null> {
  const existing = await storage.load(id);
  if (!existing) return null;
  const updated: DocumentData = {
    ...existing,
    title: title.trim() || '未命名文稿',
    updatedAt: new Date().toISOString(),
  };
  await storage.save(updated);
  return updated;
}

export async function deleteDocument(storage: StorageProvider, id: string): Promise<void> {
  await storage.remove(id);
}

export function updateDocumentContent(
  doc: DocumentData,
  content: string,
): DocumentData {
  const title = deriveTitleFromContent(content, doc.title);
  return {
    ...doc,
    content,
    title,
    updatedAt: new Date().toISOString(),
  };
}
