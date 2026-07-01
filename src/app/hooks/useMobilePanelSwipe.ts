import { useCallback, useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import {
  CLICK_SUPPRESS_MS,
  CLICK_SUPPRESS_PX,
  getCommitDistance,
  isEdgeSwipe,
  resolveDragAxis,
  resolveDragOffset,
  shouldCommitSwipe,
  type TouchZone,
} from './mobilePanelSwipeMath';

const HISTORY_STATE_KEY = 'glimmeryPanel';

function isHistoryEditorState(): boolean {
  return (
    typeof history !== 'undefined' &&
    (history.state as { [HISTORY_STATE_KEY]?: string } | null)?.[HISTORY_STATE_KEY] === 'editor'
  );
}

function getViewportWidth(): number {
  if (typeof window === 'undefined') return 0;
  return window.visualViewport?.width ?? window.innerWidth;
}

interface DragSession {
  startX: number;
  startY: number;
  startOffset: number;
  startTime: number;
  axis: 'pending' | 'horizontal';
  zone: TouchZone;
  edgeSwipe: boolean;
}

export interface UseMobilePanelSwipeOptions {
  enabled: boolean;
  focusMode: boolean;
  onEnterFocus: () => void;
  onExitFocus: () => void;
  trackRef: RefObject<HTMLElement | null>;
  sidebarRef: RefObject<HTMLElement | null>;
  mainRef: RefObject<HTMLElement | null>;
}

export interface MobilePanelSwipeResult {
  offsetPx: number;
  isDragging: boolean;
  trackStyle: CSSProperties;
}

function shouldBlockTouchDrag(
  target: EventTarget | null,
  touch: Touch,
  zone: TouchZone,
  focusMode: boolean,
): boolean {
  if (!(target instanceof Element)) return true;

  if (isEdgeSwipe(zone, focusMode, touch.clientX)) {
    return false;
  }

  return Boolean(target.closest('input, textarea, select, label'));
}

function resolveTouchZone(
  target: EventTarget | null,
  sidebarRef: RefObject<HTMLElement | null>,
  mainRef: RefObject<HTMLElement | null>,
  focusMode: boolean,
): TouchZone | null {
  if (!(target instanceof Node)) return null;
  if (sidebarRef.current?.contains(target)) return 'sidebar';
  if (mainRef.current?.contains(target)) return 'main';
  return focusMode ? 'main' : 'sidebar';
}

export function useMobilePanelSwipe({
  enabled,
  focusMode,
  onEnterFocus,
  onExitFocus,
  trackRef,
  sidebarRef,
  mainRef,
}: UseMobilePanelSwipeOptions): MobilePanelSwipeResult {
  const [offsetPx, setOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const viewportWidthRef = useRef(getViewportWidth());
  const dragRef = useRef<DragSession | null>(null);
  const offsetRef = useRef(0);
  const focusModeRef = useRef(focusMode);
  const isDraggingRef = useRef(false);
  const historyPushedRef = useRef(false);
  const suppressClickRef = useRef(false);
  focusModeRef.current = focusMode;
  offsetRef.current = offsetPx;
  isDraggingRef.current = isDragging;

  const syncSettledOffset = useCallback((nextFocusMode: boolean) => {
    const width = viewportWidthRef.current;
    const next = nextFocusMode ? -width : 0;
    offsetRef.current = next;
    setOffsetPx(next);
  }, []);

  useEffect(() => {
    if (!enabled || isDraggingRef.current) return;
    viewportWidthRef.current = getViewportWidth();
    syncSettledOffset(focusMode);
  }, [enabled, focusMode, syncSettledOffset]);

  useEffect(() => {
    if (!enabled) return;

    const handlePopState = () => {
      historyPushedRef.current = false;
      if (!focusModeRef.current) return;
      offsetRef.current = 0;
      setOffsetPx(0);
      onExitFocus();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [enabled, onExitFocus]);

  useEffect(() => {
    if (!enabled) return;

    if (focusMode) {
      if (!isHistoryEditorState()) {
        history.pushState({ [HISTORY_STATE_KEY]: 'editor' }, '');
        historyPushedRef.current = true;
      }
      return;
    }

    historyPushedRef.current = false;
  }, [enabled, focusMode]);

  useEffect(() => {
    if (!enabled) return;

    const handleResize = () => {
      viewportWidthRef.current = getViewportWidth();
      syncSettledOffset(focusModeRef.current);
    };

    window.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, [enabled, syncSettledOffset]);

  useEffect(() => {
    const track = trackRef.current;
    if (!enabled || !track) return;

    const suppressAccidentalClick = (dragDistance: number) => {
      if (dragDistance < CLICK_SUPPRESS_PX) return;
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, CLICK_SUPPRESS_MS);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      const zone = resolveTouchZone(e.target, sidebarRef, mainRef, focusModeRef.current);
      if (!zone) return;

      if (shouldBlockTouchDrag(e.target, touch, zone, focusModeRef.current)) {
        return;
      }

      const edgeSwipe = isEdgeSwipe(zone, focusModeRef.current, touch.clientX);

      // iOS Safari 会在屏幕左缘识别系统「返回」手势，与此处「编辑区左缘右滑回侧栏」
      // 的边缘手势区域重叠；touchstart 必须非 passive 才能 preventDefault 抢先声明
      // 该触摸由页面接管，避免系统手势吞掉后续 touchmove/touchend。
      if (edgeSwipe && e.cancelable) {
        e.preventDefault();
      }

      dragRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startOffset: offsetRef.current,
        startTime: performance.now(),
        axis: 'pending',
        zone,
        edgeSwipe,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      const session = dragRef.current;
      const touch = e.touches[0];
      if (!session || !touch) return;

      const deltaX = touch.clientX - session.startX;
      const deltaY = touch.clientY - session.startY;

      if (session.axis === 'pending') {
        const axis = resolveDragAxis(deltaX, deltaY, session.edgeSwipe);
        if (axis === 'pending') return;
        if (axis === 'vertical') {
          dragRef.current = null;
          return;
        }
        session.axis = 'horizontal';
        isDraggingRef.current = true;
        setIsDragging(true);
      }

      if (session.axis !== 'horizontal') return;

      e.preventDefault();

      const width = viewportWidthRef.current;
      const clamped = resolveDragOffset(
        session.startOffset,
        deltaX,
        session.zone,
        focusModeRef.current,
        width,
      );
      if (clamped === null) return;

      offsetRef.current = clamped;
      setOffsetPx(clamped);
    };

    const finishDrag = () => {
      const session = dragRef.current;
      dragRef.current = null;

      if (!session || session.axis !== 'horizontal') {
        isDraggingRef.current = false;
        setIsDragging(false);
        return;
      }

      const width = viewportWidthRef.current;
      const commitDistance = getCommitDistance(width);
      const currentOffset = offsetRef.current;
      const dragDistance = Math.abs(currentOffset - session.startOffset);
      const dragDuration = Math.max(performance.now() - session.startTime, 1);
      const dragVelocity = dragDistance / dragDuration;
      const shouldCommit = shouldCommitSwipe(dragDistance, dragVelocity, commitDistance);

      suppressAccidentalClick(dragDistance);

      if (session.zone === 'sidebar' && !focusModeRef.current) {
        if (shouldCommit && currentOffset < session.startOffset) {
          offsetRef.current = -width;
          setOffsetPx(-width);
          onEnterFocus();
        } else {
          offsetRef.current = 0;
          setOffsetPx(0);
        }
        isDraggingRef.current = false;
        setIsDragging(false);
        return;
      }

      if (session.zone === 'main' && focusModeRef.current) {
        if (shouldCommit && currentOffset > session.startOffset) {
          offsetRef.current = 0;
          setOffsetPx(0);
          isDraggingRef.current = false;
          setIsDragging(false);
          if (isHistoryEditorState()) {
            history.back();
          } else {
            onExitFocus();
          }
        } else {
          offsetRef.current = -width;
          setOffsetPx(-width);
          isDraggingRef.current = false;
          setIsDragging(false);
        }
      } else {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };

    const handleTouchEnd = () => finishDrag();
    const handleTouchCancel = () => finishDrag();

    const handleClickCapture = (e: MouseEvent) => {
      if (!suppressClickRef.current) return;
      e.preventDefault();
      e.stopPropagation();
    };

    track.addEventListener('touchstart', handleTouchStart, { passive: false });
    track.addEventListener('touchmove', handleTouchMove, { passive: false });
    track.addEventListener('touchend', handleTouchEnd);
    track.addEventListener('touchcancel', handleTouchCancel);
    track.addEventListener('click', handleClickCapture, true);

    return () => {
      track.removeEventListener('touchstart', handleTouchStart);
      track.removeEventListener('touchmove', handleTouchMove);
      track.removeEventListener('touchend', handleTouchEnd);
      track.removeEventListener('touchcancel', handleTouchCancel);
      track.removeEventListener('click', handleClickCapture, true);
    };
  }, [enabled, onEnterFocus, onExitFocus, trackRef, sidebarRef, mainRef]);

  useEffect(() => {
    if (!enabled || !focusMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (isHistoryEditorState()) {
          history.back();
        } else {
          onExitFocus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, focusMode, onExitFocus]);

  const trackStyle: CSSProperties = {
    transform: `translate3d(${offsetPx}px, 0, 0)`,
    transition: isDragging ? 'none' : 'transform var(--transition-warm-long)',
  };

  return { offsetPx, isDragging, trackStyle };
}
