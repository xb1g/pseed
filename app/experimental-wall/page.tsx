import styles from "./experimental-wall.module.css";

const pieces = [
  {
    src: "/images/experimental-piece-130.png",
    alt: "Rook chess piece",
    className: styles.rook,
  },
  {
    src: "/images/experimental-piece-129.svg",
    alt: "Queen chess piece",
    className: styles.queen,
  },
  {
    src: "/images/experimental-pawn.svg",
    alt: "Pawn chess piece",
    className: styles.pawn,
  },
  {
    src: "/images/experimental-piece-131.svg",
    alt: "Knight chess piece",
    className: styles.knight,
  },
];

export default function ExperimentalWallPage() {
  return (
    <main className={styles.canvas} aria-label="Experimental chess pieces">
      <div className={styles.background} aria-hidden="true">
        <span className={styles.grain} />
        <span className={styles.glowA} />
        <span className={styles.glowB} />
        <span className={styles.glowC} />
        <span className={styles.vignette} />
      </div>

      <div className={styles.scene}>
        <div className={styles.pieceRow}>
          {pieces.map((piece) => (
            <img
              key={piece.src}
              className={`${styles.piece} ${piece.className}`}
              src={piece.src}
              alt={piece.alt}
              draggable={false}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
