import { useEffect, type ReactNode } from 'react';
import { useThemeStore, tokensToCssVariables } from '@/core/themes';

export interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const activeTheme = useThemeStore((s) => s.activeTheme);

  useEffect(() => {
    const vars = tokensToCssVariables(activeTheme.tokens);
    const root = document.documentElement;
    for (const [name, value] of Object.entries(vars)) {
      root.style.setProperty(name, value);
    }
    root.dataset.theme = activeTheme.id;
  }, [activeTheme]);

  return <>{children}</>;
}
