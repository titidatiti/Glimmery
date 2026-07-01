import { useSyncExternalStore } from 'react';

export interface CustomThemeEditorActions {
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
}

let actions: CustomThemeEditorActions | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function setCustomThemeEditorActions(next: CustomThemeEditorActions | null) {
  actions = next;
  emit();
}

export function useCustomThemeEditorActions(): CustomThemeEditorActions | null {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => actions,
    () => null,
  );
}
