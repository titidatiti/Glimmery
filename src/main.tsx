import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { bootstrapEditorTypographyVars } from '@/core/settings';
import { App } from '@/app/App';
import '@/ui/styles/global.css';

bootstrapEditorTypographyVars();

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('找不到 #root 挂载点');
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
