import { describe, expect, it } from 'vitest';
import {
  COMMIT_FLOOR_PX,
  EDGE_SWIPE_ZONE_PX,
  FLICK_MIN_PX,
  FLICK_VELOCITY_PX_MS,
  clampPanelOffset,
  getCommitDistance,
  isEdgeSwipe,
  resolveDragAxis,
  resolveDragOffset,
  shouldCommitSwipe,
} from './mobilePanelSwipeMath';

describe('mobilePanelSwipeMath', () => {
  it('clamps offset to one viewport width', () => {
    expect(clampPanelOffset(0, 390)).toBe(0);
    expect(clampPanelOffset(-200, 390)).toBe(-200);
    expect(clampPanelOffset(-500, 390)).toBe(-390);
    expect(clampPanelOffset(40, 390)).toBe(0);
  });

  it('interpolates commit distance between floor and cap', () => {
    expect(getCommitDistance(320)).toBeCloseTo(57.6);
    expect(getCommitDistance(200)).toBe(COMMIT_FLOOR_PX);
    expect(getCommitDistance(500)).toBe(80);
  });
});

describe('isEdgeSwipe', () => {
  it('仅在沉浸 + 编辑区 + 左缘内成立', () => {
    expect(isEdgeSwipe('main', true, 10)).toBe(true);
    expect(isEdgeSwipe('main', true, EDGE_SWIPE_ZONE_PX)).toBe(true);
    expect(isEdgeSwipe('main', true, EDGE_SWIPE_ZONE_PX + 1)).toBe(false);
    expect(isEdgeSwipe('main', false, 10)).toBe(false);
    expect(isEdgeSwipe('sidebar', true, 10)).toBe(false);
  });
});

describe('resolveDragAxis', () => {
  it('位移过小时保持 pending', () => {
    expect(resolveDragAxis(3, 3, false)).toBe('pending');
    expect(resolveDragAxis(9, 9, false)).toBe('pending');
  });

  it('纵向占优判定为 vertical（交给页面滚动）', () => {
    expect(resolveDragAxis(10, 30, false)).toBe('vertical');
  });

  it('横向占优判定为 horizontal（进入面板拖拽）', () => {
    expect(resolveDragAxis(30, 10, false)).toBe('horizontal');
  });

  it('边缘手势对纵向更宽容，仍判为 horizontal', () => {
    // |dy|=13 > |dx|*1.15=11.5 → 普通判 vertical；但边缘 bias 1.35 → 13 < 13.5 → horizontal
    expect(resolveDragAxis(10, 13, false)).toBe('vertical');
    expect(resolveDragAxis(10, 13, true)).toBe('horizontal');
  });
});

describe('shouldCommitSwipe', () => {
  it('距离达标即提交', () => {
    expect(shouldCommitSwipe(60, 0, 57.6)).toBe(true);
    expect(shouldCommitSwipe(50, 0, 57.6)).toBe(false);
  });

  it('快速 flick（距离达最小值且速度达标）也提交', () => {
    expect(shouldCommitSwipe(FLICK_MIN_PX, FLICK_VELOCITY_PX_MS, 999)).toBe(true);
    expect(shouldCommitSwipe(FLICK_MIN_PX - 1, 1, 999)).toBe(false);
    expect(shouldCommitSwipe(FLICK_MIN_PX, FLICK_VELOCITY_PX_MS - 0.01, 999)).toBe(false);
  });
});

describe('resolveDragOffset', () => {
  it('非沉浸的侧栏区只能向左（≤0）', () => {
    expect(resolveDragOffset(0, -50, 'sidebar', false, 390)).toBe(-50);
    expect(resolveDragOffset(0, 50, 'sidebar', false, 390)).toBe(0);
  });

  it('沉浸的编辑区只能向右（≥ -width）', () => {
    expect(resolveDragOffset(-390, 40, 'main', true, 390)).toBe(-350);
    expect(resolveDragOffset(-390, -40, 'main', true, 390)).toBe(-390);
  });

  it('无效的 zone/focus 组合返回 null（不参与拖拽）', () => {
    expect(resolveDragOffset(0, -50, 'main', false, 390)).toBeNull();
    expect(resolveDragOffset(-390, 50, 'sidebar', true, 390)).toBeNull();
  });
});
