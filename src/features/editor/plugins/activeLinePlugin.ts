import { $prose } from '@milkdown/kit/utils';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';

export const ACTIVE_LINE_OVERLAY_CLASS = 'glimmery-active-line-overlay';
export const ACTIVE_LINE_HOST_CLASS = 'glimmery-active-line-host';
/** 较默认 3px 细约 30% */
export const GLIMMERY_CARET_WIDTH_PX = 2;

const activeLinePluginKey = new PluginKey('glimmery-active-line');

export interface LineCoords {
  top: number;
  bottom: number;
}

export interface BlockRect {
  top: number;
}

/** 高亮上下边沿落在相邻两行文字的正中间（总高度 = 一行 line-height） */
export function computeOverlayMetrics(
  coords: LineCoords,
  blockRect: BlockRect,
  lineHeightPx: number,
) {
  const center = (coords.top + coords.bottom) / 2;
  const halfSpan = lineHeightPx / 2;

  return {
    top: center - halfSpan - blockRect.top,
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

export function resolveLineHeightPx(element: HTMLElement, fallbackLineHeight: number): number {
  const computed = getComputedStyle(element);
  const raw = computed.lineHeight;

  if (raw === 'normal') {
    const fontSize = parseFloat(computed.fontSize);
    return Number.isFinite(fontSize) ? fontSize * 1.2 : fallbackLineHeight;
  }

  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return fallbackLineHeight;

  if (raw.endsWith('em') || raw.endsWith('rem')) {
    const fontSize = parseFloat(computed.fontSize);
    return Number.isFinite(fontSize) ? value * fontSize : fallbackLineHeight;
  }

  return value;
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

export function measureCaretLineMetrics(view: EditorView): { top: number; height: number } | null {
  if (!view.hasFocus()) return null;

  const { head } = view.state.selection;
  try {
    const coords = view.coordsAtPos(head);
    const blockRect = view.dom.getBoundingClientRect();
    const lineRectHeight = Math.max(coords.bottom - coords.top, 1);
    const lineHeightPx = resolveLineHeightPx(view.dom, lineRectHeight);
    return computeOverlayMetrics(coords, blockRect, lineHeightPx);
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
        if (!view.hasFocus()) {
          hide();
          return;
        }

        const metrics = measureCaretLineMetrics(view);
        if (!metrics) {
          hide();
          return;
        }

        try {
          const blockRect = view.dom.getBoundingClientRect();
          const { top, height } = metrics;

          const panelWidth = scrollParent?.clientWidth ?? blockRect.width;
          const textWidth = blockRect.width;
          const overlayWidth = computeOverlayWidth(textWidth, panelWidth);

          overlay.style.display = 'block';
          overlay.style.top = `${top}px`;
          overlay.style.height = `${height}px`;
          overlay.style.width = `${overlayWidth}px`;
          overlay.style.background = computeOverlayGradient(textWidth, overlayWidth);
          syncVirtualCaret(view, { top, height });
        } catch {
          hide();
        }
      };

      /** virtual-cursor 会在 selectionchange 时把高度重置为字形高，需在其后再同步整行高 */
      const syncCaretAfterVirtualCursor = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const metrics = measureCaretLineMetrics(view);
            if (metrics) syncVirtualCaret(view, metrics);
          });
        });
      };

      const scheduleUpdate = () => {
        requestAnimationFrame(() => requestAnimationFrame(update));
      };

      update();

      const ownerDoc = view.dom.ownerDocument;
      ownerDoc.addEventListener('selectionchange', syncCaretAfterVirtualCursor);
      view.dom.addEventListener('focusin', scheduleUpdate);
      view.dom.addEventListener('focusout', scheduleUpdate);
      window.addEventListener('resize', scheduleUpdate);
      scrollParent?.addEventListener('scroll', scheduleUpdate, { passive: true });

      return {
        update(nextView, prevState) {
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
          window.removeEventListener('resize', scheduleUpdate);
          scrollParent?.removeEventListener('scroll', scheduleUpdate);
          view.dom.classList.remove('glimmery-active-line-editor');
          overlay.remove();
          host?.classList.remove(ACTIVE_LINE_HOST_CLASS);
        },
      };
    },
  });
}

export const activeLinePlugin = $prose(() => createActiveLinePlugin());
