import type { BlockProviderOptions } from '@milkdown/kit/plugin/block';

import { resolveLineHeightPx } from './lineMetrics';

type BlockHandleCrepeConfig = {
  blockHandle: Pick<BlockProviderOptions, 'getPosition' | 'getPlacement'>;
};

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

export const blockHandleCrepeConfig: BlockHandleCrepeConfig = {
  blockHandle: {
    getPosition: ({ active }) => getBlockFirstLineRect(active.el as HTMLElement),
    getPlacement: () => 'left',
  },
};
