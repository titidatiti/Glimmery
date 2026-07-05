import { useEffect, useRef } from 'react';

export function isDocumentSaveShortcut(event: KeyboardEvent): boolean {
  if (event.key.toLowerCase() !== 's') return false;
  if (!event.ctrlKey && !event.metaKey) return false;
  if (event.altKey || event.shiftKey) return false;
  return true;
}

export interface UseSaveShortcutOptions {
  enabled: boolean;
  onSave: () => void | Promise<void>;
}

/**
 * 拦截 Ctrl/Cmd+S，阻止浏览器「保存网页」默认行为。
 * 使用 capture 阶段以便在编辑器之前收到事件。
 */
export function useSaveShortcut({ enabled, onSave }: UseSaveShortcutOptions): void {
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isDocumentSaveShortcut(event)) return;
      event.preventDefault();
      event.stopPropagation();
      void onSaveRef.current();
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [enabled]);
}
