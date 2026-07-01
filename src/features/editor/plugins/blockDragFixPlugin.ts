import { $prose } from '@milkdown/kit/utils';
import { NodeSelection, Plugin, PluginKey, TextSelection } from '@milkdown/kit/prose/state';
import type { Slice } from '@milkdown/kit/prose/model';
import type { Selection } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';
import { dropPoint } from 'prosemirror-transform';

import { ACTIVE_LINE_REFRESH_EVENT } from './activeLinePlugin';

type BlockDraggingState = {
  slice: Slice;
  move: boolean;
  node?: NodeSelection;
};

const blockDragFixPluginKey = new PluginKey('glimmery-block-drag-fix');

/** drop 后若整段被 NodeSelection 选中，改为段内 TextSelection，避免整段半透明底色 */
export function textSelectionAfterTextblockNode(nodeSelection: Selection): Selection | null {
  if (!(nodeSelection instanceof NodeSelection) || !nodeSelection.node.isTextblock) {
    return null;
  }

  const doc = nodeSelection.$anchor.doc;
  const innerPos = Math.min(nodeSelection.from + 1, doc.content.size - 1);
  return TextSelection.near(doc.resolve(innerPos), 1);
}

export function isBlockDragging(view: EditorView): boolean {
  return view.dom.dataset.dragging === 'true' && !!view.dragging;
}

/** 在 ProseMirror 外松开拖拽时补全 drop（块手柄在编辑区 DOM 之外） */
export function completeBlockDropAt(
  view: EditorView,
  clientX: number,
  clientY: number,
): boolean {
  const dragging = view.dragging as BlockDraggingState | null;
  if (!dragging || view.dom.dataset.dragging !== 'true') return false;

  const eventPos = view.posAtCoords({ left: clientX, top: clientY });
  if (!eventPos) return false;

  const slice = dragging.slice;
  const $mouse = view.state.doc.resolve(eventPos.pos);
  const move = !!dragging.move;
  const insertPos = dropPoint(view.state.doc, $mouse.pos, slice) ?? $mouse.pos;
  const tr = view.state.tr;

  if (move) {
    const nodeSelection = dragging.node as NodeSelection | undefined;
    if (nodeSelection) nodeSelection.replace(tr);
    else tr.deleteSelection();
  }

  const pos = tr.mapping.map(insertPos);
  const isNode =
    slice.openStart === 0 && slice.openEnd === 0 && slice.content.childCount === 1;
  const beforeInsert = tr.doc;

  if (isNode) tr.replaceRangeWith(pos, pos, slice.content.firstChild!);
  else tr.replaceRange(pos, pos, slice);

  if (tr.doc.eq(beforeInsert)) {
    clearBlockDragState(view);
    return false;
  }

  const cursorPos = isNode ? pos + 1 : pos;
  tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(cursorPos, tr.doc.content.size - 1)), 1));

  view.focus();
  view.dispatch(tr.setMeta('uiEvent', 'drop'));
  clearBlockDragState(view);
  requestAnimationFrame(() => {
    view.dom.dispatchEvent(new CustomEvent(ACTIVE_LINE_REFRESH_EVENT, { bubbles: true }));
  });
  return true;
}

function clearBlockDragState(view: EditorView): void {
  view.dom.dataset.dragging = 'false';
  view.dragging = null;
}

function createBlockDragFixPlugin() {
  return new Plugin({
    key: blockDragFixPluginKey,
    appendTransaction(transactions, _oldState, newState) {
      if (!transactions.some((tr) => tr.getMeta('uiEvent') === 'drop')) return null;

      const replacement = textSelectionAfterTextblockNode(newState.selection);
      if (!replacement) return null;

      return newState.tr.setSelection(replacement);
    },
    view(view) {
      let lastPointer: { x: number; y: number } | null = null;
      const doc = view.dom.ownerDocument;

      const trackPointer = (event: DragEvent) => {
        if (view.dom.dataset.dragging !== 'true') return;
        lastPointer = { x: event.clientX, y: event.clientY };
      };

      const onDragOver = (event: DragEvent) => {
        if (!isBlockDragging(view)) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        trackPointer(event);
      };

      const onDrop = (event: DragEvent) => {
        if (view.dom.dataset.dragging !== 'true') return;
        trackPointer(event);
        if (view.dom.contains(event.target as Node)) return;

        event.preventDefault();
        completeBlockDropAt(view, event.clientX, event.clientY);
      };

      const onDragEnd = () => {
        requestAnimationFrame(() => {
          if (!view.dragging && view.dom.dataset.dragging !== 'true') {
            lastPointer = null;
            return;
          }

          const point = lastPointer;
          if (point) completeBlockDropAt(view, point.x, point.y);
          else clearBlockDragState(view);

          lastPointer = null;
        });
      };

      doc.addEventListener('dragover', onDragOver, true);
      doc.addEventListener('drop', onDrop, true);
      doc.addEventListener('dragend', onDragEnd, true);

      return {
        destroy() {
          doc.removeEventListener('dragover', onDragOver, true);
          doc.removeEventListener('drop', onDrop, true);
          doc.removeEventListener('dragend', onDragEnd, true);
        },
      };
    },
  });
}

export const blockDragFixPlugin = $prose(() => createBlockDragFixPlugin());
