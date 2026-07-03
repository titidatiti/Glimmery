import styles from './AboutSection.module.css';

const BRAND_ICON_SRC = '/icon.png';
const GITHUB_URL = 'https://github.com/titidatiti/Glimmery';

export function AboutSection() {
  return (
    <div className={styles.section}>
      <div className={styles.brand}>
        <div className={styles.brandMark}>
          <div className={styles.brandIconWrap}>
            <img className={styles.brandIcon} src={BRAND_ICON_SRC} alt="" decoding="async" />
          </div>
          <div className={styles.titles}>
            <h3 className={styles.name}>Glimmery</h3>
            <div className={styles.subtitleGroup}>
              <p className={styles.taglineZh}>微光汇聚，字句成行</p>
              <p className={styles.taglineEn}>Where every glimmer becomes memory.</p>
            </div>
          </div>
        </div>
      </div>
      <p className={styles.note}>
        「微光汇聚，字句成行」——做极致的减法，让创作的空间中只有创作。愿你的灵感微光，都能融汇成美好的记忆，留在这里。
      </p>
      <dl className={styles.meta}>
        <div className={styles.row}>
          <dt>版本</dt>
          <dd>0.1.0</dd>
        </div>
        <div className={styles.row}>
          <dt>作者</dt>
          <dd>踢踢打踢踢</dd>
        </div>
        <div className={styles.row}>
          <dt>项目主页</dt>
          <dd className={styles.rowValue}>
            <a
              className={styles.link}
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {GITHUB_URL}
            </a>
          </dd>
        </div>
      </dl>
    </div>
  );
}
