import { describe, expect, it } from 'vitest';

import { MOBILE_LAYOUT_QUERY, PHONE_LANDSCAPE_QUERY } from './useMediaQuery';

describe('MOBILE_LAYOUT_QUERY', () => {
  it('须包含竖屏窄宽与手机横屏矮视口两分支', () => {
    expect(MOBILE_LAYOUT_QUERY).toContain('max-width: 767px');
    expect(MOBILE_LAYOUT_QUERY).toContain(PHONE_LANDSCAPE_QUERY);
  });
});
