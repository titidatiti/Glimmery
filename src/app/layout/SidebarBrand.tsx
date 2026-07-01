import { useIsPhoneLandscapeLayout } from '@/ui';

import styles from './SidebarBrand.module.css';

const BRAND_ICON_SRC = '/icon.png';

export function SidebarBrand() {
  const isPhoneLandscape = useIsPhoneLandscapeLayout();

  return (
    <header className={`${styles.brand} ${isPhoneLandscape ? styles.brandPhoneLandscape : ''}`}>
      <div className={styles.brandMark}>
        <div className={styles.brandIconWrap}>
          <img className={styles.brandIcon} src={BRAND_ICON_SRC} alt="" decoding="async" />
        </div>
        <div className={styles.titles}>
          <h1 className={styles.name}>Glimmery</h1>
          <p className={styles.tagline}>Where every glimmer becomes memory.</p>
        </div>
      </div>
    </header>
  );
}
