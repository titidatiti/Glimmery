import type { ThemeTokens } from '@/core/themes/types';

/** ThemePreview 用的固定排版，避免依赖完整 builtin theme */
export const SHARED_TYPOGRAPHY: ThemeTokens['typography'] = {
  fontSans: 'system-ui, sans-serif',
  fontMono: 'monospace',
  fontSizeBase: '16px',
  fontSizeSm: '14px',
  fontSizeLg: '18px',
  fontSizeXl: '24px',
  lineHeightBase: '1.7',
  lineHeightTight: '1.4',
};
