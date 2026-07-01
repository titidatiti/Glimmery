import styles from './SidebarBrand.module.css';

export function SidebarBrand() {
  return (
    <header className={styles.brand}>
      <div className={styles.brandMark}>
        <div className={styles.iconSlot} aria-hidden title="应用图标（预留）" />
        <div className={styles.titles}>
          <h1 className={styles.name}>Glimmery</h1>
          <p className={styles.tagline}>Where every glimmer becomes memory.</p>
        </div>
      </div>
    </header>
  );
}
