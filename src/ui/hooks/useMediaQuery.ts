import { useEffect, useState } from 'react';

/** 与 layout.css --layout-mobile-max 对齐 */
export const LAYOUT_MOBILE_MAX = 767;

/** iPad 等平板竖屏上限（与 layout.css --layout-tablet-portrait-max 对齐） */
export const LAYOUT_TABLET_PORTRAIT_MAX = 1024;

/** 手机横屏矮视口高度上限（与 layout.css --layout-phone-landscape-max-height 对齐） */
export const LAYOUT_PHONE_LANDSCAPE_MAX_HEIGHT = 500;

/**
 * 手持端布局断点：手机窄宽、手机横屏矮视口、或平板竖屏（如 iPad Air 820px 宽）。
 * 与 AppShell / SettingsDialog 的 combined @media 及 layout.css 注释对齐。
 */
export const TABLET_PORTRAIT_QUERY =
  `(orientation: portrait) and (max-width: ${LAYOUT_TABLET_PORTRAIT_MAX}px)`;

/** 手机横屏（宽常 >767px，须用视口高度识别） */
export const PHONE_LANDSCAPE_QUERY =
  `(orientation: landscape) and (max-height: ${LAYOUT_PHONE_LANDSCAPE_MAX_HEIGHT}px)`;

export const MOBILE_LAYOUT_QUERY =
  `(max-width: ${LAYOUT_MOBILE_MAX}px), ${PHONE_LANDSCAPE_QUERY}, ${TABLET_PORTRAIT_QUERY}`;

/** 竖屏紧凑布局（手机 + iPad 竖屏；块手柄隐藏、设置全屏等） */
export const MOBILE_PORTRAIT_QUERY = TABLET_PORTRAIT_QUERY;

/** 订阅一个 media query 的匹配状态 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const sync = () => setMatches(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener('change', sync);
    return () => mediaQuery.removeEventListener('change', sync);
  }, [query]);

  return matches;
}

/** 是否处于移动端布局 */
export function useIsMobileLayout(): boolean {
  return useMediaQuery(MOBILE_LAYOUT_QUERY);
}

export function useIsMobilePortraitLayout(): boolean {
  return useMediaQuery(MOBILE_PORTRAIT_QUERY);
}

export function useIsPhoneLandscapeLayout(): boolean {
  return useMediaQuery(PHONE_LANDSCAPE_QUERY);
}
