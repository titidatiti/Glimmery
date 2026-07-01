import { describe, expect, it } from 'vitest';
import {
  COMMIT_FLOOR_PX,
  clampPanelOffset,
  getCommitDistance,
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
