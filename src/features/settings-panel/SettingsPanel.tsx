import styles from './SettingsPanel.module.css';

export function SettingsPanel() {
  return (
    <div className={styles.panel}>
      <h3 className={styles.heading}>设置</h3>
      <section className={styles.section}>
        <p className={styles.hint}>音频与云同步功能将在阶段二开放。</p>
      </section>
      <section className={styles.section}>
        <h4 className={styles.subheading}>快捷键</h4>
        <ul className={styles.shortcuts}>
          <li>
            <kbd>F11</kbd> 专注模式
          </li>
          <li>
            <kbd>Ctrl</kbd> + <kbd>B</kbd> 切换侧栏
          </li>
        </ul>
      </section>
    </div>
  );
}
