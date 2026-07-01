import { create } from 'zustand';
import type { StorageProvider } from '@/services/storage';
import type { DocumentData, DocumentMeta } from './types';
import { sortDocumentsByUpdatedAt } from './types';
import {
  createNewDocument,
  deleteDocument,
  listDocuments,
  loadDocument,
  renameDocument,
  saveDocument,
  updateDocumentContent,
  updateDocumentTitle,
} from './useCases';

export interface DocumentStoreState {
  documents: DocumentMeta[];
  activeDocumentId: string | null;
  activeDocument: DocumentData | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  initialize: (storage: StorageProvider) => Promise<void>;
  selectDocument: (storage: StorageProvider, id: string) => Promise<void>;
  createDocument: (storage: StorageProvider) => Promise<void>;
  renameDocument: (storage: StorageProvider, id: string, title: string) => Promise<void>;
  deleteDocument: (storage: StorageProvider, id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  updateTitle: (title: string) => void;
  updateContent: (content: string) => void;
  persistActiveDocument: (storage: StorageProvider) => Promise<void>;
}

export const useDocumentStore = create<DocumentStoreState>((set, get) => ({
  documents: [],
  activeDocumentId: null,
  activeDocument: null,
  searchQuery: '',
  isLoading: false,
  error: null,

  initialize: async (storage) => {
    set({ isLoading: true, error: null });
    try {
      let docs = await listDocuments(storage);
      if (docs.length === 0) {
        const created = await createNewDocument(storage);
        docs = [created];
        set({
          documents: docs,
          activeDocumentId: created.id,
          activeDocument: created,
          isLoading: false,
        });
        return;
      }
      const sorted = sortDocumentsByUpdatedAt(docs);
      const first = await loadDocument(storage, sorted[0].id);
      set({
        documents: sorted,
        activeDocumentId: sorted[0].id,
        activeDocument: first,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载文稿失败',
      });
    }
  },

  selectDocument: async (storage, id) => {
    if (get().activeDocumentId === id) return;
    set({ isLoading: true, error: null });
    try {
      const doc = await loadDocument(storage, id);
      set({
        activeDocumentId: id,
        activeDocument: doc,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '切换文稿失败',
      });
    }
  },

  createDocument: async (storage) => {
    set({ error: null });
    try {
      const doc = await createNewDocument(storage);
      const docs = await listDocuments(storage);
      set({
        documents: sortDocumentsByUpdatedAt(docs),
        activeDocumentId: doc.id,
        activeDocument: doc,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建文稿失败' });
    }
  },

  renameDocument: async (storage, id, title) => {
    set({ error: null });
    try {
      const updated = await renameDocument(storage, id, title);
      if (!updated) return;
      const docs = await listDocuments(storage);
      set((state) => ({
        documents: sortDocumentsByUpdatedAt(docs),
        activeDocument:
          state.activeDocumentId === id ? updated : state.activeDocument,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '重命名失败' });
    }
  },

  deleteDocument: async (storage, id) => {
    set({ error: null });
    try {
      await deleteDocument(storage, id);
      const docs = await listDocuments(storage);
      const { activeDocumentId } = get();

      if (docs.length === 0) {
        const created = await createNewDocument(storage);
        const refreshed = await listDocuments(storage);
        set({
          documents: refreshed,
          activeDocumentId: created.id,
          activeDocument: created,
        });
        return;
      }

      const sorted = sortDocumentsByUpdatedAt(docs);

      if (activeDocumentId === id) {
        const next = await loadDocument(storage, sorted[0].id);
        set({
          documents: sorted,
          activeDocumentId: sorted[0].id,
          activeDocument: next,
        });
      } else {
        set({ documents: sorted });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除文稿失败' });
    }
  },

  updateContent: (content) => {
    const { activeDocument } = get();
    if (!activeDocument) return;
    set({ activeDocument: updateDocumentContent(activeDocument, content) });
  },

  updateTitle: (title) => {
    const { activeDocument } = get();
    if (!activeDocument) return;
    set({ activeDocument: updateDocumentTitle(activeDocument, title) });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  persistActiveDocument: async (storage) => {
    const { activeDocument } = get();
    if (!activeDocument) return;
    try {
      await saveDocument(storage, activeDocument);
      const docs = await listDocuments(storage);
      set({
        documents: sortDocumentsByUpdatedAt(docs),
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存失败' });
    }
  },
}));
