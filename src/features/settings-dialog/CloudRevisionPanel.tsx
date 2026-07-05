import { useCallback, useEffect, useState } from 'react';
import {
  formatDocumentTitle,
  restoreDocumentFromCloudRevision,
  restoreSettingsFromCloudRevision,
  useDocumentStore,
} from '@/core/documents';
import { formatUpdatedAt } from '@/lib';
import { useServices } from '@/services/context';
import type { CloudRevisionInfo, CloudRevisionSlot } from '@/services/sync';
import styles from './SyncSection.module.css';

function formatRevisionTime(iso: string): string {
  const formatted = formatUpdatedAt(iso);
  return formatted || iso;
}

export function CloudRevisionPanel({ disabled }: { disabled?: boolean }) {
  const { storage, sync } = useServices();
  const documents = useDocumentStore((s) => s.documents);
  const reloadFromStorage = useDocumentStore((s) => s.reloadFromStorage);
  const activeDocumentId = useDocumentStore((s) => s.activeDocumentId);

  const [selectedDocId, setSelectedDocId] = useState(activeDocumentId ?? documents[0]?.id ?? '');
  const [docRevisions, setDocRevisions] = useState<CloudRevisionInfo[]>([]);
  const [settingsRevisions, setSettingsRevisions] = useState<CloudRevisionInfo[]>([]);
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshSettingsRevisions = useCallback(async () => {
    setSettingsRevisions(await sync.listSettingsRevisions());
  }, [sync]);

  const refreshDocRevisions = useCallback(async () => {
    if (!selectedDocId) {
      setDocRevisions([]);
      return;
    }
    setDocRevisions(await sync.listDocumentRevisions(selectedDocId));
  }, [selectedDocId, sync]);

  useEffect(() => {
    void refreshSettingsRevisions();
  }, [refreshSettingsRevisions]);

  useEffect(() => {
    void refreshDocRevisions();
  }, [refreshDocRevisions]);

  const restoreDocument = async (slot: CloudRevisionSlot) => {
    if (!selectedDocId) return;
    const title = formatDocumentTitle(
      documents.find((d) => d.id === selectedDocId)?.title ?? '',
    );
    const confirmed = window.confirm(
      `将云端「${slot === 'current' ? '当前' : `历史 ${slot}`}」版本覆盖到本地文稿「${title}」？`,
    );
    if (!confirmed) return;

    setBusySlot(`doc-${slot}`);
    setError(null);
    setMessage(null);
    try {
      const restored = await restoreDocumentFromCloudRevision(storage, sync, selectedDocId, slot);
      if (!restored) {
        throw new Error('无法读取该云端版本');
      }
      await reloadFromStorage(storage);
      setMessage(`已恢复文稿「${formatDocumentTitle(restored.title)}」`);
      void refreshDocRevisions();
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复失败');
    } finally {
      setBusySlot(null);
    }
  };

  const restoreSettings = async (slot: CloudRevisionSlot) => {
    const confirmed = window.confirm(
      `将云端${slot === 'current' ? '当前' : `历史 ${slot}`}设置（自定义主题等）覆盖到本地？`,
    );
    if (!confirmed) return;

    setBusySlot(`settings-${slot}`);
    setError(null);
    setMessage(null);
    try {
      const ok = await restoreSettingsFromCloudRevision(sync, slot);
      if (!ok) throw new Error('无法读取该云端设置版本');
      setMessage('已恢复云端设置');
      void refreshSettingsRevisions();
    } catch (err) {
      setError(err instanceof Error ? err.message : '恢复设置失败');
    } finally {
      setBusySlot(null);
    }
  };

  const renderRevisionList = (
    revisions: CloudRevisionInfo[],
    onRestore: (slot: CloudRevisionSlot) => void,
    keyPrefix: string,
  ) => {
    if (revisions.length === 0) {
      return <p className={styles.fieldHint}>云端暂无历史版本</p>;
    }
    return (
      <ul className={styles.revisionList}>
        {revisions.map((rev) => (
          <li key={`${keyPrefix}-${rev.slot}`} className={styles.revisionItem}>
            <div className={styles.revisionMeta}>
              <span className={styles.revisionLabel}>{rev.label}</span>
              <span className={styles.revisionTime}>{formatRevisionTime(rev.updatedAt)}</span>
            </div>
            <button
              type="button"
              className={styles.revisionRestoreBtn}
              disabled={disabled || busySlot !== null}
              onClick={() => void onRestore(rev.slot)}
            >
              恢复此版本
            </button>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className={styles.panel}>
      <p className={styles.subheading}>云端版本历史</p>
      <p className={styles.fieldHint}>各保留 3 个历史版本，可恢复至本地。</p>

      {error && <p className={styles.noticeError}>{error}</p>}
      {message && <p className={styles.noticeSuccess}>{message}</p>}

      <div className={styles.settingRow}>
        <span className={styles.itemLabel}>文稿</span>
        <select
          className={styles.revisionSelect}
          value={selectedDocId}
          disabled={disabled || documents.length === 0}
          onChange={(e) => setSelectedDocId(e.target.value)}
          aria-label="选择要查看云端历史的文稿"
        >
          {documents.length === 0 ? (
            <option value="">暂无文稿</option>
          ) : (
            documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {formatDocumentTitle(doc.title)}
              </option>
            ))
          )}
        </select>
      </div>
      {renderRevisionList(docRevisions, restoreDocument, 'doc')}

      <div className={styles.panelDivider} aria-hidden="true" />

      <span className={styles.itemLabel}>用户设置</span>
      {renderRevisionList(settingsRevisions, restoreSettings, 'settings')}
    </div>
  );
}
