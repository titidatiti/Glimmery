import { useSettingsStore } from '@/core/settings';
import { GearIcon } from '@/ui';
import styles from './SettingsDialog.module.css';

export function SettingsTrigger() {
  const openSettings = useSettingsStore((s) => s.openSettings);

  return (
    <button type="button" className={styles.trigger} onClick={openSettings}>
      <GearIcon className={styles.triggerIcon} />
      <span>设置</span>
    </button>
  );
}
