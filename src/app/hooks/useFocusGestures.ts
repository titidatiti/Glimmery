import { useEffect, useRef, type RefObject } from 'react';

const EDGE_THRESHOLD_PX = 28;
const SWIPE_THRESHOLD_PX = 64;
const MOBILE_MAX_WIDTH_QUERY = '(max-width: 767px)';

interface UseFocusGesturesOptions {
  enabled: boolean;
  focusMode: boolean;
  onExitFocus: () => void;
  mainRef: RefObject<HTMLElement | null>;
}

/** 桌面端：左缘右滑退出沉浸模式 */
export function useFocusGestures({ enabled, focusMode, onExitFocus, mainRef }: UseFocusGesturesOptions): void {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isMobileRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MAX_WIDTH_QUERY);
    const syncMobile = () => {
      isMobileRef.current = mediaQuery.matches;
    };
    syncMobile();
    mediaQuery.addEventListener('change', syncMobile);
    return () => mediaQuery.removeEventListener('change', syncMobile);
  }, []);

  useEffect(() => {
    if (!enabled || !focusMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onExitFocus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, focusMode, onExitFocus]);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (isMobileRef.current || !focusMode) return;
      const touch = e.touches[0];
      if (!touch || touch.clientX > EDGE_THRESHOLD_PX) return;
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isMobileRef.current || !focusMode) return;
      const start = touchStartRef.current;
      const touch = e.touches[0];
      if (!start || !touch) return;

      const deltaX = touch.clientX - start.x;
      const deltaY = Math.abs(touch.clientY - start.y);
      if (deltaY >= 48) return;

      if (deltaX > SWIPE_THRESHOLD_PX) {
        touchStartRef.current = null;
        onExitFocus();
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, focusMode, onExitFocus, mainRef]);
}
