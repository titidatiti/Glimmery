import { useState } from 'react';
import { useDocumentStore } from '@/core/documents';
import { useServices } from '@/app/providers';
import { Button, IconButton } from '@/ui';
import styles from './DocumentList.module.css';

export function DocumentList() {
  const { storage } = useServices();
  const documents = useDocumentStore((s) => s.documents);
  const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);
  const selectDocument = useDocumentStore((s) => s.selectDocument);
  const createDocument = useDocumentStore((s) => s.createDocument);
  const renameDocument = useDocumentStore((s) => s.renameDocument);
  const deleteDocument = useDocumentStore((s) => s.deleteDocument);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

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

  return (
    <div className={styles.list}>
      <div className={styles.header}>
        <span className={styles.title}>文稿</span>
        <IconButton label="新建文稿" onClick={() => createDocument(storage)}>
          +
        </IconButton>
      </div>
      <ul className={styles.items}>
        {documents.map((doc) => (
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
                onClick={() => selectDocument(storage, doc.id)}
                onDoubleClick={() => startRename(doc.id, doc.title)}
              >
                <span className={styles.docTitle}>{doc.title}</span>
                <span className={styles.docDate}>
                  {new Date(doc.updatedAt).toLocaleDateString('zh-CN')}
                </span>
              </button>
            )}
            <IconButton
              label="删除文稿"
              className={styles.deleteBtn}
              onClick={() => {
                if (window.confirm(`确定删除「${doc.title}」？`)) {
                  void deleteDocument(storage, doc.id);
                }
              }}
            >
              ×
            </IconButton>
          </li>
        ))}
      </ul>
      <div className={styles.footer}>
        <Button variant="primary" size="sm" onClick={() => createDocument(storage)}>
          新建文稿
        </Button>
      </div>
    </div>
  );
}
