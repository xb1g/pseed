"use client";

import { useState } from "react";
import { ArrowLeft, ExternalLink, Users } from "lucide-react";
import InterestDialog from "./InterestDialog";
import ThemeToggle from "./ThemeToggle";
import WaveEntry from "./WaveEntry";
import type { GalleryProduct } from "@/lib/hackathon/gallery";

interface ProductDetailProps {
  product: GalleryProduct;
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <WaveEntry />
      <div style={{ minHeight: "100vh", background: "var(--bloom-bg)" }}>

        {/* Hero band — steel-blue gradient with optional cover image overlay */}
        <div
          className="bloom-hero"
          style={{ minHeight: "clamp(220px, 32vw, 420px)" }}
        >
          <div className="bloom-hero__grain" aria-hidden="true" />

          {/* If cover image exists, overlay it with low opacity on top of gradient */}
          {product.cover_image_url && (
            <img
              src={product.cover_image_url}
              alt=""
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center top",
                opacity: 0.28,
                mixBlendMode: "luminosity",
                zIndex: 0,
              }}
              fetchPriority="high"
            />
          )}

          {/* Nav */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 clamp(1.25rem, 5vw, 3rem)",
              height: "64px",
            }}
          >
            <a
              href="/hackathon/gallery"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
                fontSize: "0.9375rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.75)",
                textDecoration: "none",
                transition: "color 160ms",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#ffffff")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,0.75)")}
            >
              <ArrowLeft size={15} aria-hidden="true" />
              All products
            </a>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <ThemeToggle />
              <button
                className="bloom-button"
                onClick={() => setDialogOpen(true)}
                style={{ padding: "0.5rem 1.25rem", fontSize: "0.875rem" }}
              >
                <span className="bloom-button__grain" aria-hidden="true" />
                I want to use this product
              </button>
            </div>
          </nav>

          {/* Hero title area */}
          <div
            style={{
              padding: "clamp(1.5rem, 3vw, 2.5rem) clamp(1.25rem, 5vw, 3rem) clamp(3rem, 5vw, 4.5rem)",
              maxWidth: "1200px",
              margin: "0 auto",
            }}
          >
            {/* Tags */}
            {product.tags.length > 0 && (
              <div
                className="flex flex-wrap gap-2"
                aria-label="Categories"
                style={{ marginBottom: "1rem" }}
              >
                {product.tags.map((tag) => (
                  <a
                    key={tag}
                    href={`/hackathon/gallery?tag=${encodeURIComponent(tag)}`}
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "9999px",
                      fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: "rgba(255,255,255,0.15)",
                      border: "1px solid rgba(255,255,255,0.28)",
                      color: "#ffffff",
                      textDecoration: "none",
                      transition: "background 160ms",
                      backdropFilter: "blur(4px)",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.22)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.15)")}
                  >
                    {tag}
                  </a>
                ))}
              </div>
            )}

            <h1
              style={{
                fontFamily: "var(--font-kodchasan), var(--font-libre-franklin), sans-serif",
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.025em",
                color: "#ffffff",
                margin: "0 0 0.875rem",
                textWrap: "balance",
                textShadow: "0 2px 16px rgba(20,40,80,0.40)",
              } as React.CSSProperties}
            >
              {product.product_name}
            </h1>

            <p
              style={{
                fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
                fontSize: "clamp(0.9375rem, 1.8vw, 1.125rem)",
                fontWeight: 500,
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.55,
                margin: 0,
                maxWidth: "58ch",
                textWrap: "pretty",
              } as React.CSSProperties}
            >
              {product.problem_statement}
            </p>
          </div>
        </div>

        {/* Content */}
        <main
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "clamp(2rem, 4vw, 3rem) clamp(1.25rem, 5vw, 3rem) 6rem",
          }}
        >
          {/* Two-column layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "3rem",
            }}
            className="detail-layout"
          >
            {/* Left: main content */}
            <div style={{ minWidth: 0 }}>
              {/* Divider */}
              <div style={{ height: "1px", background: "var(--bloom-border-subtle)", marginBottom: "2rem" }} />

              {/* Solution description */}
              <div
                style={{
                  fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
                  fontSize: "1rem",
                  lineHeight: 1.75,
                  color: "var(--bloom-text-secondary)",
                  maxWidth: "68ch",
                  textWrap: "pretty",
                } as React.CSSProperties}
              >
                {product.solution_description.split("\n\n").map((para, i) => (
                  <p key={i} style={{ margin: i === 0 ? 0 : "1em 0 0" }}>
                    {para}
                  </p>
                ))}
              </div>

              {/* Additional images */}
              {product.additional_images.length > 0 && (
                <div
                  style={{
                    marginTop: "2.5rem",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                    gap: "1rem",
                  }}
                >
                  {product.additional_images.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`${product.product_name} screenshot ${i + 2}`}
                      loading="lazy"
                      decoding="async"
                      style={{
                        width: "100%",
                        borderRadius: "10px",
                        border: "1px solid var(--bloom-border-default)",
                        display: "block",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right: sticky sidebar */}
            <aside>
              <div
                className="bloom-card"
                style={{ padding: "1.5rem", position: "sticky", top: "80px" }}
              >
                <span className="bloom-card__shimmer" aria-hidden="true" />

                <div style={{ position: "relative", zIndex: 1 }}>
                  {/* Team */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        marginBottom: "0.875rem",
                      }}
                    >
                      <Users size={14} style={{ color: "var(--bloom-text-muted)" }} aria-hidden="true" />
                      <span
                        style={{
                          fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--bloom-text-muted)",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        The team
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--font-kodchasan), sans-serif",
                        fontSize: "1.0625rem",
                        fontWeight: 700,
                        color: "var(--bloom-text-primary)",
                        margin: "0 0 0.5rem",
                      }}
                    >
                      {product.team?.name}
                    </p>
                    {product.team?.members && product.team.members.length > 0 && (
                      <ul
                        style={{
                          listStyle: "none",
                          margin: 0,
                          padding: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                        }}
                      >
                        {product.team.members.map((m, i) => (
                          <li
                            key={i}
                            style={{
                              fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
                              fontSize: "0.9rem",
                              color: "var(--bloom-text-secondary)",
                            }}
                          >
                            {m.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{ height: "1px", background: "var(--bloom-border-subtle)", marginBottom: "1.5rem" }} />

                  {/* Hackathon badge */}
                  <p
                    style={{
                      fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
                      fontSize: "0.8125rem",
                      color: "var(--bloom-text-muted)",
                      margin: "0 0 1.5rem",
                    }}
                  >
                    Built at{" "}
                    <span style={{ color: "var(--bloom-text-secondary)", fontWeight: 600 }}>
                      {product.hackathon_name} {product.hackathon_year}
                    </span>
                  </p>

                  {/* Demo link */}
                  {product.demo_url && (
                    <a
                      href={product.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bloom-button bloom-button--ghost"
                      style={{
                        display: "flex",
                        width: "100%",
                        justifyContent: "center",
                        marginBottom: "0.75rem",
                        textDecoration: "none",
                        fontSize: "0.9rem",
                        padding: "0.625rem 1.25rem",
                      }}
                    >
                      <ExternalLink size={14} aria-hidden="true" />
                      View demo
                    </a>
                  )}

                  {/* CTA */}
                  <button
                    className="bloom-button"
                    style={{ width: "100%", fontSize: "0.9375rem" }}
                    onClick={() => setDialogOpen(true)}
                  >
                    <span className="bloom-button__grain" aria-hidden="true" />
                    I want to use this product
                  </button>

                  {/* LINE QR */}
                  {product.line_qr_url && (
                    <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--bloom-border-subtle)' }}>
                      <p style={{
                        fontFamily: 'var(--font-bai-jamjuree), sans-serif',
                        fontSize: '0.75rem', fontWeight: 700,
                        color: 'var(--bloom-text-muted)',
                        letterSpacing: '0.06em', textTransform: 'uppercase' as const,
                        margin: '0 0 0.75rem',
                      }}>
                        Chat with the team on LINE
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <img
                          src={product.line_qr_url}
                          alt='LINE QR code — scan to contact the team'
                          style={{
                            width: '140px', height: '140px',
                            objectFit: 'contain',
                            borderRadius: '12px',
                            border: '1px solid rgba(74,222,128,0.2)',
                            background: '#ffffff',
                            padding: '0.5rem',
                            display: 'block',
                          }}
                        />
                      </div>
                      <p style={{
                        fontFamily: 'var(--font-bai-jamjuree), sans-serif',
                        fontSize: '0.75rem', color: 'var(--bloom-text-muted)',
                        textAlign: 'center', margin: '0.625rem 0 0',
                      }}>
                        Scan to add on LINE
                      </p>
                    </div>
                  )}

                  {/* Interest count */}
                  {product.interest_count > 0 && (
                    <p
                      style={{
                        fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
                        fontSize: "0.8125rem",
                        color: "var(--bloom-text-muted)",
                        margin: "1rem 0 0",
                        textAlign: "center",
                      }}
                    >
                      {product.interest_count}{" "}
                      {product.interest_count === 1 ? "person has" : "people have"} expressed interest
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      <InterestDialog
        productId={product.id}
        productName={product.product_name}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

      <style>{`
        @media (min-width: 768px) {
          .detail-layout {
            grid-template-columns: 1fr 320px !important;
          }
        }
        @media (min-width: 1024px) {
          .detail-layout {
            grid-template-columns: 1fr 360px !important;
          }
        }
      `}</style>
    </>
  );
}
