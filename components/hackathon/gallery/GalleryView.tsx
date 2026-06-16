"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import gsap from "gsap";
import ProductCard from "./ProductCard";
import { type GalleryWaveOverlayHandle } from "./GalleryWaveOverlay";
import type { GalleryProductSummary } from "@/lib/hackathon/gallery";

interface GalleryViewProps {
  products: GalleryProductSummary[];
  allTags: string[];
  initialTag?: string;
  waveRef: React.RefObject<GalleryWaveOverlayHandle>;
}

export default function GalleryView({ products, allTags, initialTag, waveRef }: GalleryViewProps) {
  const [activeTags, setActiveTags] = useState<Set<string>>(
    initialTag ? new Set([initialTag]) : new Set()
  );
  const gridRef = useRef<HTMLDivElement>(null);

  const handleCardNavigate = useCallback((href: string) => {
    waveRef.current?.navigateTo(href);
  }, [waveRef]);

  const filtered = useMemo(() => {
    if (activeTags.size === 0) return products;
    return products.filter((p) => p.tags.some((t) => activeTags.has(t)));
  }, [products, activeTags]);

  const toggleTag = useCallback((tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });

    // Animate grid items on filter change
    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll<HTMLElement>(".bloom-card");
      gsap.fromTo(
        cards,
        { opacity: 0.4, y: 6 },
        {
          opacity: 1,
          y: 0,
          duration: 0.28,
          stagger: 0.04,
          ease: "power2.out",
          clearProps: "opacity,y",
        }
      );
    }
  }, []);

  const clearFilters = useCallback(() => {
    setActiveTags(new Set());
  }, []);

  return (
    <div>
      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div
          role="group"
          aria-label="Filter by category"
          className="flex items-center gap-2 overflow-x-auto pb-1"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {allTags.map((tag) => {
            const active = activeTags.has(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                aria-pressed={active}
                style={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0.375rem 1rem",
                  borderRadius: "9999px",
                  fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 160ms, border-color 160ms, color 160ms",
                  border: active
                    ? "1px solid var(--bloom-accent-border)"
                    : "1px solid var(--bloom-border-default)",
                  background: active
                    ? "var(--bloom-accent-subtle)"
                    : "var(--bloom-border-subtle)",
                  color: active ? "var(--bloom-accent)" : "var(--bloom-text-muted)",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(90, 158, 200, 0.08)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bloom-accent-border)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--bloom-accent)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    (e.currentTarget as HTMLButtonElement).style.background = "var(--bloom-border-subtle)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--bloom-border-default)";
                    (e.currentTarget as HTMLButtonElement).style.color = "var(--bloom-text-muted)";
                  }
                }}
              >
                {tag}
              </button>
            );
          })}

          {activeTags.size > 0 && (
            <button
              onClick={clearFilters}
              aria-label="Clear all filters"
              style={{
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.375rem 0.875rem",
                borderRadius: "9999px",
                fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                border: "1px solid var(--bloom-border-default)",
                background: "var(--bloom-border-subtle)",
                color: "var(--bloom-text-muted)",
                transition: "background 160ms, color 160ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bloom-border-default)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--bloom-text-secondary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bloom-border-subtle)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--bloom-text-muted)";
              }}
            >
              <X size={11} aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState hasFilters={activeTags.size > 0} onClear={clearFilters} />
      ) : (
        <div
          ref={gridRef}
          style={{
            marginTop: "2rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {filtered.map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              onNavigate={handleCardNavigate}
              style={{
                // Stagger initial entrance via CSS delay — visible by default, enhanced by motion
                animationDelay: `${i * 60}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div
      style={{
        background: "var(--bloom-bg-surface)",
        borderRadius: "16px",
        border: "1px solid var(--bloom-border-default)",
        marginTop: "2rem",
        padding: "4rem 2rem",
        textAlign: "center",
        minHeight: "280px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-kodchasan), sans-serif",
          fontSize: "1.25rem",
          fontWeight: 700,
          color: "var(--bloom-text-primary)",
          margin: 0,
          position: "relative",
          zIndex: 1,
        }}
      >
        {hasFilters ? "No products match these categories" : "The gallery opens after the final round"}
      </p>
      <p
        style={{
          fontFamily: "var(--font-bai-jamjuree), var(--font-libre-franklin), sans-serif",
          fontSize: "0.9375rem",
          color: "var(--bloom-text-secondary)",
          margin: 0,
          maxWidth: "38ch",
          lineHeight: 1.6,
          position: "relative",
          zIndex: 1,
        }}
      >
        {hasFilters
          ? "Try removing a filter to see more products."
          : "Come back to see what the teams built."}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="bloom-button bloom-button--ghost"
          style={{ marginTop: "0.5rem", position: "relative", zIndex: 1 }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
