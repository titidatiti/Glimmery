import { describe, expect, it } from 'vitest';

import {
  LAYOUT_TABLET_PORTRAIT_MAX,
  MOBILE_LAYOUT_QUERY,
  MOBILE_PORTRAIT_QUERY,
  PHONE_LANDSCAPE_QUERY,
  TABLET_PORTRAIT_QUERY,
} from './useMediaQuery';

describe('MOBILE_LAYOUT_QUERY', () => {
  it('须包含竖屏窄宽、手机横屏矮视口与平板竖屏三分支', () => {
    expect(MOBILE_LAYOUT_QUERY).toContain('max-width: 767px');
    expect(MOBILE_LAYOUT_QUERY).toContain(PHONE_LANDSCAPE_QUERY);
    expect(MOBILE_LAYOUT_QUERY).toContain(TABLET_PORTRAIT_QUERY);
  });
});

describe('MOBILE_PORTRAIT_QUERY', () => {
  it('覆盖 iPad 竖屏宽度', () => {
    expect(MOBILE_PORTRAIT_QUERY).toBe(TABLET_PORTRAIT_QUERY);
    expect(MOBILE_PORTRAIT_QUERY).toContain(String(LAYOUT_TABLET_PORTRAIT_MAX));
  });
});
