import { describe, expect, it } from 'vitest';
import { parseCssColor, pickThemeColorVars } from './themeTransition';

describe('parseCssColor', () => {
  it('parses 6-digit hex', () => {
    expect(parseCssColor('#1e1e1e')).toEqual({ r: 30, g: 30, b: 30, a: 1 });
  });

  it('parses 8-digit hex with alpha', () => {
    expect(parseCssColor('#cc783266')?.a).toBeCloseTo(0.4, 1);
  });

  it('parses rgb()', () => {
    expect(parseCssColor('rgb(255, 128, 0)')).toEqual({ r: 255, g: 128, b: 0, a: 1 });
  });
});

describe('pickThemeColorVars', () => {
  it('keeps only theme color keys', () => {
    const picked = pickThemeColorVars({
      '--color-bg-base': '#111',
      '--spacing-md': '16px',
      '--color-accent': '#fff',
    });
    expect(picked).toEqual({
      '--color-bg-base': '#111',
      '--color-accent': '#fff',
    });
  });
});
