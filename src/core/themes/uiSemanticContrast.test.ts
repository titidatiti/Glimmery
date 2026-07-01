import { describe, expect, it } from 'vitest';

import { BUILTIN_THEMES, daoxiangTheme } from './builtinThemes';
import { contrastRatio, finalizeSelectionPair } from './colorRoles';

describe('builtin theme UI colors', () => {
  it.each(BUILTIN_THEMES.map((theme) => [theme.id, theme] as const))(
    '%s 选区色可用于主按钮且危险色已定义',
    (_id, theme) => {
      const { bg, text } = finalizeSelectionPair(theme.tokens.colors);
      expect(contrastRatio(text, bg)).toBeGreaterThanOrEqual(3.2);
      expect(theme.tokens.colors.danger).toBeDefined();
    },
  );

  it('稻香主题：保存按钮应使用选区底色与选区文字', () => {
    const colors = daoxiangTheme.tokens.colors;
    const { bg, text } = finalizeSelectionPair(colors);
    expect(bg).toBe('#b89878');
    expect(text).toBe('#1a1208');
    expect(contrastRatio(text, bg)).toBeGreaterThanOrEqual(3.2);
  });
});
