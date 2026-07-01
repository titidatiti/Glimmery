import { describe, expect, it } from 'vitest';

import { daoxiangTheme } from './builtinThemes';
import { BUILTIN_THEMES } from './builtinThemes';
import { contrastRatio, deriveDangerColor, deriveOnAccentText } from './colorRoles';

describe('UI semantic color contrast', () => {
  it.each(BUILTIN_THEMES.map((theme) => [theme.id, theme] as const))(
    '%s 主按钮与危险按钮文字可读',
    (_id, theme) => {
      const colors = theme.tokens.colors;
      const onAccent = deriveOnAccentText(colors);
      const danger = deriveDangerColor(colors);

      expect(contrastRatio(onAccent, colors.accent)).toBeGreaterThanOrEqual(2.5);
      expect(contrastRatio(danger, colors.bgSurface)).toBeGreaterThanOrEqual(3.2);
    },
  );

  it('稻香主题：保存按钮不用 bgBase 作字色', () => {
    const colors = daoxiangTheme.tokens.colors;
    const onAccent = deriveOnAccentText(colors);

    expect(onAccent.toLowerCase()).not.toBe(colors.bgBase.toLowerCase());
    expect(contrastRatio(onAccent, colors.accent)).toBeGreaterThanOrEqual(2.5);
  });

  it('稻香主题：删除按钮在面板底色上可读', () => {
    const colors = daoxiangTheme.tokens.colors;
    const danger = deriveDangerColor(colors);

    expect(contrastRatio(danger, colors.bgSurface)).toBeGreaterThanOrEqual(3.2);
    expect(danger.toLowerCase()).not.toBe('#e85d5d');
  });
});
