import { create } from 'zustand';
import type { StorageProvider } from '@/services/storage';
import { scheduleCloudBackupIfPending, useCloudSyncStore } from '@/core/sync';
import type { DocumentData, DocumentMeta } from './types';
import { formatDocumentTitle, sortDocumentsByUpdatedAt } from './types';
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
  /** 仅在外部重载正文时递增，用于编辑器 remount（勿与 updatedAt 绑定，避免每键重载） */
  activeDocumentEditorEpoch: number;
  /** 当前文稿相对上次落盘有未保存改动 */
  hasUnsavedChanges: boolean;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  initialize: (storage: StorageProvider) => Promise<void>;
  /** 外部写入 storage 后刷新列表与当前文稿（如云端恢复），尽量保持当前选中的文稿 */
  reloadFromStorage: (storage: StorageProvider) => Promise<void>;
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
  activeDocumentEditorEpoch: 0,
  hasUnsavedChanges: false,
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
          hasUnsavedChanges: false,
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
        hasUnsavedChanges: false,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : '加载文稿失败',
      });
    }
  },

  reloadFromStorage: async (storage) => {
    set({ error: null });
    try {
      let docs = await listDocuments(storage);
      if (docs.length === 0) {
        const created = await createNewDocument(storage);
        set({
          documents: [created],
          activeDocumentId: created.id,
          activeDocument: created,
          hasUnsavedChanges: false,
        });
        return;
      }

      const sorted = sortDocumentsByUpdatedAt(docs);
      const { activeDocumentId } = get();
      const targetId =
        activeDocumentId && sorted.some((doc) => doc.id === activeDocumentId)
          ? activeDocumentId
          : sorted[0].id;

      const active = await loadDocument(storage, targetId);
      set((state) => ({
        documents: sorted,
        activeDocumentId: targetId,
        activeDocument: active,
        hasUnsavedChanges: false,
        activeDocumentEditorEpoch: state.activeDocumentEditorEpoch + 1,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '刷新文稿失败',
      });
    }
  },

  selectDocument: async (storage, id) => {
    if (get().activeDocumentId === id) return;
    await get().persistActiveDocument(storage);
    scheduleCloudBackupIfPending();
    set({ isLoading: true, error: null });
    try {
      const doc = await loadDocument(storage, id);
      set({
        activeDocumentId: id,
        activeDocument: doc,
        hasUnsavedChanges: false,
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
      await get().persistActiveDocument(storage);
      scheduleCloudBackupIfPending();
      const doc = await createNewDocument(storage);
      const docs = await listDocuments(storage);
      set({
        documents: sortDocumentsByUpdatedAt(docs),
        activeDocumentId: doc.id,
        activeDocument: doc,
        hasUnsavedChanges: false,
      });
      useCloudSyncStore.getState().markPending();
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
      useCloudSyncStore.getState().markPending();
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
          hasUnsavedChanges: false,
        });
        useCloudSyncStore.getState().markPending();
        return;
      }

      const sorted = sortDocumentsByUpdatedAt(docs);

      if (activeDocumentId === id) {
        const next = await loadDocument(storage, sorted[0].id);
        set({
          documents: sorted,
          activeDocumentId: sorted[0].id,
          activeDocument: next,
          hasUnsavedChanges: false,
        });
      } else {
        set({ documents: sorted });
      }
      useCloudSyncStore.getState().markPending();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除文稿失败' });
    }
  },

  updateContent: (content) => {
    const { activeDocument } = get();
    if (!activeDocument || activeDocument.content === content) return;
    set({
      activeDocument: updateDocumentContent(activeDocument, content),
      hasUnsavedChanges: true,
    });
    useCloudSyncStore.getState().markPending();
  },

  updateTitle: (title) => {
    const { activeDocument } = get();
    if (!activeDocument) return;
    if (formatDocumentTitle(title) === activeDocument.title) return;
    set({
      activeDocument: updateDocumentTitle(activeDocument, title),
      hasUnsavedChanges: true,
    });
    useCloudSyncStore.getState().markPending();
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  persistActiveDocument: async (storage) => {
    const { activeDocument, hasUnsavedChanges } = get();
    if (!activeDocument || !hasUnsavedChanges) return;
    try {
      await saveDocument(storage, activeDocument);
      const docs = await listDocuments(storage);
      set({
        documents: sortDocumentsByUpdatedAt(docs),
        hasUnsavedChanges: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存失败' });
    }
  },
}));
