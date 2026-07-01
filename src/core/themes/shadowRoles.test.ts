import { describe, expect, it } from 'vitest';
import {
  applyShadowRolesToBase,
  buildMdShadow,
  buildSmShadow,
  resolveShadowCss,
  shadowRolesToShadowTokens,
  tokensToShadowRoles,
} from './shadowRoles';
import type { ThemeShadowTokens, ThemeTokens } from './types';

const neonShadows: ThemeShadowTokens = {
  sm: '0 1px 3px rgba(0,0,0,0.6)',
  md: '0 4px 20px rgba(255,0,170,0.28)',
  glow: '0 0 32px rgba(0,255,238,0.2), 0 0 48px rgba(255,0,170,0.14)',
};

const baseTokens = {
  colors: {
    bgBase: '#111111',
    bgSurface: '#222222',
    bgElevated: '#333333',
    textPrimary: '#eeeeee',
    textSecondary: '#aaaaaa',
    textMuted: '#666666',
    accent: '#ff4080',
    accentMuted: '#cc3366',
    border: '#444444',
    borderSubtle: '#333333',
    focusRing: '#ff408055',
    editorBg: '#111111',
    sidebarBg: '#111111',
  },
  shadows: neonShadows,
} as ThemeTokens;

describe('shadowRoles', () => {
  it('infers shadow color from builtin shadow css', () => {
    const roles = tokensToShadowRoles(baseTokens);
    expect(roles.shadowEnabled).toBe(true);
    expect(roles.customized).toBe(false);
    expect(roles.shadowColor).toBe('#ff00aa');
  });

  it('preserves base shadows when not customized', () => {
    const applied = applyShadowRolesToBase(neonShadows, {
      shadowEnabled: true,
      shadowColor: '#000000',
      customized: false,
    });
    expect(applied.sm).toBe(neonShadows.sm);
    expect(applied.md).toBe(neonShadows.md);
    expect(applied.shadowCustomized).toBe(false);
  });

  it('disables sm/md when toggled off without customization', () => {
    const applied = applyShadowRolesToBase(neonShadows, {
      shadowEnabled: false,
      shadowColor: '#ff00aa',
      customized: false,
    });
    expect(applied.sm).toBe('none');
    expect(applied.md).toBe('none');
  });

  it('builds shadow css when customized', () => {
    const custom = shadowRolesToShadowTokens({
      shadowEnabled: true,
      shadowColor: '#336699',
      customized: true,
    });
    expect(custom.sm).toBe(buildSmShadow('#336699'));
    expect(custom.md).toBe(buildMdShadow('#336699'));
    expect(custom.shadowCustomized).toBe(true);
  });

  it('keeps builtin shadows when no custom color is stored', () => {
    const resolved = resolveShadowCss(neonShadows);
    expect(resolved.sm).toBe(neonShadows.sm);
    expect(resolved.md).toBe(neonShadows.md);
  });

  it('resolves custom shadow settings for saved themes', () => {
    const resolved = resolveShadowCss({
      ...neonShadows,
      shadowColor: '#112233',
      shadowCustomized: true,
      shadowEnabled: true,
    });
    expect(resolved.sm).toBe(buildSmShadow('#112233'));
    expect(resolved.md).toBe(buildMdShadow('#112233'));
  });
});
