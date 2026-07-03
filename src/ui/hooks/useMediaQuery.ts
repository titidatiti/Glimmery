import { useEffect, useState } from 'react';

/** 与 layout.css --layout-mobile-max 对齐 */
export const LAYOUT_MOBILE_MAX = 767;

/** iPad 竖屏等：仅设置界面采用手机排版的上限（与 layout.css --layout-tablet-portrait-max 对齐） */
export const LAYOUT_TABLET_PORTRAIT_MAX = 1024;

/** 手机横屏矮视口高度上限（与 layout.css --layout-phone-landscape-max-height 对齐） */
export const LAYOUT_PHONE_LANDSCAPE_MAX_HEIGHT = 500;

/** 手机竖屏 */
export const MOBILE_PORTRAIT_QUERY =
  `(max-width: ${LAYOUT_MOBILE_MAX}px) and (orientation: portrait)`;

/** iPad 竖屏（768–1024px 宽），不含手机 */
export const SETTINGS_TABLET_PORTRAIT_QUERY =
  `(orientation: portrait) and (min-width: ${LAYOUT_MOBILE_MAX + 1}px) and (max-width: ${LAYOUT_TABLET_PORTRAIT_MAX}px)`;

/**
 * 设置界面紧凑竖屏：手机竖屏 + iPad 竖屏。
 * 不含任何横屏（iPad 横屏仍走桌面弹窗布局）。
 */
export const SETTINGS_COMPACT_PORTRAIT_QUERY =
  `(orientation: portrait) and (max-width: ${LAYOUT_TABLET_PORTRAIT_MAX}px)`;

/**
 * 设置界面桌面/平板弹窗：横屏平板（含 iPad 横屏）或宽屏竖屏。
 * 与 SettingsDialog.module.css 中桌面 @media 对齐。
 */
export const SETTINGS_DESKTOP_QUERY =
  `(min-width: ${LAYOUT_MOBILE_MAX + 1}px) and (min-height: 501px) and (orientation: landscape), (min-width: ${LAYOUT_TABLET_PORTRAIT_MAX + 1}px) and (min-height: 501px)`;

/** 手机横屏（宽常 >767px，须用视口高度识别） */
export const PHONE_LANDSCAPE_QUERY =
  `(orientation: landscape) and (max-height: ${LAYOUT_PHONE_LANDSCAPE_MAX_HEIGHT}px)`;

/**
 * 主界面手持端布局：手机窄宽，或手机横屏矮视口（不含 iPad 竖屏）。
 * 与 AppShell / SettingsDialog 以外的 combined @media 对齐。
 */
export const MOBILE_LAYOUT_QUERY =
  `(max-width: ${LAYOUT_MOBILE_MAX}px), ${PHONE_LANDSCAPE_QUERY}`;

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

/** 是否处于主界面移动端布局（侧栏横滑等） */
export function useIsMobileLayout(): boolean {
  return useMediaQuery(MOBILE_LAYOUT_QUERY);
}

/** 手机竖屏（块手柄隐藏、编辑区 placeholder 等） */
export function useIsMobilePortraitLayout(): boolean {
  return useMediaQuery(MOBILE_PORTRAIT_QUERY);
}

/** 设置界面是否采用手机竖屏排版（含 iPad 竖屏） */
export function useIsSettingsCompactPortrait(): boolean {
  return useMediaQuery(SETTINGS_COMPACT_PORTRAIT_QUERY);
}

export function useIsPhoneLandscapeLayout(): boolean {
  return useMediaQuery(PHONE_LANDSCAPE_QUERY);
}
