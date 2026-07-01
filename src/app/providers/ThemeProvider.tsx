import { useEffect, useRef, type ReactNode } from 'react';
import { useThemeStore, tokensToCssVariables } from '@/core/themes';
import {
  animateThemeColors,
  applyCssVariables,
  pickThemeColorVars,
  pickThemeShadowVars,
  readThemeColorVarsFromRoot,
} from '@/core/themes/themeTransition';

export interface ThemeProviderProps {
  children: ReactNode;
}

const THEME_TRANSITION_MS = 520;
const PREVIEW_TRANSITION_MS = 0;

export function ThemeProvider({ children }: ThemeProviderProps) {
  const activeTheme = useThemeStore((s) => s.activeTheme);
  const previewTokens = useThemeStore((s) => s.previewTokens);
  const tokens = previewTokens ?? activeTheme.tokens;
  const cancelRef = useRef<(() => void) | null>(null);
  const latestVarsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const root = document.documentElement;
    const isPreview = Boolean(previewTokens);
    const allVars = tokensToCssVariables(tokens);
    const targetColors = pickThemeColorVars(allVars);
    const shadowVars = pickThemeShadowVars(allVars);
    const nonColorVars = Object.fromEntries(
      Object.entries(allVars).filter(([key]) => !(key in targetColors)),
    );

    latestVarsRef.current = allVars;

    cancelRef.current?.();
    cancelRef.current = null;

    applyCssVariables(root, nonColorVars);

    const fromColors = readThemeColorVarsFromRoot(root);

    const applyFrame = (colorVars: Record<string, string>) => {
      applyCssVariables(root, { ...colorVars, ...shadowVars });
    };

    cancelRef.current = animateThemeColors({
      from: fromColors,
      to: targetColors,
      durationMs: isPreview ? PREVIEW_TRANSITION_MS : THEME_TRANSITION_MS,
      onFrame: applyFrame,
      onComplete: () => {
        applyCssVariables(root, allVars);
        root.dataset.theme = isPreview ? 'preview' : activeTheme.id;
      },
    });

    return () => {
      cancelRef.current?.();
      cancelRef.current = null;
      applyCssVariables(root, latestVarsRef.current);
    };
  }, [tokens, previewTokens, activeTheme.id]);

  return <>{children}</>;
}
