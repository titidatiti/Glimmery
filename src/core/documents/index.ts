export type { DocumentData, DocumentMeta } from './types';
export {
  createDocument,
  normalizeDocument,
  formatDocumentTitle,
  sortDocumentsByUpdatedAt,
  DEFAULT_DOCUMENT_TITLE,
} from './types';
export { useDocumentStore } from './documentStore';
export type { DocumentStoreState } from './documentStore';
export {
  listDocuments,
  loadDocument,
  saveDocument,
  createNewDocument,
  renameDocument,
  deleteDocument,
  updateDocumentContent,
  updateDocumentTitle,
} from './useCases';
export type { SyncConflict, ConflictResolution, RestorePlan } from './syncUseCases';
export {
  loadAllDocuments,
  buildBackupSnapshot,
  planRestore,
  backupAllDocuments,
  applyRestore,
  pullRemoteBackup,
  pullRemoteDocuments,
  formatRestoreSummary,
} from './syncUseCases';
export { performCloudBackup } from './cloudBackup';
