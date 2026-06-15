"use client";

import styles from "./NpcFire.module.css";

export default function NpcFire() {
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.glow} />

      {/* All flames behind face */}
      <div className={styles.flameWrapper}>
        <div className={`${styles.flame} ${styles.flameRed}`} />
        <div className={`${styles.flame} ${styles.flameOrange}`} />
        <div className={`${styles.flame} ${styles.flameGold}`} />
        <div className={`${styles.flame} ${styles.flameWhite}`} />
      </div>

      {/* Face on top of everything */}
      <div className={styles.face}>
        <div className={styles.head}>
          <div className={styles.eye}>
            <div className={styles.pupil} />
          </div>
          <div className={`${styles.eye} ${styles.eyeRight}`}>
            <div className={styles.pupil} />
          </div>
          <div className={styles.mouth} />
        </div>
      </div>

      <div className={`${styles.spark} ${styles.spark1}`} />
      <div className={`${styles.spark} ${styles.spark2}`} />
      <div className={`${styles.spark} ${styles.spark3}`} />
      <div className={`${styles.spark} ${styles.spark4}`} />
      <div className={`${styles.spark} ${styles.spark5}`} />
    </div>
  );
}
