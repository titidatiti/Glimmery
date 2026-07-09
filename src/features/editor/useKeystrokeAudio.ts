import { useEffect, useRef } from 'react';
import { useServices } from '@/services/context';
import { useSettingsStore } from '@/core/settings';
import { GLIMMERY_KEYSTROKE_EVENT } from './plugins/keystrokeAudioPlugin';

/**
 * 打字音 hook。
 *
 * 监听 ProseMirror DOM 上的 glimmery:keystroke 自定义事件，
 * 根据设置决定是否播放音效。与编辑器和插件解耦。
 */
export function useKeystrokeAudio(): void {
  const { audio } = useServices();
  const enabled = useSettingsStore((s) => s.keystrokeAudioEnabled);
  const volume = useSettingsStore((s) => s.keystrokeVolume);
  const enabledRef = useRef(enabled);
  const volumeRef = useRef(volume);
  enabledRef.current = enabled;
  volumeRef.current = volume;

  useEffect(() => {
    // 在 :root 上监听，覆盖所有 Milkdown 编辑器的 ProseMirror 实例
    const handler = () => {
      if (!enabledRef.current) return;
      audio.setVolume('keystroke', volumeRef.current);
      audio.playKeystroke();
    };

    document.documentElement.addEventListener(GLIMMERY_KEYSTROKE_EVENT, handler);
    return () => {
      document.documentElement.removeEventListener(GLIMMERY_KEYSTROKE_EVENT, handler);
    };
  }, [audio]);
}
