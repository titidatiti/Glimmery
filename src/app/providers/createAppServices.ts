import { IndexedDBAdapter } from '@/services/storage';
import { GoogleDriveAdapter, NoopSyncAdapter } from '@/services/sync';
import { WebAudioEngine } from '@/services/audio';
import type { ServicesContextValue } from '@/services/context';

/**
 * 组合根：在此处（且仅在此处）实例化具体适配器并组装 services。
 * 未来切换存储/同步/音频实现只需修改这里。
 */
export function createAppServices(): ServicesContextValue {
  const storage = new IndexedDBAdapter();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '';
  const sync = clientId ? new GoogleDriveAdapter(storage, clientId) : new NoopSyncAdapter();

  return {
    storage,
    sync,
    audio: new WebAudioEngine(),
  };
}
