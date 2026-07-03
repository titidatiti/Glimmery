import { describe, expect, it } from 'vitest';

import {
  LAYOUT_TABLET_PORTRAIT_MAX,
  MOBILE_LAYOUT_QUERY,
  MOBILE_PORTRAIT_QUERY,
  PHONE_LANDSCAPE_QUERY,
  SETTINGS_COMPACT_PORTRAIT_QUERY,
  SETTINGS_DESKTOP_QUERY,
  SETTINGS_TABLET_PORTRAIT_QUERY,
} from './useMediaQuery';

describe('MOBILE_LAYOUT_QUERY', () => {
  it('须包含竖屏窄宽与手机横屏矮视口，不含 iPad 竖屏', () => {
    expect(MOBILE_LAYOUT_QUERY).toContain('max-width: 767px');
    expect(MOBILE_LAYOUT_QUERY).toContain(PHONE_LANDSCAPE_QUERY);
    expect(MOBILE_LAYOUT_QUERY).not.toContain(String(LAYOUT_TABLET_PORTRAIT_MAX));
  });
});

describe('MOBILE_PORTRAIT_QUERY', () => {
  it('仅匹配手机竖屏', () => {
    expect(MOBILE_PORTRAIT_QUERY).toContain('max-width: 767px');
    expect(MOBILE_PORTRAIT_QUERY).not.toBe(SETTINGS_COMPACT_PORTRAIT_QUERY);
  });
});

describe('SETTINGS_DESKTOP_QUERY', () => {
  it('横屏 iPad 须命中桌面弹窗分支', () => {
    expect(SETTINGS_DESKTOP_QUERY).toContain('orientation: landscape');
    expect(SETTINGS_DESKTOP_QUERY).not.toContain('not ');
  });
});

describe('SETTINGS_COMPACT_PORTRAIT_QUERY', () => {
  it('覆盖 iPad 竖屏宽度，供设置界面单独使用', () => {
    expect(SETTINGS_COMPACT_PORTRAIT_QUERY).toContain(String(LAYOUT_TABLET_PORTRAIT_MAX));
    expect(SETTINGS_COMPACT_PORTRAIT_QUERY).toContain('orientation: portrait');
  });
});

describe('SETTINGS_TABLET_PORTRAIT_QUERY', () => {
  it('仅匹配 iPad 竖屏，不含横屏', () => {
    expect(SETTINGS_TABLET_PORTRAIT_QUERY).toContain('min-width: 768px');
    expect(SETTINGS_TABLET_PORTRAIT_QUERY).toContain('orientation: portrait');
  });
});
