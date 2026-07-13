"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getRadarFields, getRadarCollections } from "@/lib/supabase/radar";
import { filterRadarFields, normalizeRadarCollections } from "@/lib/radar/filters";
import type { Database } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type RadarField = Database["public"]["Tables"]["radar_fields"]["Row"];
type RadarCollection = Database["public"]["Tables"]["radar_collections"]["Row"];

const CAREER_FIGURES = [
  "/images/radar/jojo-dio-hirose.png",
  "/images/radar/jojo-full-body-blue.png",
  "/images/radar/jojo-full-body-dark.webp",
] as const;

function stableHash(value: string) {
  return Array.from(value).reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    0
  );
}

function normalizeHex(value: string | null) {
  const match = value?.trim().match(/^#?([\da-f]{3}|[\da-f]{6})$/i);
  if (!match) return "#3b82f6";
  const hex = match[1];
  return `#${hex.length === 3 ? Array.from(hex).map((digit) => digit + digit).join("") : hex}`;
}

function mixHex(source: string, target: string, targetWeight: number) {
  const parse = (hex: string) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  const sourceRgb = parse(source);
  const targetRgb = parse(target);
  return `#${sourceRgb
    .map((channel, index) =>
      Math.round(channel + (targetRgb[index] - channel) * targetWeight)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

function getCareerCardVisual(field: RadarField) {
  const seed = stableHash(field.slug);
  const base = normalizeHex(field.color);
  const light = mixHex(base, "#ffffff", 0.58);
  const deep = mixHex(base, "#050505", 0.38);
  const variant = seed % 4;
  const backgrounds = [
    `radial-gradient(circle at 78% 12%, ${light} 0%, transparent 38%), linear-gradient(150deg, ${base} 0%, ${deep} 100%)`,
    `radial-gradient(circle at 12% 88%, ${light} 0%, transparent 54%), linear-gradient(35deg, ${light} 0%, ${base} 56%, ${deep} 100%)`,
    `radial-gradient(circle at 50% 18%, ${light} 0%, transparent 44%), linear-gradient(180deg, ${base} 0%, ${deep} 100%)`,
    `radial-gradient(circle at 82% 82%, ${light} 0%, transparent 56%), linear-gradient(145deg, ${deep} 0%, ${base} 100%)`,
  ];
  return {
    background: backgrounds[variant],
    figure: CAREER_FIGURES[seed % CAREER_FIGURES.length],
    scrim:
      "linear-gradient(to top, rgb(0 0 0 / 0.96) 0%, rgb(0 0 0 / 0.82) 30%, rgb(0 0 0 / 0.46) 58%, rgb(0 0 0 / 0.14) 78%, transparent 100%)",
    tagBackground: "rgb(0 0 0 / 0.24)",
  };
}

function getCareerLabels(field: RadarField) {
  const english = field.name_en
    ?.replace(/\s*\([^)]*[\u0E00-\u0E7F][^)]*\)\s*/g, " ")
    .trim();
  const thaiInParentheses = field.name_th?.match(/\(([^)]*[\u0E00-\u0E7F][^)]*)\)/)?.[1];
  const primary = english || thaiInParentheses || field.name_th || "Career path";
  const secondary = thaiInParentheses || field.name_th || field.slug;

  return {
    primary,
    secondary: secondary === primary ? field.slug : secondary,
  };
}

export function RadarPageClient({
  initialFields,
  initialCollections,
  initialError = null,
}: {
  initialFields: RadarField[];
  initialCollections: RadarCollection[];
  initialError?: string | null;
}) {
  const router = useRouter();
  const [fields, setFields] = useState<RadarField[]>(initialFields);
  const [collections, setCollections] =
    useState<RadarCollection[]>(initialCollections);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad] = useState(!initialFields.length);
  const [error, setError] = useState<string | null>(initialError);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { allLabel, filters: collectionFilters } = useMemo(
    () => normalizeRadarCollections(collections),
    [collections]
  );

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [fieldsData, collectionsData] = await Promise.all([
        getRadarFields(),
        getRadarCollections(),
      ]);
      setFields(fieldsData);
      setCollections(collectionsData);
      setActiveCollection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCollectionClick = useCallback((key: string | null) => {
    setActiveCollection(key);
    setError(null);
  }, []);

  const filteredFields = useMemo(
    () => filterRadarFields(fields, activeCollection, searchQuery),
    [fields, activeCollection, searchQuery]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-orange-600/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-200 mb-4">
            Career Radar
          </h1>
          <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl leading-relaxed">
            Explore career fields, discover what resonates, and find your
            direction. Swipe through cards to learn about each path.
          </p>
        </div>
      </div>

      <div className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="ค้นหาอาชีพ"
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>

            <div className="relative min-w-0 w-full sm:flex-1">
              <div
                ref={scrollRef}
                role="group"
                aria-label="กรองอาชีพ"
                className="radar-filter-chips flex min-w-0 gap-2 overflow-x-auto py-1 pr-8"
              >
              <button
                onClick={() => handleCollectionClick(null)}
                aria-pressed={activeCollection === null}
                className={`shrink-0 min-h-11 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  activeCollection === null
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10 hover:text-neutral-200"
                }`}
              >
                {allLabel}
              </button>
              {collectionFilters.map((col) => (
                <button
                  key={col.key}
                  onClick={() => handleCollectionClick(col.key)}
                  aria-pressed={activeCollection === col.key}
                  className={`shrink-0 min-h-11 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${
                    activeCollection === col.key
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10 hover:text-neutral-200"
                  }`}
                >
                  {col.label_th || col.label_en || col.key}
                </button>
              ))}
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-neutral-950 via-neutral-950/80 to-transparent" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8 pt-24 sm:px-6 lg:px-8">
        {isLoading && isInitialLoad ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl bg-white/5 border border-white/10 h-48"
              />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 mb-4">{error}</p>
            <Button
              variant="outline"
              onClick={loadData}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Try Again
            </Button>
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-400 text-lg">
              No fields found. Try a different filter or search term.
            </p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-4 transition-opacity duration-200 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 ${isLoading ? "pointer-events-none opacity-60" : ""}`}>
            {filteredFields.map((field) => (
              <FieldTile
                key={field.id}
                field={field}
                onClick={() => router.push(`/radar/${field.slug}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldTile({
  field,
  onClick,
}: {
  field: RadarField;
  onClick: () => void;
}) {
  const tileRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = tileRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in-view");
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const visual = getCareerCardVisual(field);
  const labels = getCareerLabels(field);
  const primaryLabel = labels.primary;
  const secondaryLabel = labels.secondary;
  const tags = field.tags?.slice(0, 2) || [];
  if (tags.length === 0) tags.push(field.tier || "radar");
  const titleSize =
    primaryLabel.length > 42
      ? "text-lg sm:text-xl"
      : primaryLabel.length > 28
        ? "text-xl sm:text-2xl"
        : "text-2xl sm:text-[1.75rem]";

  return (
    <button
      ref={tileRef}
      onClick={onClick}
      className="radar-career-card group relative isolate aspect-[4/5] w-full cursor-pointer overflow-visible rounded-lg border text-left shadow-[0_18px_50px_rgba(0,0,0,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 sm:aspect-[3/5]"
      style={{
        borderColor: "rgb(255 255 255 / 0.28)",
        background: visual.background,
        color: "#ffffff",
      }}
    >
      <span className="radar-career-card__grain" aria-hidden="true" />

      <span className="radar-career-card__figure" aria-hidden="true">
        <Image
          src={visual.figure}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 34vw, 25vw"
          className="object-contain object-center"
          draggable={false}
        />
      </span>

      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[62%]"
        style={{ background: visual.scrim }}
        aria-hidden="true"
      />

      <span
        className="absolute inset-x-0 bottom-0 z-30 block p-4 sm:p-5"
        style={{ textShadow: "0 2px 18px rgb(0 0 0 / 0.62)" }}
      >
        <span
          className={`block break-words font-heading font-semibold leading-[0.95] text-white ${titleSize}`}
        >
          {primaryLabel}
        </span>
        <span className="mt-1 block line-clamp-2 text-sm font-medium leading-tight opacity-90">
          {secondaryLabel}
        </span>
        <span className={`mt-3 grid gap-1.5 ${tags.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {tags.map((tag, index) => (
            <span
              key={`${tag}-${index}`}
              className="min-w-0 truncate rounded-md border px-2 py-1 text-center font-mono text-xs font-bold"
              style={{
                borderColor: "currentColor",
                backgroundColor: visual.tagBackground,
              }}
            >
              {tag}
            </span>
          ))}
        </span>
      </span>
    </button>
  );
}
