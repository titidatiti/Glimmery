import { useServices } from '@/services/context';
import { useSettingsStore } from '@/core/settings';
import styles from './AudioSection.module.css';

export function AudioSection() {
  const { audio } = useServices();
  const keystrokeAudioEnabled = useSettingsStore((s) => s.keystrokeAudioEnabled);
  const keystrokeVolume = useSettingsStore((s) => s.keystrokeVolume);
  const setKeystrokeAudioEnabled = useSettingsStore((s) => s.setKeystrokeAudioEnabled);
  const setKeystrokeVolume = useSettingsStore((s) => s.setKeystrokeVolume);

  const handleToggle = (enabled: boolean) => {
    setKeystrokeAudioEnabled(enabled);
  };

  const handleVolumeChange = (value: number) => {
    setKeystrokeVolume(value);
    audio.setVolume('keystroke', value);
  };

  const handlePreview = () => {
    audio.setVolume('keystroke', keystrokeVolume);
    audio.playKeystroke();
  };

  return (
    <div className={styles.section}>
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>打字音效</legend>

        <div className={styles.toggleRow}>
          <label className={styles.switchLabel}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={keystrokeAudioEnabled}
              onChange={(e) => handleToggle(e.target.checked)}
            />
            <span className={styles.switchTrack}>
              <span className={styles.switchThumb} />
            </span>
          </label>
          <span className={styles.toggleText}>
            {keystrokeAudioEnabled ? '已启用' : '已关闭'}
          </span>
        </div>

        <div
          className={`${styles.volumeControl} ${
            !keystrokeAudioEnabled ? styles.disabled : ''
          }`}
        >
          <div className={styles.sliderRow}>
            <span className={styles.sliderMark}>轻</span>
            <input
              className={styles.slider}
              type="range"
              min={0}
              max={100}
              step={1}
              value={keystrokeVolume * 100}
              onChange={(e) => handleVolumeChange(Number(e.target.value) / 100)}
              disabled={!keystrokeAudioEnabled}
              aria-label="打字音音量"
              aria-valuetext={`${Math.round(keystrokeVolume * 100)}%`}
            />
            <span className={styles.sliderMark}>响</span>
          </div>
          <p className={styles.sliderValue}>{Math.round(keystrokeVolume * 100)}%</p>
        </div>

        <button
          type="button"
          className={styles.previewButton}
          onClick={handlePreview}
        >
          试听音效
        </button>
      </fieldset>

      <p className={styles.note}>
        当前使用合成音效，后续可配置真实键盘录音素材。
      </p>
    </div>
  );
}
