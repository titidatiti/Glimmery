import { useIsMobileLayout } from '@/app/hooks/useMobilePanelSwipe';
import { useDocumentStore } from '@/core/documents';
import { useSettingsStore } from '@/core/settings';
import { useServices } from '@/app/providers';
import styles from './NewDocumentButton.module.css';

export function NewDocumentButton() {
  const { storage } = useServices();
  const createDocument = useDocumentStore((s) => s.createDocument);
  const enterFocusMode = useSettingsStore((s) => s.enterFocusMode);
  const isMobile = useIsMobileLayout();

  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => {
        void (async () => {
          await createDocument(storage);
          if (isMobile) enterFocusMode();
        })();
      }}
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
