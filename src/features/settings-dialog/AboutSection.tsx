import styles from './AboutSection.module.css';

export function AboutSection() {
  return (
    <div className={styles.section}>
      <div className={styles.brand}>
        <h3 className={styles.name}>Glimmery</h3>
        <p className={styles.tagline}>Where every glimmer becomes memory.</p>
      </div>
      <dl className={styles.meta}>
        <div className={styles.row}>
          <dt>版本</dt>
          <dd>0.1.0</dd>
        </div>
        <div className={styles.row}>
          <dt>理念</dt>
          <dd>优雅简约的沉浸式写作</dd>
        </div>
      </dl>
      <p className={styles.note}>
        Glimmery 是一款本地优先的写作应用，你的文稿保存在浏览器本地，离线可用。
      </p>
    </div>
  );
}
