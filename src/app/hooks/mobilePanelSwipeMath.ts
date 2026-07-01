/** 纯函数：供 useMobilePanelSwipe 与单元测试共用，避免手势阈值被改坏而无测试覆盖 */

export const COMMIT_RATIO = 0.18;
export const COMMIT_FLOOR_PX = 48;
export const COMMIT_CAP_PX = 80;

export function getCommitDistance(viewportWidth: number): number {
  return Math.min(COMMIT_CAP_PX, Math.max(COMMIT_FLOOR_PX, viewportWidth * COMMIT_RATIO));
}

export function clampPanelOffset(value: number, viewportWidth: number): number {
  return Math.max(-viewportWidth, Math.min(0, value));
}
