import { describe, expect, it, vi } from 'vitest';

vi.stubGlobal(
  'getComputedStyle',
  () =>
    ({
      paddingTop: '0px',
    }) as CSSStyleDeclaration,
);

import {
  ACTIVE_LINE_OVERLAY_CLASS,
  computeOverlayGradient,
  computeOverlayMetrics,
  computeOverlayWidth,
  computeSnappedLineMetrics,
} from './activeLinePlugin';

describe('computeOverlayMetrics', () => {
  it('上下边沿落在相邻两行文字的正中间', () => {
    const metrics = computeOverlayMetrics(
      { top: 120, bottom: 148 },
      { top: 100 },
      28,
    );

    // 行中心 134，半行高 14 → 相对 block top=100 为 20
    expect(metrics.top).toBe(20);
    expect(metrics.height).toBe(28);
  });

  it('总高度等于一行 line-height', () => {
    const metrics = computeOverlayMetrics(
      { top: 50, bottom: 70 },
      { top: 40 },
      24,
    );

    expect(metrics.height).toBe(24);
    expect(metrics.top).toBe(8);
  });
});

describe('computeSnappedLineMetrics', () => {
  it('对齐到块内行网格，overlay 与 caret 分别相对 host/editor 定位', () => {
    const blockEl = {
      getBoundingClientRect: () => ({
        top: 200,
        left: 0,
        right: 400,
        bottom: 300,
        width: 400,
        height: 100,
        x: 0,
        y: 200,
        toJSON: () => ({}),
      }),
    } as HTMLElement;

    const metrics = computeSnappedLineMetrics(
      { top: 248, bottom: 270 },
      blockEl,
      190,
      200,
      36,
    );

    expect(metrics.height).toBe(36);
    expect(metrics.overlayTop).toBe(46);
    expect(metrics.caretTop).toBe(36);
  });
});

describe('computeOverlayWidth', () => {
  it('取正文列与面板宽度的中间值', () => {
    expect(computeOverlayWidth(800, 1200)).toBe(1000);
  });

  it('面板不比正文宽时退回正文宽度', () => {
    expect(computeOverlayWidth(800, 700)).toBe(800);
  });
});

describe('computeOverlayGradient', () => {
  it('重叠区纯色，外侧渐变', () => {
    const gradient = computeOverlayGradient(800, 1000);

    expect(gradient).toContain('linear-gradient(90deg');
    expect(gradient).toContain('10%');
    expect(gradient).toContain('90%');
  });

  it('宽度与正文相同时为纯色', () => {
    expect(computeOverlayGradient(800, 800)).toBe('var(--color-active-line-bg)');
  });
});

describe('ACTIVE_LINE_OVERLAY_CLASS', () => {
  it('导出 overlay class 名供样式使用', () => {
    expect(ACTIVE_LINE_OVERLAY_CLASS).toBe('glimmery-active-line-overlay');
  });
});
