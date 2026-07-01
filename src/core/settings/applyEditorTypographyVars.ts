import {
  loadEditorTypographyPreferences,
  resolveEditorTypographyCssVars,
  type EditorTypographyPreferences,
} from './editorTypography';

export function applyEditorTypographyVars(preferences: EditorTypographyPreferences): void {
  if (typeof document === 'undefined') return;

  const vars = resolveEditorTypographyCssVars(preferences);
  const root = document.documentElement;
  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value);
  }
}

/** 首屏同步写入，避免 useEffect 造成编辑区与预览短暂不一致 */
export function bootstrapEditorTypographyVars(): void {
  applyEditorTypographyVars(loadEditorTypographyPreferences());
}
