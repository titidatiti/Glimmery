import { APP_VERSION } from '@/app/version';
import { parseChangelog } from '@/lib/parseChangelog';
import { publicAssetUrl } from '@/lib';

import changelogRaw from '../../../CHANGELOG.md?raw';
import styles from './AboutSection.module.css';

const BRAND_ICON_SRC = publicAssetUrl('icon.png');
const GITHUB_URL = 'https://github.com/titidatiti/Glimmery';
const CHANGELOG_RELEASES = parseChangelog(changelogRaw);

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
          <dd>{APP_VERSION}</dd>
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

      <section className={styles.changelog} aria-labelledby="about-changelog-heading">
        <h4 id="about-changelog-heading" className={styles.changelogHeading}>
          更新日志
        </h4>
        <div className={styles.changelogScroll}>
          {CHANGELOG_RELEASES.map((release) => (
            <article key={release.version} className={styles.release}>
              <header className={styles.releaseHeader}>
                <h5 className={styles.releaseVersion}>v{release.version}</h5>
                {release.date && (
                  <time className={styles.releaseDate} dateTime={release.date}>
                    {release.date}
                  </time>
                )}
              </header>
              {release.sections.map((section) => (
                <div key={`${release.version}-${section.title}`} className={styles.releaseSection}>
                  <p className={styles.releaseSectionTitle}>{section.title}</p>
                  <ul className={styles.releaseList}>
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
