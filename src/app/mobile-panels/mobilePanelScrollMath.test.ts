import { describe, expect, it } from 'vitest';
import { isAtPanel, nearestPanelIndex, panelScrollLeft } from './mobilePanelScrollMath';

describe('panelScrollLeft', () => {
  it('面板 0（侧栏）的目标位置是 0', () => {
    expect(panelScrollLeft(0, 390)).toBe(0);
  });

  it('面板 1（编辑区）的目标位置是一个容器宽度', () => {
    expect(panelScrollLeft(1, 390)).toBe(390);
  });
});

describe('nearestPanelIndex', () => {
  it('滚动距离小于半个容器宽度时归到面板 0', () => {
    expect(nearestPanelIndex(0, 390)).toBe(0);
    expect(nearestPanelIndex(180, 390)).toBe(0);
  });

  it('滚动距离超过半个容器宽度时归到面板 1', () => {
    expect(nearestPanelIndex(200, 390)).toBe(1);
    expect(nearestPanelIndex(390, 390)).toBe(1);
  });

  it('容器宽度非法（0 或负数）时安全返回面板 0，不抛异常', () => {
    expect(nearestPanelIndex(100, 0)).toBe(0);
    expect(nearestPanelIndex(100, -10)).toBe(0);
  });
});

describe('isAtPanel', () => {
  it('在容差范围内视为已到达目标面板', () => {
    expect(isAtPanel(389, 1, 390)).toBe(true);
    expect(isAtPanel(389.5, 1, 390)).toBe(true);
    expect(isAtPanel(390, 1, 390)).toBe(true);
  });

  it('未到达时返回 false', () => {
    expect(isAtPanel(200, 1, 390)).toBe(false);
    expect(isAtPanel(50, 0, 390)).toBe(false);
  });
});
