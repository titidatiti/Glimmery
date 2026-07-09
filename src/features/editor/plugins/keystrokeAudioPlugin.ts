import { $prose } from '@milkdown/kit/utils';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';

/**
 * 打字音 Milkdown 插件。
 *
 * 通过自定义 DOM 事件向外部通知有效的打字按键，由消费方（EditorAdapter）决定是否播放音效。
 * 这样插件本身不依赖 services 层的 AudioEngine，保持 feature ↔ service 的正确依赖方向。
 *
 * 在中文输入法组合期间（view.composing 为 true）不触发事件。
 */

export const GLIMMERY_KEYSTROKE_EVENT = 'glimmery:keystroke';

export interface KeystrokeAudioEvent extends CustomEvent {
  detail: {
    key: string;
    code: string;
  };
}

const keystrokeAudioPluginKey = new PluginKey('glimmery-keystroke-audio');

/**
 * 判定是否为应该触发音效的按键（排除修饰键、导航键、功能键等）。
 */
function isKeystrokeKey(e: KeyboardEvent): boolean {
  // 修饰键不发声
  if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
    return false;
  }
  // 功能键不发声
  if (e.key.startsWith('F')) {
    return false;
  }
  // 方向键不发声
  if (e.key.startsWith('Arrow')) {
    return false;
  }
  // 其他不发声的键
  if (['Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Menu', 'Escape'].includes(e.key)) {
    return false;
  }
  // 其余按键（含字母、数字、标点、Enter、Backspace、Delete、Space）都触发音效
  return true;
}

function dispatchKeystrokeEvent(view: EditorView, e: KeyboardEvent) {
  view.dom.dispatchEvent(
    new CustomEvent(GLIMMERY_KEYSTROKE_EVENT, {
      detail: {
        key: e.key,
        code: e.code,
      },
    }),
  );
}

export function createKeystrokeAudioPlugin() {
  return new Plugin({
    key: keystrokeAudioPluginKey,
    view(editorView) {
      const handleKeyDown = (e: Event) => {
        if (!(e instanceof KeyboardEvent)) return;
        // 中文输入法组合期间不触发
        if (editorView.composing) return;
        if (!isKeystrokeKey(e)) return;
        dispatchKeystrokeEvent(editorView, e);
      };

      editorView.dom.addEventListener('keydown', handleKeyDown);

      return {
        destroy() {
          editorView.dom.removeEventListener('keydown', handleKeyDown);
        },
      };
    },
  });
}

export const keystrokeAudioPlugin = $prose(() => createKeystrokeAudioPlugin());
