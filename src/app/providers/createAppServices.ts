import { IndexedDBAdapter } from '@/services/storage';
import { NoopSyncAdapter } from '@/services/sync';
import { NoopAudioEngine } from '@/services/audio';
import type { ServicesContextValue } from '@/services/context';

/**
 * 组合根：在此处（且仅在此处）实例化具体适配器并组装 services。
 * 未来切换存储/同步/音频实现只需修改这里。
 */
export function createAppServices(): ServicesContextValue {
  return {
    storage: new IndexedDBAdapter(),
    sync: new NoopSyncAdapter(),
    audio: new NoopAudioEngine(),
  };
}
