import { useDocumentStore } from '@/core/documents';
import { useServices } from '@/app/providers';
import styles from './NewDocumentButton.module.css';

export function NewDocumentButton() {
  const { storage } = useServices();
  const createDocument = useDocumentStore((s) => s.createDocument);

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => createDocument(storage)}
      aria-label="新建文稿"
    >
      <span className={styles.labelWrap}>
        <span className={styles.icon} aria-hidden>
          +
        </span>
        <span className={styles.label}>新建文稿</span>
      </span>
    </button>
  );
}
