import { useLayoutEffect, type ReactNode } from 'react';
import { applyEditorTypographyVars, useSettingsStore } from '@/core/settings';

export interface TypographyProviderProps {
  children: ReactNode;
}

export function TypographyProvider({ children }: TypographyProviderProps) {
  const editorTypography = useSettingsStore((s) => s.editorTypography);

  useLayoutEffect(() => {
    applyEditorTypographyVars(editorTypography);
  }, [editorTypography]);

  return <>{children}</>;
}
