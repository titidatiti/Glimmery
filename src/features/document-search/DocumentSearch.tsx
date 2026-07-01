import { useDocumentStore } from '@/core/documents';
import styles from './DocumentSearch.module.css';

export function DocumentSearch() {
  const searchQuery = useDocumentStore((s) => s.searchQuery);
  const setSearchQuery = useDocumentStore((s) => s.setSearchQuery);

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
    </div>
  );
}
