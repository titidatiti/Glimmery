import { $prose } from '@milkdown/kit/utils';
import { Plugin } from '@milkdown/kit/prose/state';
import type { EditorView } from '@milkdown/kit/prose/view';

import {
  EDITOR_COMFORT_SCROLL_ANCHOR_DEFAULT,
  resolveComfortScrollAnchorRatio,
} from '@/core/settings/editorTypography';
import { measureCaretLineMetrics } from './activeLinePlugin';

export interface CaretRect {
  top: number;
  bottom: number;
}

const COMFORT_SCROLL_EDGE_MARGIN_PX = 8;
const COMFORT_SCROLL_ANCHOR_CSS_VAR = '--editor-comfort-scroll-anchor-percent';

/**
 * 计算 scrollTop 增量，使当前行中心对齐滚动容器视口内的目标锚点。
 *
 * anchorRatio：距视口顶部的比例（默认 0.62）。
 */
export function computeComfortScrollDelta(
  scrollParentHeight: number,
  scrollParentTop: number,
  lineRect: CaretRect,
  anchorRatio: number,
): number {
  const lineCenterY = (lineRect.top + lineRect.bottom) / 2;
  const lineRelativeY = lineCenterY - scrollParentTop;
  const viewportAnchorY = scrollParentHeight * anchorRatio;

  if (lineRelativeY > viewportAnchorY) {
    return lineRelativeY - viewportAnchorY;
  }

  if (lineRect.top < scrollParentTop + COMFORT_SCROLL_EDGE_MARGIN_PX) {
    return lineRect.top - scrollParentTop - COMFORT_SCROLL_EDGE_MARGIN_PX;
  }

  const scrollParentBottom = scrollParentTop + scrollParentHeight;
  if (lineRect.bottom > scrollParentBottom - COMFORT_SCROLL_EDGE_MARGIN_PX) {
    return lineRect.bottom - scrollParentBottom + COMFORT_SCROLL_EDGE_MARGIN_PX;
  }

  return 0;
}

export function computeClampedComfortScrollTop(
  scrollTop: number,
  maxScrollTop: number,
  scrollParentHeight: number,
  scrollParentTop: number,
  lineRect: CaretRect,
  anchorRatio: number,
): number {
  const delta = computeComfortScrollDelta(
    scrollParentHeight,
    scrollParentTop,
    lineRect,
    anchorRatio,
  );
  return Math.max(0, Math.min(maxScrollTop, scrollTop + delta));
}

export function readComfortScrollAnchorRatio(root: HTMLElement = document.documentElement): number {
  if (typeof document === 'undefined') {
    return resolveComfortScrollAnchorRatio(EDITOR_COMFORT_SCROLL_ANCHOR_DEFAULT);
  }

  const raw = getComputedStyle(root).getPropertyValue(COMFORT_SCROLL_ANCHOR_CSS_VAR).trim();
  const percent = Number.parseFloat(raw);
  if (Number.isFinite(percent)) {
    return resolveComfortScrollAnchorRatio(percent);
  }

  return resolveComfortScrollAnchorRatio(EDITOR_COMFORT_SCROLL_ANCHOR_DEFAULT);
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

function measureActiveLineViewportRect(view: EditorView): CaretRect | null {
  const metrics = measureCaretLineMetrics(view);
  if (!metrics) return null;

  const editorTop = view.dom.getBoundingClientRect().top;
  const lineTop = editorTop + metrics.caretTop;
  return {
    top: lineTop,
    bottom: lineTop + metrics.height,
  };
}

function scrollCaretIntoComfortZone(view: EditorView): boolean {
  const scrollParent = findScrollParent(view.dom);
  if (!scrollParent) return false;

  const lineRect = measureActiveLineViewportRect(view);
  if (!lineRect) return false;

  const anchorRatio = readComfortScrollAnchorRatio();
  const scrollParentRect = scrollParent.getBoundingClientRect();
  const maxScrollTop = scrollParent.scrollHeight - scrollParent.clientHeight;
  const targetScrollTop = computeClampedComfortScrollTop(
    scrollParent.scrollTop,
    maxScrollTop,
    scrollParent.clientHeight,
    scrollParentRect.top,
    lineRect,
    anchorRatio,
  );

  if (targetScrollTop !== scrollParent.scrollTop) {
    scrollParent.scrollTop = targetScrollTop;
  }

  return true;
}

function createComfortScrollPlugin() {
  return new Plugin({
    props: {
      handleScrollToSelection(view) {
        return scrollCaretIntoComfortZone(view);
      },
    },
  });
}

export const comfortScrollPlugin = $prose(() => createComfortScrollPlugin());
