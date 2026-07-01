import { describe, expect, it } from 'vitest';
import { colorRolesToTokens, mergeColorRolesWithBase, tokensToColorRoles } from './colorRoles';

describe('colorRoles', () => {
  it('round-trips between roles and tokens', () => {
    const roles = {
      sidebarBg: '#111111',
      editorBg: '#222222',
      chromeBg: '#333333',
      elevatedBg: '#444444',
      activeLineBg: '#2a2a30',
      headingText: '#eeeeee',
      bodyText: '#dddddd',
      auxiliaryText: '#aaaaaa',
      placeholderText: '#666666',
      accent: '#ff0000',
      accentSoft: '#ffcccc',
      caretColor: '#00ff00',
      border: '#555555',
      borderSubtle: '#444444',
    };

    const tokens = colorRolesToTokens(roles);
    expect(tokens.headingText).toBe('#eeeeee');
    expect(tokens.bodyText).toBe('#dddddd');
    expect(tokens.textPrimary).toBe('#eeeeee');
    expect(tokens.activeLineBg).toBe('#2a2a30');

    const back = tokensToColorRoles(tokens);
    expect(back).toEqual(roles);
  });

  it('maps sidebar text from color roles when merging with base colors', () => {
    const baseColors = {
      bgBase: '#08080a',
      bgSurface: '#0c0c10',
      bgElevated: '#101018',
      textPrimary: '#fff8fc',
      textSecondary: '#00f0ff',
      textMuted: '#e878d8',
      accent: '#ff00aa',
      accentMuted: '#00ffee',
      border: '#5a1888',
      borderSubtle: '#1a1028',
      focusRing: '#ff00aa88',
      editorBg: '#06060a',
      sidebarBg: '#0a0a0e',
      sidebarText: '#ebebeb',
      sidebarTextMuted: '#888888',
    };
    const roles = tokensToColorRoles(baseColors);
    roles.placeholderText = '#aabbcc';
    roles.headingText = '#ddeeff';
    const merged = mergeColorRolesWithBase(roles, baseColors);
    expect(merged.bgBase).toBe('#08080a');
    expect(merged.editorBg).toBe('#06060a');
    expect(merged.sidebarText).toBe('#ddeeff');
    expect(merged.sidebarTextMuted).toBe('#aabbcc');
    expect(merged.textMuted).toBe('#aabbcc');
  });
});
