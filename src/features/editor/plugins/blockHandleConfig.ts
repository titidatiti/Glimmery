import type { BlockProviderOptions } from '@milkdown/kit/plugin/block';

import { MOBILE_LAYOUT_QUERY } from '@/ui/hooks/useMediaQuery';

import { resolveLineHeightPx } from './lineMetrics';

/** 块手柄相对块左缘的内收距离（移动端） */
export const MOBILE_BLOCK_HANDLE_GUTTER_PX = 44;

type BlockHandleCrepeConfig = {
  blockHandle: Pick<BlockProviderOptions, 'getPosition' | 'getPlacement' | 'getOffset'>;
};

export function isMobileBlockEditLayout(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_LAYOUT_QUERY).matches;
}

export function computeBlockFirstLineMetrics(
  blockRect: Pick<DOMRect, 'top' | 'left' | 'right' | 'width' | 'height'>,
  paddingTop: number,
  paddingBottom: number,
  lineHeightPx: number,
): Omit<DOMRect, 'toJSON'> {
  const contentHeight = Math.max(blockRect.height - paddingTop - paddingBottom, lineHeightPx);
  const height = Math.min(lineHeightPx, contentHeight);
  const lineTop = blockRect.top + paddingTop;

  return {
    x: blockRect.left,
    y: lineTop,
    width: blockRect.width,
    height,
    top: lineTop,
    left: blockRect.left,
    right: blockRect.right,
    bottom: lineTop + height,
  };
}

/** 块手柄锚定在块首行，避免随正文字号/行高变化而偏上或偏下 */
export function getBlockFirstLineRect(el: HTMLElement): Omit<DOMRect, 'toJSON'> {
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  const paddingTop = Number.parseFloat(style.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(style.paddingBottom) || 0;
  const lineHeightPx = resolveLineHeightPx(el, rect.height);

  return computeBlockFirstLineMetrics(rect, paddingTop, paddingBottom, lineHeightPx);
}

/** 移动端将 floating-ui 锚点内收，使 left 放置的手柄落在屏幕内 */
export function insetBlockHandleAnchorRect(
  rect: Omit<DOMRect, 'toJSON'>,
  gutterPx: number,
): Omit<DOMRect, 'toJSON'> {
  const insetLeft = Math.min(gutterPx, Math.max(rect.width - 48, 0));
  const left = rect.left + insetLeft;

  return {
    ...rect,
    left,
    x: left,
    width: Math.max(rect.width - insetLeft, 0),
    right: rect.right,
  };
}

export function getBlockHandleAnchorRect(el: HTMLElement): Omit<DOMRect, 'toJSON'> {
  const rect = getBlockFirstLineRect(el);
  if (!isMobileBlockEditLayout()) return rect;
  return insetBlockHandleAnchorRect(rect, MOBILE_BLOCK_HANDLE_GUTTER_PX);
}

export const blockHandleCrepeConfig: BlockHandleCrepeConfig = {
  blockHandle: {
    getPosition: ({ active }) => getBlockHandleAnchorRect(active.el as HTMLElement),
    getPlacement: () => 'left',
    getOffset: () => (isMobileBlockEditLayout() ? 6 : 0),
  },
};
