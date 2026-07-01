/**
 * 移动端「侧栏 ↔ 编辑区」面板滚动的纯计算逻辑。
 *
 * 设计取舍：不再手写 touchstart/touchmove 位移追踪、方向锁定、提交阈值、
 * flick 速度判定等手势数学——那一整套逻辑本质上是在用户态重新实现浏览器
 * 早已内置、且被系统深度优化过的横向滚动手势，代价是要不断和系统手势
 * （如 iOS Safari 左缘返回）打架，且容易被无关 CSS 改动静默破坏。
 *
 * 改为让浏览器原生的 `scroll-snap` 横向滚动容器承担手势识别，本文件只负责
 * 两个纯函数：给定容器宽度与面板序号互相换算。
 */

/** 面板序号（0 = 侧栏，1 = 编辑区）对应的目标 scrollLeft */
export function panelScrollLeft(index: number, panelWidth: number): number {
  return index * panelWidth;
}

/** 由当前 scrollLeft 反推「最接近」的面板序号（用于滚动静止后判定落点） */
export function nearestPanelIndex(scrollLeft: number, panelWidth: number): number {
  if (panelWidth <= 0) return 0;
  return Math.round(scrollLeft / panelWidth);
}

/** 判断 scrollLeft 是否已（在容差内）落在目标面板序号的位置 */
export function isAtPanel(scrollLeft: number, index: number, panelWidth: number, tolerancePx = 1): boolean {
  return Math.abs(scrollLeft - panelScrollLeft(index, panelWidth)) <= tolerancePx;
}
