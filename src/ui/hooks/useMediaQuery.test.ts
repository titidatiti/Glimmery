import { describe, expect, it } from 'vitest';

import {
  LAYOUT_TABLET_PORTRAIT_MAX,
  MOBILE_LAYOUT_QUERY,
  MOBILE_PORTRAIT_QUERY,
  PHONE_LANDSCAPE_QUERY,
  SETTINGS_COMPACT_PORTRAIT_QUERY,
} from './useMediaQuery';

describe('MOBILE_LAYOUT_QUERY', () => {
  it('须包含竖屏窄宽与手机横屏矮视口，不含 iPad 竖屏', () => {
    expect(MOBILE_LAYOUT_QUERY).toContain('max-width: 767px');
    expect(MOBILE_LAYOUT_QUERY).toContain(PHONE_LANDSCAPE_QUERY);
    expect(MOBILE_LAYOUT_QUERY).not.toContain(String(LAYOUT_TABLET_PORTRAIT_MAX));
  });
});

describe('SETTINGS_COMPACT_PORTRAIT_QUERY', () => {
  it('覆盖 iPad 竖屏宽度，供设置界面单独使用', () => {
    expect(SETTINGS_COMPACT_PORTRAIT_QUERY).toContain(String(LAYOUT_TABLET_PORTRAIT_MAX));
    expect(SETTINGS_COMPACT_PORTRAIT_QUERY).toContain('orientation: portrait');
  });
});

describe('MOBILE_PORTRAIT_QUERY', () => {
  it('仅匹配手机竖屏', () => {
    expect(MOBILE_PORTRAIT_QUERY).toContain('max-width: 767px');
    expect(MOBILE_PORTRAIT_QUERY).not.toBe(SETTINGS_COMPACT_PORTRAIT_QUERY);
  });
});
