import { $prose } from '@milkdown/kit/utils';
import { Plugin } from '@milkdown/kit/prose/state';
import type { EditorState } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';

import { findWritingTitleInput } from './activeLinePlugin';

export function isInFirstTopLevelBlock(state: EditorState): boolean {
  const { $from } = state.selection;
  return $from.index(0) === 0;
}

export function shouldFocusTitleOnArrowUp(view: EditorView): boolean {
  const { state } = view;
  if (!state.selection.empty) return false;
  if (!isInFirstTopLevelBlock(state)) return false;
  return view.endOfTextblock('up');
}

export function focusWritingTitleFromBody(view: EditorView): boolean {
  const title = findWritingTitleInput(view);
  if (!title) return false;

  title.focus();
  const end = title.value.length;
  title.setSelectionRange(end, end);
  return true;
}

function createTitleNavigationPlugin() {
  return new Plugin({
    props: {
      handleKeyDown(view, event) {
        if (view.composing) return false;
        if (
          event.key !== 'ArrowUp' ||
          event.shiftKey ||
          event.altKey ||
          event.metaKey ||
          event.ctrlKey
        ) {
          return false;
        }

        if (!shouldFocusTitleOnArrowUp(view)) return false;
        if (!focusWritingTitleFromBody(view)) return false;

        event.preventDefault();
        return true;
      },
    },
  });
}

export const titleNavigationPlugin = $prose(() => createTitleNavigationPlugin());
