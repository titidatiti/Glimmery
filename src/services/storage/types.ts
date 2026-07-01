import type { DocumentData, DocumentMeta } from '@/core/documents';

export type { DocumentData, DocumentMeta };

export interface StorageProvider {
  list(): Promise<DocumentMeta[]>;
  load(id: string): Promise<DocumentData | null>;
  save(doc: DocumentData): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface StorageKeyValue {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
