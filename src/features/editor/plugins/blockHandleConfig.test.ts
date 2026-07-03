import { describe, expect, it } from 'vitest';

import { computeBlockFirstLineMetrics, insetBlockHandleAnchorRect } from './blockHandleConfig';

describe('computeBlockFirstLineMetrics', () => {
  it('锚定在首行 line-height 区域', () => {
    const rect = computeBlockFirstLineMetrics(
      { top: 100, left: 40, right: 640, width: 600, height: 71 },
      0,
      0,
      36.75,
    );

    expect(rect.top).toBe(100);
    expect(rect.height).toBeCloseTo(36.75, 2);
    expect(rect.bottom).toBeCloseTo(136.75, 2);
  });

  it('多行段落仍只取首行高度', () => {
    const rect = computeBlockFirstLineMetrics(
      { top: 80, left: 0, right: 400, width: 400, height: 120 },
      0,
      0,
      28,
    );

    expect(rect.height).toBe(28);
    expect(rect.bottom).toBe(108);
  });
});

describe('insetBlockHandleAnchorRect', () => {
  it('将锚点左缘内收，供移动端块手柄落在屏幕内', () => {
    const rect = insetBlockHandleAnchorRect(
      { top: 100, left: 16, right: 400, width: 384, height: 28, x: 16, y: 100, bottom: 128 },
      44,
    );

    expect(rect.left).toBe(60);
    expect(rect.width).toBe(340);
  });
});
