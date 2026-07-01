import { useEffect, useState } from 'react';

/** 移动端布局断点，与 layout.css 的 --layout-mobile-max 对齐 */
export const MOBILE_LAYOUT_QUERY = '(max-width: 767px)';

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
