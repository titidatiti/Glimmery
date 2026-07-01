import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DocumentData, DocumentMeta } from '@/core/documents';
import type { StorageKeyValue, StorageProvider } from '../types';

interface GlimmeryDB extends DBSchema {
  documents: {
    key: string;
    value: DocumentData;
    indexes: { 'by-updated': string };
  };
  kv: {
    key: string;
    value: string;
  };
}

const DB_NAME = 'glimmery';
const DB_VERSION = 1;

async function openGlimmeryDB(): Promise<IDBPDatabase<GlimmeryDB>> {
  return openDB<GlimmeryDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('documents')) {
        const store = db.createObjectStore('documents', { keyPath: 'id' });
        store.createIndex('by-updated', 'updatedAt');
      }
      if (!db.objectStoreNames.contains('kv')) {
        db.createObjectStore('kv');
      }
    },
  });
}

export class IndexedDBAdapter implements StorageProvider, StorageKeyValue {
  private dbPromise: Promise<IDBPDatabase<GlimmeryDB>>;

  constructor() {
    this.dbPromise = openGlimmeryDB();
  }

  async list(): Promise<DocumentMeta[]> {
    const db = await this.dbPromise;
    const docs = await db.getAll('documents');
    return docs
      .map(({ id, title, createdAt, updatedAt }) => ({ id, title, createdAt, updatedAt }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async load(id: string): Promise<DocumentData | null> {
    const db = await this.dbPromise;
    return (await db.get('documents', id)) ?? null;
  }

  async save(doc: DocumentData): Promise<void> {
    const db = await this.dbPromise;
    await db.put('documents', doc);
  }

  async remove(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('documents', id);
  }

  async getItem(key: string): Promise<string | null> {
    const db = await this.dbPromise;
    return (await db.get('kv', key)) ?? null;
  }

  async setItem(key: string, value: string): Promise<void> {
    const db = await this.dbPromise;
    await db.put('kv', value, key);
  }

  async removeItem(key: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('kv', key);
  }
}
