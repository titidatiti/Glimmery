import { useMemo, useState } from 'react';
import { useDocumentStore } from '@/core/documents';
import { useSettingsStore } from '@/core/settings';
import { useServices } from '@/app/providers';
import { IconButton } from '@/ui';
import styles from './DocumentList.module.css';

function displayTitle(title: string): string {
  return title.trim() || '未命名文稿';
}

export function DocumentList() {
  const { storage } = useServices();
  const documents = useDocumentStore((s) => s.documents);
  const searchQuery = useDocumentStore((s) => s.searchQuery);
  const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);
  const selectDocument = useDocumentStore((s) => s.selectDocument);
  const renameDocument = useDocumentStore((s) => s.renameDocument);
  const deleteDocument = useDocumentStore((s) => s.deleteDocument);
  const exitFocusMode = useSettingsStore((s) => s.exitFocusMode);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((doc) => displayTitle(doc.title).toLowerCase().includes(q));
  }, [documents, searchQuery]);

  const startRename = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const commitRename = async (id: string) => {
    if (editTitle.trim()) {
      await renameDocument(storage, id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleSelect = (id: string) => {
    exitFocusMode();
    void selectDocument(storage, id);
  };

  return (
    <div className={styles.list}>
      <ul className={styles.items}>
        {filteredDocuments.length === 0 ? (
          <li className={styles.empty}>无匹配文稿</li>
        ) : (
          filteredDocuments.map((doc) => (
            <li key={doc.id} className={styles.item}>
              {editingId === doc.id ? (
                <input
                  className={styles.renameInput}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => commitRename(doc.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void commitRename(doc.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  className={`${styles.docButton} ${doc.id === activeDocumentId ? styles.active : ''}`}
                  onClick={() => handleSelect(doc.id)}
                  onDoubleClick={() => startRename(doc.id, doc.title)}
                >
                  <span className={styles.docTitle}>{displayTitle(doc.title)}</span>
                </button>
              )}
              <IconButton
                label="删除文稿"
                className={styles.deleteBtn}
                onClick={() => {
                  if (window.confirm(`确定删除「${displayTitle(doc.title)}」？`)) {
                    void deleteDocument(storage, doc.id);
                  }
                }}
              >
                ×
              </IconButton>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
