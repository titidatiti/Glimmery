import { describe, expect, it } from 'vitest';

import { BUILTIN_THEMES, daoxiangTheme } from './builtinThemes';
import { contrastRatio } from './colorRoles';

describe('builtin theme UI colors', () => {
  it.each(BUILTIN_THEMES.map((theme) => [theme.id, theme] as const))(
    '%s 定义按钮文字与危险操作色',
    (_id, theme) => {
      const { buttonOnAccent, danger } = theme.tokens.colors;
      expect(buttonOnAccent).toBeDefined();
      expect(danger).toBeDefined();
    },
  );

  it('稻香主题：保存与删除按钮使用显式配色角色', () => {
    const colors = daoxiangTheme.tokens.colors;
    expect(colors.buttonOnAccent).toBe('#2a2218');
    expect(colors.danger).toBe('#5c0000');
    expect(colors.buttonOnAccent).not.toBe(colors.bgBase);
    expect(contrastRatio(colors.buttonOnAccent!, colors.accent)).toBeGreaterThan(2.5);
    expect(contrastRatio(colors.danger!, colors.bgSurface)).toBeGreaterThan(3.2);
  });
});
