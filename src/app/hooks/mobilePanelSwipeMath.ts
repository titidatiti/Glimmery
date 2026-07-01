/**
 * 移动端横滑「核心操作」的纯决策逻辑。
 *
 * 这里集中所有阈值常量与判定函数，供 useMobilePanelSwipe 与单元测试共用。
 * 目的：让手势阈值/方向/提交判定被**测试锁定**，任何人误改都会触发测试失败，
 * 从而保证「侧栏 ↔ 编辑区」横滑这一核心操作不被静默破坏。
 *
 * 约束：本文件必须保持纯函数（无 DOM / 无副作用），改动后 `npm test` 必须通过。
 */

/** 提交（切换面板）所需的最小拖拽距离配置 */
export const COMMIT_RATIO = 0.18;
export const COMMIT_FLOOR_PX = 48;
export const COMMIT_CAP_PX = 80;

/** 方向锁定：位移小于该值时方向仍未定（pending） */
export const AXIS_LOCK_PX = 10;
/** 普通拖拽的「横向优先」偏置：|dy| 需大于 |dx|*bias 才判定为纵向 */
export const HORIZONTAL_AXIS_BIAS = 1.15;
/** 编辑区左缘手势的纵向偏置（更宽容横向，便于从边缘拉回侧栏） */
export const EDGE_SWIPE_VERTICAL_BIAS = 1.35;

/** 快速 flick 判定 */
export const FLICK_MIN_PX = 28;
export const FLICK_VELOCITY_PX_MS = 0.55;

/** 编辑区左缘滑动手势区（可越过 input 启动拖拽） */
export const EDGE_SWIPE_ZONE_PX = 28;

/** 拖拽后抑制误触 click 的阈值与时长 */
export const CLICK_SUPPRESS_PX = 8;
export const CLICK_SUPPRESS_MS = 400;

export type DragAxis = 'pending' | 'horizontal' | 'vertical';
export type TouchZone = 'sidebar' | 'main';

export function getCommitDistance(viewportWidth: number): number {
  return Math.min(COMMIT_CAP_PX, Math.max(COMMIT_FLOOR_PX, viewportWidth * COMMIT_RATIO));
}

export function clampPanelOffset(value: number, viewportWidth: number): number {
  return Math.max(-viewportWidth, Math.min(0, value));
}

/** 是否属于「编辑区左缘拉回侧栏」的边缘手势 */
export function isEdgeSwipe(zone: TouchZone, focusMode: boolean, clientX: number): boolean {
  return zone === 'main' && focusMode && clientX <= EDGE_SWIPE_ZONE_PX;
}

/**
 * 依据位移判定手势方向：
 * - 位移过小 → 'pending'（继续观望）
 * - 纵向占优 → 'vertical'（交给页面滚动，放弃横滑）
 * - 否则 → 'horizontal'（进入面板拖拽）
 */
export function resolveDragAxis(deltaX: number, deltaY: number, edgeSwipe: boolean): DragAxis {
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  if (absX < AXIS_LOCK_PX && absY < AXIS_LOCK_PX) return 'pending';
  const verticalThreshold = edgeSwipe
    ? absX * EDGE_SWIPE_VERTICAL_BIAS
    : absX * HORIZONTAL_AXIS_BIAS;
  if (absY > verticalThreshold) return 'vertical';
  return 'horizontal';
}

/** 松手时是否达到「切换面板」的提交条件（距离达标 或 快速 flick） */
export function shouldCommitSwipe(
  dragDistance: number,
  dragVelocity: number,
  commitDistance: number,
): boolean {
  return (
    dragDistance >= commitDistance ||
    (dragDistance >= FLICK_MIN_PX && dragVelocity >= FLICK_VELOCITY_PX_MS)
  );
}

/**
 * 计算拖拽过程中的 track 位移；返回 null 表示该 zone/focus 组合不参与拖拽。
 * - 非沉浸时在侧栏区：只能向左（进入编辑区），nextOffset ≤ 0
 * - 沉浸时在编辑区：只能向右（回到侧栏），nextOffset ≥ -width
 */
export function resolveDragOffset(
  startOffset: number,
  deltaX: number,
  zone: TouchZone,
  focusMode: boolean,
  viewportWidth: number,
): number | null {
  let nextOffset = startOffset + deltaX;
  if (zone === 'sidebar' && !focusMode) {
    nextOffset = Math.min(0, nextOffset);
  } else if (zone === 'main' && focusMode) {
    nextOffset = Math.max(-viewportWidth, nextOffset);
  } else {
    return null;
  }
  return clampPanelOffset(nextOffset, viewportWidth);
}
