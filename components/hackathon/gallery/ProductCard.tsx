"use client";

import { useEffect, useRef } from "react";
import { Eye } from "lucide-react";
import type { GalleryProductSummary } from "@/lib/hackathon/gallery";
import { useLang, t } from "@/lib/hackathon/gallery-lang";

interface ProductCardProps {
  product: GalleryProductSummary;
  style?: React.CSSProperties;
  onNavigate?: (href: string) => void;
}

// Single letter of the team name for the image fallback
function TeamInitial({ name }: { name: string }) {
  const initial = name.trim()[0]?.toUpperCase() ?? "?";
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex items-center justify-center select-none"
      style={{
        background: "var(--bloom-bg-raised)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-kodchasan), sans-serif",
          fontSize: "clamp(3rem, 8vw, 5rem)",
          fontWeight: 700,
          color: "var(--bloom-border-strong)",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {initial}
      </span>
    </div>
  );
}

export default function ProductCard({ product, style, onNavigate }: ProductCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const { lang } = useLang();

  // Touch: apply in-view class via IntersectionObserver
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Only activate the touch class on touch-primary devices
    const touchQuery = window.matchMedia("(hover: none)");
    if (!touchQuery.matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          card.classList.add("bloom-card--in-view");
        } else {
          card.classList.remove("bloom-card--in-view");
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  const href = `/hackathon/gallery/${product.team_id}`;

  return (
    <a
      ref={cardRef}
      href={href}
      onClick={(e) => {
        if (onNavigate) {
          e.preventDefault();
          onNavigate(href);
        }
      }}
      className="bloom-card block no-underline focus-visible:outline-none focus-visible:ring-2"
      style={{
        ...style,
        cursor: "pointer",
        ["--tw-ring-color" as string]: "var(--bloom-focus-ring)",
      }}
      aria-label={`View ${product.product_name} by ${product.team_name}`}
    >
      {/* Shimmer element (::before is taken by noise) */}
      <span className="bloom-card__shimmer" aria-hidden="true" />

      {/* Cover image */}
      <div
        className="relative overflow-hidden"
        style={{ aspectRatio: "16/9" }}
      >
        {product.cover_image_url ? (
          <img
            src={product.cover_image_url}
            alt={`${product.product_name} preview`}
            className="absolute inset-0 w-full h-full object-cover object-top"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <TeamInitial name={product.team_name} />
        )}
        {/* subtle bottom fade to card body */}
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.18))",
          }}
        />
      </div>

      {/* Card body — sits above noise layer */}
      <div className="relative z-10 p-5 flex flex-col gap-3">
        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="Categories">
            {product.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
                  background: "var(--bloom-accent-subtle)",
                  border: "1px solid var(--bloom-accent-border)",
                  color: "var(--bloom-accent)",
                  fontSize: "0.6875rem",
                  letterSpacing: "0.02em",
                }}
              >
                {tag}
              </span>
            ))}
            {product.tags.length > 3 && (
              <span
                className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
                  background: "var(--bloom-border-subtle)",
                  border: "1px solid var(--bloom-border-default)",
                  color: "var(--bloom-text-muted)",
                  fontSize: "0.6875rem",
                }}
              >
                +{product.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Product name */}
        <h2
          style={{
            fontFamily: "var(--font-kodchasan), var(--font-libre-franklin), sans-serif",
            fontSize: "clamp(1.1rem, 2vw, 1.3rem)",
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            color: "var(--bloom-text-primary)",
            textWrap: "balance",
            margin: 0,
          }}
        >
          {t(product.product_name, product.product_name_th, lang)}
        </h2>

        {/* Problem statement */}
        <p
          style={{
            fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
            fontSize: "0.875rem",
            lineHeight: 1.55,
            color: "var(--bloom-text-secondary)",
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textWrap: "pretty",
          } as React.CSSProperties}
        >
          {t(product.problem_statement, product.problem_statement_th, lang)}
        </p>

        {/* Footer: team + interest count */}
        <div className="flex items-center justify-between mt-1 pt-3" style={{ borderTop: "1px solid var(--bloom-border-subtle)" }}>
          <span
            style={{
              fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
              fontSize: "0.8125rem",
              color: "var(--bloom-text-muted)",
              fontWeight: 500,
            }}
          >
            {product.team_name}
          </span>

          {product.interest_count > 0 && (
            <span className="bloom-interest-badge" aria-label={`${product.interest_count} people expressed interest`}>
              <span className="bloom-interest-badge__dot" aria-hidden="true" />
              <Eye size={11} aria-hidden="true" />
              {product.interest_count}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
