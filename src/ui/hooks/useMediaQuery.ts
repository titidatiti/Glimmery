import { useEffect, useState } from 'react';

/**
 * 手持端布局断点：竖屏窄宽，或手机横屏矮视口（宽常 >767px，须用高度识别）。
 * 与 AppShell / SettingsDialog 的 combined @media 及 layout.css 变量对齐。
 */
export const MOBILE_LAYOUT_QUERY =
  '(max-width: 767px), (orientation: landscape) and (max-height: 500px)';

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

/** 手机竖屏（设置等 mobile-first 交互仅在此模式启用） */
export const MOBILE_PORTRAIT_QUERY = '(max-width: 767px) and (orientation: portrait)';

export function useIsMobilePortraitLayout(): boolean {
  return useMediaQuery(MOBILE_PORTRAIT_QUERY);
}

/** 手机横屏（宽常 >767px，须用视口高度识别） */
export const PHONE_LANDSCAPE_QUERY = '(orientation: landscape) and (max-height: 500px)';

export function useIsPhoneLandscapeLayout(): boolean {
  return useMediaQuery(PHONE_LANDSCAPE_QUERY);
}
