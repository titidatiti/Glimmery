import { describe, expect, it } from 'vitest';

import { BUILTIN_THEMES } from './builtinThemes';
import { contrastRatio, finalizeSelectionPair } from './colorRoles';

describe('builtin theme selection contrast', () => {
  it.each(BUILTIN_THEMES.map((theme) => [theme.id, theme] as const))(
    '%s 选区文字与背景对比度可读',
    (_id, theme) => {
      const { bg, text } = finalizeSelectionPair(theme.tokens.colors);
      const ratio = contrastRatio(text, bg);

      expect(ratio).not.toBeNull();
      expect(ratio!).toBeGreaterThanOrEqual(3.2);
    },
  );

  it('雅黑与暗黑等深底主题：浅选区配深灰字', () => {
    for (const id of ['night', 'abyss']) {
      const theme = BUILTIN_THEMES.find((t) => t.id === id)!;
      const { bg, text } = finalizeSelectionPair(theme.tokens.colors);
      expect(contrastRatio(text, bg)).toBeGreaterThanOrEqual(3.2);
      expect(text.toLowerCase()).not.toBe('#cccccc');
      expect(text.toLowerCase()).not.toBe('#f5f5f5');
    }
  });
});
