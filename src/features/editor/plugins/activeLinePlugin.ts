import { $prose } from '@milkdown/kit/utils';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';

import { resolveLineHeightPx } from './lineMetrics';

export const ACTIVE_LINE_OVERLAY_CLASS = 'glimmery-active-line-overlay';
export const ACTIVE_LINE_HOST_CLASS = 'glimmery-active-line-host';
export const ACTIVE_LINE_REFRESH_EVENT = 'glimmery-active-line-refresh';
/** 较默认 3px 细约 30% */
export const GLIMMERY_CARET_WIDTH_PX = 2;

const activeLinePluginKey = new PluginKey('glimmery-active-line');

export interface LineCoords {
  top: number;
  bottom: number;
}

export interface SnappedLineMetrics {
  overlayTop: number;
  caretTop: number;
  height: number;
}

/** 将高亮对齐到块内行网格，避免拖拽后光标坐标与 line-height 不一致导致底部错位 */
export function computeSnappedLineMetrics(
  coords: LineCoords,
  blockEl: HTMLElement,
  hostTop: number,
  editorTop: number,
  lineHeightPx: number,
): SnappedLineMetrics {
  const blockRect = blockEl.getBoundingClientRect();
  const style = getComputedStyle(blockEl);
  const paddingTop = Number.parseFloat(style.paddingTop) || 0;
  const centerY = (coords.top + coords.bottom) / 2;
  const relativeCenter = centerY - blockRect.top - paddingTop;
  const lineIndex = Math.max(0, Math.round((relativeCenter - lineHeightPx / 2) / lineHeightPx));
  const lineTopViewport = blockRect.top + paddingTop + lineIndex * lineHeightPx;

  return {
    overlayTop: lineTopViewport - hostTop,
    caretTop: lineTopViewport - editorTop,
    height: lineHeightPx,
  };
}

/** 正文列与编辑面板之间的中间宽度 */
export function computeOverlayWidth(textWidth: number, panelWidth: number): number {
  if (panelWidth <= textWidth) return textWidth;
  return (textWidth + panelWidth) / 2;
}

/** 与文字重叠区纯色，外侧才开始渐变 */
export function computeOverlayGradient(textWidth: number, overlayWidth: number): string {
  const color = 'var(--color-active-line-bg)';

  if (overlayWidth <= textWidth) {
    return color;
  }

  const fadeStart = ((overlayWidth - textWidth) / 2 / overlayWidth) * 100;
  const fadeEnd = 100 - fadeStart;

  return `linear-gradient(90deg, transparent 0%, ${color} ${fadeStart}%, ${color} ${fadeEnd}%, transparent 100%)`;
}

/** 取光标所在块级元素，用于按块计算 line-height（拖拽后光标可能落在不同块） */
export function findBlockElementAtPos(view: EditorView, pos: number): HTMLElement {
  const dom = view.domAtPos(pos, 1);
  let node: Node | null = dom.node;

  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node instanceof HTMLElement && node !== view.dom) {
    const parent = node.parentElement;
    if (parent === view.dom) return node;
    node = parent;
  }

  return view.dom;
}

function findScrollParent(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element.parentElement;
  while (current) {
    const { overflowY } = getComputedStyle(current);
    if (overflowY === 'auto' || overflowY === 'scroll') return current;
    current = current.parentElement;
  }
  return null;
}

function mountOverlay(view: EditorView) {
  const overlay = document.createElement('div');
  overlay.className = ACTIVE_LINE_OVERLAY_CLASS;
  overlay.setAttribute('aria-hidden', 'true');

  const host = view.dom.parentElement;
  if (host) {
    host.classList.add(ACTIVE_LINE_HOST_CLASS);
    host.insertBefore(overlay, view.dom);
  } else {
    view.dom.prepend(overlay);
  }

  view.dom.classList.add('glimmery-active-line-editor');

  return { overlay, host };
}

function findMainVirtualCaret(view: EditorView): HTMLElement | null {
  const cursor = view.dom.querySelector(
    '.prosemirror-virtual-cursor:not(.prosemirror-virtual-cursor-left):not(.prosemirror-virtual-cursor-right)',
  );
  return cursor instanceof HTMLElement ? cursor : null;
}

export function measureCaretLineMetrics(
  view: EditorView,
  overlayHost: HTMLElement | null = null,
): SnappedLineMetrics | null {
  if (!view.hasFocus()) return null;

  const { head } = view.state.selection;
  try {
    const coords = view.coordsAtPos(head);
    const editorRect = view.dom.getBoundingClientRect();
    const hostEl = overlayHost ?? view.dom.parentElement ?? view.dom;
    const hostTop = hostEl.getBoundingClientRect().top;
    const lineRectHeight = Math.max(coords.bottom - coords.top, 1);
    const lineElement = findBlockElementAtPos(view, head);
    const lineHeightPx = resolveLineHeightPx(lineElement, lineRectHeight);
    return computeSnappedLineMetrics(
      coords,
      lineElement,
      hostTop,
      editorRect.top,
      lineHeightPx,
    );
  } catch {
    return null;
  }
}

export function syncVirtualCaret(view: EditorView, metrics: { top: number; height: number }) {
  const cursor = findMainVirtualCaret(view);
  if (!cursor) return;

  const halfWidth = GLIMMERY_CARET_WIDTH_PX / 2;

  cursor.style.setProperty('height', `${metrics.height}px`, 'important');
  cursor.style.setProperty('top', `${metrics.top}px`, 'important');
  cursor.style.setProperty('width', `${GLIMMERY_CARET_WIDTH_PX}px`, 'important');
  cursor.style.setProperty('min-width', `${GLIMMERY_CARET_WIDTH_PX}px`, 'important');
  cursor.style.setProperty('border-left', 'none', 'important');
  cursor.style.setProperty('background', 'var(--color-caret)', 'important');
  cursor.style.setProperty('transform', `translateX(-${halfWidth}px)`, 'important');
  cursor.style.setProperty('margin-top', '0', 'important');
}

function createActiveLinePlugin() {
  return new Plugin({
    key: activeLinePluginKey,
    view(view) {
      const { overlay, host } = mountOverlay(view);
      const scrollParent = findScrollParent(view.dom);

      const hide = () => {
        overlay.style.display = 'none';
      };

      const update = () => {
        if (view.composing) {
          hide();
          return;
        }

        if (!view.hasFocus()) {
          hide();
          return;
        }

        const metrics = measureCaretLineMetrics(view, overlay.parentElement);
        if (!metrics) {
          hide();
          return;
        }

        try {
          const blockRect = view.dom.getBoundingClientRect();
          const { overlayTop, caretTop, height } = metrics;

          const panelWidth = scrollParent?.clientWidth ?? blockRect.width;
          const textWidth = blockRect.width;
          const overlayWidth = computeOverlayWidth(textWidth, panelWidth);

          overlay.style.display = 'block';
          overlay.style.top = `${overlayTop}px`;
          overlay.style.height = `${height}px`;
          overlay.style.width = `${overlayWidth}px`;
          overlay.style.background = computeOverlayGradient(textWidth, overlayWidth);
          syncVirtualCaret(view, { top: caretTop, height });
        } catch {
          hide();
        }
      };

      /** virtual-cursor 会在 selectionchange 时把高度重置为字形高，需在其后再同步整行高 */
      const syncCaretAfterVirtualCursor = () => {
        if (view.composing) return;
        scheduleUpdate();
      };

      const scheduleUpdate = () => {
        requestAnimationFrame(() => requestAnimationFrame(update));
      };

      const scheduleSettledUpdate = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(update);
          });
        });
      };

      update();

      const ownerDoc = view.dom.ownerDocument;
      ownerDoc.addEventListener('selectionchange', syncCaretAfterVirtualCursor);
      view.dom.addEventListener('focusin', scheduleUpdate);
      view.dom.addEventListener('focusout', scheduleUpdate);
      view.dom.addEventListener('compositionend', scheduleUpdate);
      view.dom.addEventListener('dragend', scheduleSettledUpdate);
      window.addEventListener('resize', scheduleUpdate);
      scrollParent?.addEventListener('scroll', scheduleUpdate, { passive: true });
      ownerDoc.addEventListener('dragend', scheduleSettledUpdate, true);
      view.dom.addEventListener(ACTIVE_LINE_REFRESH_EVENT, scheduleSettledUpdate);

      return {
        update(nextView, prevState) {
          if (nextView.composing) return;
          if (
            nextView.state.selection !== prevState.selection ||
            nextView.state.doc !== prevState.doc
          ) {
            scheduleUpdate();
          }
        },
        destroy() {
          ownerDoc.removeEventListener('selectionchange', syncCaretAfterVirtualCursor);
          view.dom.removeEventListener('focusin', scheduleUpdate);
          view.dom.removeEventListener('focusout', scheduleUpdate);
          view.dom.removeEventListener('compositionend', scheduleUpdate);
          view.dom.removeEventListener('dragend', scheduleSettledUpdate);
          window.removeEventListener('resize', scheduleUpdate);
          scrollParent?.removeEventListener('scroll', scheduleUpdate);
          ownerDoc.removeEventListener('dragend', scheduleSettledUpdate, true);
          view.dom.removeEventListener(ACTIVE_LINE_REFRESH_EVENT, scheduleSettledUpdate);
          view.dom.classList.remove('glimmery-active-line-editor');
          overlay.remove();
          host?.classList.remove(ACTIVE_LINE_HOST_CLASS);
        },
      };
    },
  });
}

export const activeLinePlugin = $prose(() => createActiveLinePlugin());
