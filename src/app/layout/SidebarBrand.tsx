import styles from './SidebarBrand.module.css';

export function SidebarBrand() {
  return (
    <header className={styles.brand}>
      <h1 className={styles.name}>Glimmery</h1>
      <p className={styles.tagline}>Where every glimmer becomes memory.</p>
    </header>
  );
}
