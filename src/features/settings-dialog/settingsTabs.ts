export type SettingsTabId = 'theme' | 'typography' | 'audio' | 'sync' | 'about';

export interface SettingsTabDefinition {
  id: SettingsTabId;
  label: string;
  hasPreview?: boolean;
}

export const SETTINGS_TABS: SettingsTabDefinition[] = [
  { id: 'theme', label: '主题', hasPreview: true },
  { id: 'typography', label: '字体与排版', hasPreview: true },
  { id: 'audio', label: '音频' },
  { id: 'sync', label: '云同步' },
  { id: 'about', label: '关于' },
];

export function tabHasPreview(tabId: SettingsTabId): boolean {
  return SETTINGS_TABS.find((t) => t.id === tabId)?.hasPreview === true;
}
