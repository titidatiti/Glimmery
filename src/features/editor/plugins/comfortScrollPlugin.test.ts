import { describe, expect, it } from 'vitest';

import {
  computeClampedComfortScrollTop,
  computeComfortScrollDelta,
} from './comfortScrollPlugin';

const GOLDEN_ANCHOR = 0.62;

describe('computeComfortScrollDelta', () => {
  const viewportHeight = 600;
  const viewportTop = 100;

  it('当前行已在锚点以上且可见时不滚动', () => {
    expect(
      computeComfortScrollDelta(
        viewportHeight,
        viewportTop,
        { top: 320, bottom: 356 },
        GOLDEN_ANCHOR,
      ),
    ).toBe(0);
  });

  it('持续输入时当前行低于锚点则向下滚动至目标位置', () => {
    expect(
      computeComfortScrollDelta(
        viewportHeight,
        viewportTop,
        { top: 540, bottom: 576 },
        GOLDEN_ANCHOR,
      ),
    ).toBe(86);
  });

  it('当前行移出视口上方时向上滚动', () => {
    expect(
      computeComfortScrollDelta(
        viewportHeight,
        viewportTop,
        { top: 90, bottom: 126 },
        GOLDEN_ANCHOR,
      ),
    ).toBe(-18);
  });

  it('锚点比例可配置', () => {
    expect(
      computeComfortScrollDelta(
        viewportHeight,
        viewportTop,
        { top: 440, bottom: 476 },
        0.5,
      ),
    ).toBe(58);
    expect(
      computeComfortScrollDelta(
        viewportHeight,
        viewportTop,
        { top: 440, bottom: 476 },
        GOLDEN_ANCHOR,
      ),
    ).toBeLessThan(58);
  });
});

describe('computeClampedComfortScrollTop', () => {
  it('底部留白不足时钳制 scrollTop', () => {
    expect(
      computeClampedComfortScrollTop(
        400,
        450,
        600,
        100,
        { top: 540, bottom: 576 },
        GOLDEN_ANCHOR,
      ),
    ).toBe(450);
  });
});
