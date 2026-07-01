import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EDITOR_TYPOGRAPHY,
  EDITOR_FONT_FAMILY_PRESETS,
  parseEditorTypographyPreferences,
  resolveEditorTypographyCssVars,
  resolveEditorWidth,
  resolveFontSizes,
} from './editorTypography';

describe('EDITOR_FONT_FAMILY_PRESETS', () => {
  it('provides eight distinct presets before custom option', () => {
    expect(EDITOR_FONT_FAMILY_PRESETS).toHaveLength(8);
    expect(new Set(EDITOR_FONT_FAMILY_PRESETS.map((preset) => preset.id)).size).toBe(8);
  });

  it('resolves mono preset stack', () => {
    const vars = resolveEditorTypographyCssVars({
      fontFamilyId: 'mono',
      customFontFamily: '',
      fontSizeScale: 40,
      editorWidthScale: 50,
      lineHeightId: 'comfortable',
    });

    expect(vars['--editor-font-family']).toContain('Consolas');
    expect(vars['--editor-font-family']).toContain('SF Mono');
  });

  it('prioritizes platform CJK fonts for kai and song presets', () => {
    const kai = resolveEditorTypographyCssVars({
      ...DEFAULT_EDITOR_TYPOGRAPHY,
      fontFamilyId: 'kai',
    });
    const song = resolveEditorTypographyCssVars({
      ...DEFAULT_EDITOR_TYPOGRAPHY,
      fontFamilyId: 'song',
    });

    expect(kai['--editor-font-family']).toMatch(/^'LXGW WenKai TC'/);
    expect(song['--editor-font-family']).toMatch(/^'Noto Serif SC'/);
  });
});

describe('resolveEditorTypographyCssVars', () => {
  it('maps preferences to editor CSS variables', () => {
    const vars = resolveEditorTypographyCssVars({
      fontFamilyId: 'serif',
      customFontFamily: '',
      fontSizeScale: 62,
      editorWidthScale: 50,
      lineHeightId: 'relaxed',
    });

    expect(vars['--editor-font-size-body']).toBe('25px');
    expect(vars['--editor-line-height-body']).toBe('1.9');
    expect(vars['--editor-font-family']).toContain('Georgia');
    expect(vars['--shell-max-width']).toBe('880px');
  });

  it('uses custom font stack when selected', () => {
    const vars = resolveEditorTypographyCssVars({
      fontFamilyId: 'custom',
      customFontFamily: 'Comic Sans MS, cursive',
      fontSizeScale: 55,
      editorWidthScale: 100,
      lineHeightId: 'comfortable',
    });

    expect(vars['--editor-font-family']).toBe('Comic Sans MS, cursive');
    expect(vars['--shell-max-width']).toBe('1200px');
  });
});

describe('resolveEditorWidth', () => {
  it('interpolates between min and max', () => {
    expect(resolveEditorWidth(0)).toBe('560px');
    expect(resolveEditorWidth(50)).toBe('880px');
    expect(resolveEditorWidth(100)).toBe('1200px');
  });
});

describe('resolveFontSizes', () => {
  it('interpolates between min and max', () => {
    expect(resolveFontSizes(0)).toEqual({ bodySize: '13px', titleSize: '22px' });
    expect(resolveFontSizes(100)).toEqual({ bodySize: '32px', titleSize: '47px' });
  });
});

describe('parseEditorTypographyPreferences', () => {
  it('falls back to defaults for invalid values', () => {
    expect(parseEditorTypographyPreferences(null)).toEqual(DEFAULT_EDITOR_TYPOGRAPHY);
  });

  it('migrates legacy fontFamilyId system to sans', () => {
    expect(parseEditorTypographyPreferences({ fontFamilyId: 'system' }).fontFamilyId).toBe('sans');
  });

  it('migrates legacy fontSizeId', () => {
    expect(parseEditorTypographyPreferences({ fontSizeId: 'large' }).fontSizeScale).toBe(62);
  });
});
