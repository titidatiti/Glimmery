import { describe, expect, it } from 'vitest';
import { parseHex6, rgbToHex, mixHex, relativeLuminance } from './colorUtils';

describe('parseHex6', () => {
  it('解析 6 位 hex', () => {
    expect(parseHex6('#1e1e1e')).toEqual({ r: 30, g: 30, b: 30 });
  });

  it('非法输入返回 null', () => {
    expect(parseHex6('#fff')).toBeNull();
    expect(parseHex6('rgb(0,0,0)')).toBeNull();
  });
});

describe('rgbToHex', () => {
  it('clamp 到 [0,255] 并补零', () => {
    expect(rgbToHex(300, -5, 15)).toBe('#ff000f');
  });
});

describe('mixHex', () => {
  it('按比例混色', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
  });

  it('无法解析时返回 base', () => {
    expect(mixHex('not-a-color', '#ffffff', 0.5)).toBe('not-a-color');
  });
});

describe('relativeLuminance', () => {
  it('白高于黑', () => {
    const white = relativeLuminance('#ffffff') ?? 0;
    const black = relativeLuminance('#000000') ?? 0;
    expect(white).toBeGreaterThan(black);
    expect(white).toBeCloseTo(1, 5);
    expect(black).toBeCloseTo(0, 5);
  });

  it('非法输入返回 null', () => {
    expect(relativeLuminance('xyz')).toBeNull();
  });
});
