import { useDocumentStore } from '@/core/documents';
import { useServices } from '@/app/providers';
import { IconButton } from '@/ui';
import styles from './DocumentSearch.module.css';

export function DocumentSearch() {
  const { storage } = useServices();
  const searchQuery = useDocumentStore((s) => s.searchQuery);
  const setSearchQuery = useDocumentStore((s) => s.setSearchQuery);
  const createDocument = useDocumentStore((s) => s.createDocument);

  return (
    <div className={styles.searchBar}>
      <input
        type="search"
        className={styles.input}
        placeholder="搜索文稿"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="搜索文稿"
      />
      <IconButton label="新建文稿" onClick={() => createDocument(storage)}>
        +
      </IconButton>
    </div>
  );
}
