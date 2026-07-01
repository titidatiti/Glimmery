import type { ReactNode } from 'react';
import { useMobilePanelScroller } from './useMobilePanelScroller';
import styles from './MobilePanelScroller.module.css';

export interface MobilePanelScrollerProps {
  /** 仅移动端布局下生效；桌面端直接透传两个子节点，不包裹任何容器 */
  enabled: boolean;
  /** 当前应显示的面板序号：0 = 第一个 panel（侧栏），1 = 第二个 panel（编辑区） */
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  /** 固定两个面板：[侧栏内容, 编辑区内容] */
  panels: readonly [ReactNode, ReactNode];
}

/**
 * 移动端「侧栏 ↔ 编辑区」横滑导航容器。
 *
 * 是本应用移动端唯一的导航方式，因此刻意做成独立、自包含的模块：
 * 不感知 documents/theme/settings 等业务状态，只负责「两个面板之间的横向切换」，
 * 避免重蹈覆辙——过去把这套逻辑和 AppShell 的其它样式/状态耦合在一起，
 * 导致任何无关改动都可能静默破坏横滑。
 */
export function MobilePanelScroller({
  enabled,
  activeIndex,
  onActiveIndexChange,
  panels,
}: MobilePanelScrollerProps) {
  const containerRef = useMobilePanelScroller({ enabled, activeIndex, onActiveIndexChange });

  if (!enabled) {
    return <>{panels}</>;
  }

  return (
    <div ref={containerRef} className={styles.scroller}>
      <div className={styles.panel}>{panels[0]}</div>
      <div className={styles.panel}>{panels[1]}</div>
    </div>
  );
}
