import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { nearestPanelIndex, panelScrollLeft, isAtPanel } from './mobilePanelScrollMath';

const HISTORY_STATE_KEY = 'glimmeryPanel';
/** 滚动静止判定的防抖时长：这段时间内没有新的 scroll 事件，才认为手势已结束 */
const SETTLE_DEBOUNCE_MS = 80;

function isHistoryEditorState(): boolean {
  return (
    typeof history !== 'undefined' &&
    (history.state as { [HISTORY_STATE_KEY]?: string } | null)?.[HISTORY_STATE_KEY] === 'editor'
  );
}

export interface UseMobilePanelScrollerOptions {
  /** 仅移动端布局下启用；桌面端该 hook 完全不挂载任何监听 */
  enabled: boolean;
  /** 当前应处于的面板序号（0 = 侧栏，1 = 编辑区），由外部 focusMode 状态派生 */
  activeIndex: number;
  /** 用户滑动使面板落点变化时回调（无论是手势触发还是系统返回触发） */
  onActiveIndexChange: (index: number) => void;
}

/**
 * 移动端「侧栏 ↔ 编辑区」的滚动容器 hook。
 *
 * 核心思路：把两个面板放进一个原生横向滚动容器（`scroll-snap-type: x mandatory`），
 * 手势识别、方向锁定、惯性、与系统返回手势的优先级仲裁，全部交给浏览器原生实现。
 * 本 hook 只做三件事：
 *   1. 外部状态（focusMode）变化时，用 `scrollTo` 把容器滚到对应面板；
 *   2. 监听原生 `scroll` 事件，静止后判定当前落点面板，通知外部同步状态；
 *   3. 维持「进入编辑区 = 一条浏览器历史记录」，使 Android/iOS 系统返回手势、
 *      设备返回键、Esc 都能退出编辑区（复用 `popstate`，不重新发明）。
 */
export function useMobilePanelScroller({
  enabled,
  activeIndex,
  onActiveIndexChange,
}: UseMobilePanelScrollerOptions): RefObject<HTMLDivElement> {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(activeIndex);
  const suppressSettleRef = useRef(false);
  const settleTimerRef = useRef<number | undefined>(undefined);
  const onActiveIndexChangeRef = useRef(onActiveIndexChange);
  onActiveIndexChangeRef.current = onActiveIndexChange;

  const scrollToIndex = useCallback((index: number, smooth: boolean) => {
    const el = containerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    if (isAtPanel(el.scrollLeft, index, width)) return;
    suppressSettleRef.current = true;
    el.scrollTo({ left: panelScrollLeft(index, width), behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // 外部状态变化（按钮点击 / 系统返回）时，把滚动容器同步到目标面板
  useEffect(() => {
    if (!enabled) return;
    scrollToIndex(activeIndex, true);
  }, [enabled, activeIndex, scrollToIndex]);

  // 首次挂载与视口尺寸变化：立即对齐（无动画），避免旋转屏幕/键盘弹出时错位
  useEffect(() => {
    if (!enabled) return;
    scrollToIndex(activeIndexRef.current, false);

    const handleResize = () => scrollToIndex(activeIndexRef.current, false);
    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, [enabled, scrollToIndex]);

  // 监听原生滚动，静止后判定落点面板并回调外部
  useEffect(() => {
    const el = containerRef.current;
    if (!enabled || !el) return;

    const clearSuppress = () => {
      suppressSettleRef.current = false;
    };

    const settle = () => {
      if (suppressSettleRef.current) {
        suppressSettleRef.current = false;
        return;
      }
      const width = el.clientWidth || 1;
      const index = nearestPanelIndex(el.scrollLeft, width);
      if (index !== activeIndexRef.current) {
        const wasEditor = activeIndexRef.current === 1;
        activeIndexRef.current = index;
        onActiveIndexChangeRef.current(index);
        if (wasEditor && index === 0 && isHistoryEditorState()) {
          history.back();
        }
      }
    };

    const handleScroll = () => {
      window.clearTimeout(settleTimerRef.current);
      settleTimerRef.current = window.setTimeout(settle, SETTLE_DEBOUNCE_MS);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    el.addEventListener('scrollend', settle, { passive: true });
    el.addEventListener('touchstart', clearSuppress, { passive: true });
    el.addEventListener('wheel', clearSuppress, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      el.removeEventListener('scrollend', settle);
      el.removeEventListener('touchstart', clearSuppress);
      el.removeEventListener('wheel', clearSuppress);
      window.clearTimeout(settleTimerRef.current);
    };
  }, [enabled]);

  // 进入编辑区 = push 一条历史记录，使系统返回手势/按钮/Esc 可退出
  useEffect(() => {
    if (!enabled || activeIndex !== 1) return;
    if (!isHistoryEditorState()) {
      history.pushState({ [HISTORY_STATE_KEY]: 'editor' }, '');
    }
  }, [enabled, activeIndex]);

  useEffect(() => {
    if (!enabled) return;
    const handlePopState = () => {
      if (activeIndexRef.current !== 1) return;
      onActiveIndexChangeRef.current(0);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || activeIndex !== 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (isHistoryEditorState()) {
        history.back();
      } else {
        onActiveIndexChangeRef.current(0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, activeIndex]);

  return containerRef;
}
