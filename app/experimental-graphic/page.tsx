import styles from "./experimental-graphic.module.css";

export default function ExperimentalGraphicPage() {
  return (
    <main className={styles.canvas} aria-label="Experimental green sphere graphic">
      <div className={styles.stack}>
        <p className={styles.label} data-text="AI">AI</p>
        <div className={styles.sphere} aria-hidden="true" />
      </div>
    </main>
  );
}
