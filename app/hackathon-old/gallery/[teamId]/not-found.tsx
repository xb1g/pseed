import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bloom-bg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-kodchasan), sans-serif",
          fontSize: "1.375rem",
          fontWeight: 700,
          color: "var(--bloom-text-primary)",
          margin: 0,
        }}
      >
        This product isn&apos;t in the gallery
      </p>
      <p
        style={{
          fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
          fontSize: "1rem",
          color: "var(--bloom-text-secondary)",
          margin: 0,
          maxWidth: "36ch",
          lineHeight: 1.6,
        }}
      >
        It may not be published yet, or the link has changed.
      </p>
      <Link
        href="/hackathon/gallery"
        className="bloom-button bloom-button--ghost"
        style={{ textDecoration: "none" }}
      >
        Browse all products
      </Link>
    </div>
  );
}
