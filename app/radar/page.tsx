"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getRadarFields,
  getRadarCollections,
} from "@/lib/supabase/radar";
import type { Database } from "@/lib/supabase/database.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";

type RadarField = Database["public"]["Tables"]["radar_fields"]["Row"];
type RadarCollection = Database["public"]["Tables"]["radar_collections"]["Row"];

export default function RadarPage() {
  const router = useRouter();
  const [fields, setFields] = useState<RadarField[]>([]);
  const [collections, setCollections] = useState<RadarCollection[]>([]);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCollectionClick = useCallback(
    async (key: string | null) => {
      setActiveCollection(key);
      setIsLoading(true);
      try {
        const data = await getRadarFields(
          key ? { collectionTag: key } : undefined
        );
        setFields(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to filter fields");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRadarFields(
        searchQuery.trim() ? { search: searchQuery.trim() } : undefined
      );
      setFields(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  const filteredFields = fields;

  // Masonry: split into 2 columns for mobile, 3 for md, 4 for lg
  const getColumns = () => {
    const cols: RadarField[][] = [[], [], [], []];
    filteredFields.forEach((field, i) => {
      cols[i % 4].push(field);
    });
    return cols;
  };

  const columns = getColumns();

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
      {/* Hero */}
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

      {/* Filters */}
      <div className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-neutral-500 focus:border-blue-500/50 focus:ring-blue-500/20"
              />
            </div>

            {/* Collection chips */}
            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide w-full sm:w-auto"
            >
              <button
                onClick={() => handleCollectionClick(null)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCollection === null
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10 hover:text-neutral-200"
                }`}
              >
                All
              </button>
              {collections.map((col) => (
                <button
                  key={col.key}
                  onClick={() => handleCollectionClick(col.key)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeCollection === col.key
                      ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      : "bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10 hover:text-neutral-200"
                  }`}
                >
                  {col.label_th || col.label_en || col.key}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
            {columns.map((col, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-4">
                {col.map((field) => (
                  <FieldTile
                    key={field.id}
                    field={field}
                    onClick={() => router.push(`/radar/${field.slug}`)}
                  />
                ))}
              </div>
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
  const tileRef = useRef<HTMLDivElement>(null);

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

  const bgColor = field.color || "#3b82f6";
  const isLarge = field.tile_size === "large";

  return (
    <div
      ref={tileRef}
      onClick={onClick}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:shadow-lg ${
        isLarge ? "row-span-2 min-h-[280px]" : "min-h-[140px]"
      }`}
      style={{
        background: `linear-gradient(135deg, ${bgColor}15 0%, ${bgColor}08 100%)`,
      }}
    >
      {/* Glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 100%, ${bgColor}30 0%, transparent 70%)`,
        }}
      />

      <div className="relative p-5 flex flex-col h-full">
        {/* Emoji */}
        <div className="text-3xl mb-3">{field.emoji}</div>

        {/* Name */}
        <h3 className="text-white font-bold text-base sm:text-lg leading-tight mb-2">
          {field.name_th || field.name_en}
        </h3>

        {/* Tagline */}
        {field.tagline_th && (
          <p className="text-neutral-400 text-sm leading-relaxed mb-3 line-clamp-2">
            {field.tagline_th}
          </p>
        )}

        {/* Tags */}
        {field.tags && field.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {field.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] border-white/10 text-neutral-400 bg-white/5 px-2 py-0.5"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Arrow */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ArrowRight className="h-4 w-4 text-white/60" />
        </div>
      </div>
    </div>
  );
}
