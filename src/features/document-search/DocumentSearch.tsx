import { useDocumentStore } from '@/core/documents';
import { useComposingInput } from '@/ui';
import styles from './DocumentSearch.module.css';

export function DocumentSearch() {
  const searchQuery = useDocumentStore((s) => s.searchQuery);
  const setSearchQuery = useDocumentStore((s) => s.setSearchQuery);
  const searchInput = useComposingInput(searchQuery, setSearchQuery);

  return (
    <div className={styles.searchBar}>
      <input
        type="search"
        className={styles.input}
        placeholder="搜索文稿"
        value={searchInput.value}
        onChange={searchInput.onChange}
        onCompositionStart={searchInput.onCompositionStart}
        onCompositionEnd={searchInput.onCompositionEnd}
        aria-label="搜索文稿"
      />
    </div>
  );
}
