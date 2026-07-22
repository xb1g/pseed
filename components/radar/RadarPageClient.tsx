"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getRadarFields, getRadarCollections } from "@/lib/supabase/radar";
import { normalizeRadarCollections } from "@/lib/radar/filters";
import type { Database } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type RadarField = Database["public"]["Tables"]["radar_fields"]["Row"];
type RadarCollection = Database["public"]["Tables"]["radar_collections"]["Row"];
type RadarCardStyle = CSSProperties & Record<`--radar-${string}`, string>;

const CAREER_FIGURES = [
  "/images/radar/jojo-dio-hirose.png",
  "/images/radar/jojo-full-body-blue.png",
  "/images/radar/jojo-full-body-dark.webp",
] as const;

const CAREER_SEARCH_TAGS = [
  {
    key: "technology",
    label: "Technology",
    keywords: [
      "technology",
      "tech",
      "software",
      "developer",
      "programmer",
      "computer",
      "data",
      "ai",
      "cyber",
      "security",
      "it",
      "digital",
      "stem",
      "engineering",
      "engineer",
      "mechanical",
      "เทคโนโลยี",
      "ซอฟต์แวร์",
      "คอมพิวเตอร์",
      "ข้อมูล",
      "ไซเบอร์",
      "วิศวกร",
    ],
  },
  {
    key: "business",
    label: "Business",
    keywords: [
      "business",
      "marketing",
      "market",
      "sales",
      "finance",
      "account",
      "accounting",
      "management",
      "strategy",
      "operations",
      "product manager",
      "entrepreneur",
      "ธุรกิจ",
      "การตลาด",
      "บัญชี",
      "การเงิน",
      "ผู้จัดการ",
    ],
  },
  {
    key: "law",
    label: "Law",
    keywords: ["law", "legal", "lawyer", "attorney", "compliance", "policy", "กฎหมาย", "ทนาย"],
  },
  {
    key: "art",
    label: "Art",
    keywords: [
      "art",
      "artist",
      "creative",
      "design",
      "designer",
      "fashion",
      "model",
      "modeling",
      "fashion model",
      "animation",
      "film",
      "media",
      "content",
      "music",
      "ศิลปะ",
      "สร้างสรรค์",
      "ออกแบบ",
      "แฟชั่น",
      "นางแบบ",
      "นายแบบ",
      "คอนเทนต์",
    ],
  },
  {
    key: "medical",
    label: "Medical",
    keywords: [
      "medical",
      "medicine",
      "health",
      "healthcare",
      "doctor",
      "nurse",
      "clinical",
      "hospital",
      "pharma",
      "biotech",
      "lab",
      "แพทย์",
      "สุขภาพ",
      "พยาบาล",
      "โรงพยาบาล",
      "คลินิก",
    ],
  },
  {
    key: "engineer",
    label: "Engineer",
    keywords: [
      "engineer",
      "engineering",
      "mechanical",
      "civil",
      "electrical",
      "industrial",
      "software engineer",
      "qa",
      "test engineer",
      "วิศวกร",
      "วิศวกรรม",
    ],
  },
] as const;

const CAREER_CARD_GRADIENT_TEMPLATES = [
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 88% 6%, #fff4bf 0%, transparent 42%), linear-gradient(180deg, #f2cdb7 0%, #d39a6d 72%, #8a5c37 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 86% 100%, #a7ac63 0%, transparent 38%), radial-gradient(circle at 78% 0%, #1b3f9e 0%, transparent 44%), linear-gradient(180deg, #172a35 0%, #07142f 54%, #33431f 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 12% 12%, #ca0b4d 0%, transparent 36%), radial-gradient(circle at 88% 18%, #ffd3e9 0%, transparent 40%), linear-gradient(180deg, #c50d58 0%, #f2d5ff 46%, #e4bfff 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 92% 14%, #fff36a 0%, transparent 40%), linear-gradient(180deg, #e8932a 0%, #ffc900 74%, #f5b300 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 86% 14%, #9a8467 0%, transparent 38%), radial-gradient(circle at 45% 90%, #ffe0bd 0%, transparent 38%), linear-gradient(180deg, #15130f 0%, #39342c 56%, #17120d 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 86% 4%, #b6ddb6 0%, transparent 42%), radial-gradient(circle at 12% 34%, #0586c8 0%, transparent 42%), linear-gradient(145deg, #0088d0 0%, #a8dcb5 54%, #ffffb8 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 72% 44%, #fa62ff 0%, transparent 38%), radial-gradient(circle at 10% 10%, #057f82 0%, transparent 42%), linear-gradient(180deg, #192f60 0%, #7253d7 64%, #403c8f 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 76% 64%, #4b4a1d 0%, transparent 36%), linear-gradient(180deg, #121311 0%, #0b0d0c 58%, #1d2111 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 76% 0%, #fff 0%, transparent 38%), linear-gradient(160deg, #d6c2ff 0%, #edf5ff 52%, #aae9f5 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 20% 10%, #fff4e2 0%, transparent 36%), radial-gradient(circle at 76% 28%, #b06a00 0%, transparent 34%), linear-gradient(150deg, #fff2bd 0%, #ffd05e 58%, #ffb07c 100%)",
  },
  {
    ink: "dark",
    background:
      "linear-gradient(180deg, #ffe69a 0%, #ffd46f 54%, #edbd54 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 16% 14%, #b9b620 0%, transparent 36%), radial-gradient(circle at 80% 34%, #ae276c 0%, transparent 42%), linear-gradient(150deg, #bb9a1c 0%, #b91466 58%, #ba5f46 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 18% 18%, #f0dbff 0%, transparent 36%), radial-gradient(circle at 62% 52%, #ef006b 0%, transparent 46%), linear-gradient(180deg, #f4c9ff 0%, #ff91bd 62%, #f0b19c 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 76% 80%, #a7a7aa 0%, transparent 36%), radial-gradient(circle at 20% 8%, #4b2d72 0%, transparent 42%), linear-gradient(150deg, #4c2e70 0%, #0b1f4d 48%, #6d5048 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 74% 70%, #916e42 0%, transparent 36%), linear-gradient(180deg, #0d0d0c 0%, #111111 62%, #2c2114 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 24% 18%, #ffe0c8 0%, transparent 36%), linear-gradient(180deg, #ffc9c4 0%, #ffd5b4 48%, #c64ec1 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 14% 20%, #d6bfff 0%, transparent 42%), radial-gradient(circle at 80% 60%, #67c49a 0%, transparent 42%), linear-gradient(180deg, #b8d5ff 0%, #c9b9ff 46%, #7bd2b9 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 84% 6%, #1fc966 0%, transparent 42%), linear-gradient(180deg, #9ef7c8 0%, #b5f7e5 56%, #80e4bd 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 22% 82%, #c76720 0%, transparent 42%), linear-gradient(180deg, #0e1018 0%, #0e1118 48%, #bc5209 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 86% 78%, #e6dbff 0%, transparent 38%), linear-gradient(180deg, #2e75e9 0%, #0048c8 56%, #7960d4 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 78% 86%, #fff4b7 0%, transparent 38%), linear-gradient(180deg, #f4c756 0%, #bc9b00 54%, #fff0a2 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 80% 8%, #d5e0ff 0%, transparent 36%), linear-gradient(180deg, #c44394 0%, #a007bc 54%, #6579ef 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 82% 26%, #d08800 0%, transparent 44%), radial-gradient(circle at 72% 84%, #ffdbba 0%, transparent 38%), linear-gradient(180deg, #ea593d 0%, #d17a00 52%, #ffb082 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 10% 90%, #eef1b7 0%, transparent 34%), linear-gradient(180deg, #f9ffff 0%, #eaffff 56%, #87e6f4 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 16% 52%, #fff 0%, transparent 42%), radial-gradient(circle at 82% 10%, #ff291b 0%, transparent 36%), linear-gradient(180deg, #ec6e24 0%, #fff8e4 50%, #e1c41f 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 18% 58%, #ffe9c8 0%, transparent 38%), linear-gradient(180deg, #26300a 0%, #4f5200 58%, #b48f00 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 78% 22%, #c7c14a 0%, transparent 36%), linear-gradient(180deg, #e7fff6 0%, #c2f3ff 56%, #9ed0ef 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 18% 8%, #bd9b00 0%, transparent 36%), radial-gradient(circle at 86% 6%, #2dbb63 0%, transparent 42%), linear-gradient(180deg, #23984f 0%, #3fd783 58%, #34c9a9 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 20% 10%, #fff7df 0%, transparent 34%), radial-gradient(circle at 72% 18%, #a6a600 0%, transparent 44%), linear-gradient(180deg, #a58b00 0%, #edff31 58%, #f3df16 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 50% 45%, #e8f5ff 0%, transparent 44%), linear-gradient(180deg, #39475c 0%, #262b38 50%, #eef8ff 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 76% 18%, #276bb7 0%, transparent 40%), radial-gradient(circle at 78% 72%, #f7ef5d 0%, transparent 38%), linear-gradient(180deg, #dcefff 0%, #3f6f8d 44%, #e4ef48 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 68% 16%, #7e91ff 0%, transparent 42%), linear-gradient(180deg, #223fbd 0%, #141a5c 50%, #090909 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 34% 20%, #f7bdd5 0%, transparent 40%), linear-gradient(180deg, #e99db5 0%, #f4b1c8 58%, #e98585 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 88% 20%, #d95618 0%, transparent 42%), linear-gradient(180deg, #ee7040 0%, #ff933a 52%, #ffc400 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 12% 12%, #fffde8 0%, transparent 40%), linear-gradient(180deg, #fff4a1 0%, #fff149 56%, #9ec044 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 78% 38%, #fff8d8 0%, transparent 40%), radial-gradient(circle at 18% 0%, #ffe700 0%, transparent 34%), linear-gradient(180deg, #d7e9d2 0%, #fff6a7 55%, #c8d09d 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 72% 42%, #ffb56a 0%, transparent 42%), linear-gradient(180deg, #e76c69 0%, #fa8d5e 54%, #ba5b83 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 82% 88%, #c28c73 0%, transparent 40%), linear-gradient(180deg, #7c554b 0%, #251e1a 52%, #5e4033 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 44% 18%, #b569ff 0%, transparent 36%), linear-gradient(180deg, #b27cff 0%, #1762d8 54%, #4697ff 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 14% 8%, #b58d00 0%, transparent 38%), radial-gradient(circle at 84% 20%, #bf4a2e 0%, transparent 42%), linear-gradient(180deg, #c18400 0%, #b40050 58%, #b00445 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 42% 50%, #c7f7ff 0%, transparent 36%), linear-gradient(180deg, #e00078 0%, #d90073 50%, #b646aa 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 14% 20%, #d3b8ff 0%, transparent 40%), radial-gradient(circle at 82% 54%, #63c5a9 0%, transparent 40%), linear-gradient(180deg, #c4d6f9 0%, #d6c8ff 48%, #e9f5ff 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 38% 8%, #ad12c5 0%, transparent 36%), linear-gradient(180deg, #c240d7 0%, #c8c7ff 52%, #9ea6f6 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 82% 66%, #273b9c 0%, transparent 36%), linear-gradient(180deg, #8ad9d7 0%, #a2e1cf 50%, #6e88ce 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 20% 34%, #fff2d8 0%, transparent 36%), radial-gradient(circle at 76% 20%, #b50c47 0%, transparent 40%), linear-gradient(180deg, #c31b52 0%, #ffe5fa 52%, #fa321e 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 18% 30%, #d31aba 0%, transparent 42%), radial-gradient(circle at 80% 74%, #ffbe28 0%, transparent 42%), linear-gradient(180deg, #d420ae 0%, #ff649a 52%, #ffbd27 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 48% 28%, #fff200 0%, transparent 38%), linear-gradient(150deg, #00449e 0%, #2e80d5 54%, #0b5fa0 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 78% 76%, #fff5bf 0%, transparent 40%), linear-gradient(180deg, #bff7d2 0%, #d9ffe3 52%, #a3a500 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 74% 32%, #b400a8 0%, transparent 42%), linear-gradient(180deg, #ffc8b7 0%, #b4009a 54%, #c68aa5 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 70% 12%, #d979ff 0%, transparent 42%), radial-gradient(circle at 52% 82%, #0c1778 0%, transparent 42%), linear-gradient(180deg, #e66fff 0%, #7e31d6 50%, #12166d 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 28% 10%, #65e681 0%, transparent 38%), radial-gradient(circle at 42% 58%, #083bb4 0%, transparent 44%), linear-gradient(180deg, #31d06a 0%, #043fc5 54%, #53cf6f 100%)",
  },
  {
    ink: "dark",
    background:
      "radial-gradient(circle at 58% 18%, #fff8d7 0%, transparent 44%), linear-gradient(180deg, #ffd19b 0%, #ffc480 58%, #f6a998 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 72% 26%, #786cff 0%, transparent 42%), linear-gradient(180deg, #bd252b 0%, #8f2535 48%, #1c43ff 100%)",
  },
  {
    ink: "light",
    background:
      "radial-gradient(circle at 24% 42%, #e5e180 0%, transparent 38%), radial-gradient(circle at 80% 90%, #d5dde5 0%, transparent 36%), linear-gradient(180deg, #45472f 0%, #111c25 55%, #8d9699 100%)",
  },
] as const;

function stableHash(value: string) {
  return Array.from(value).reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    0
  );
}

export function getCareerCardVisual(field: RadarField) {
  const seed = stableHash(field.slug || field.id);
  const template =
    CAREER_CARD_GRADIENT_TEMPLATES[
      (seed + (seed >>> 8) + (seed >>> 17)) %
        CAREER_CARD_GRADIENT_TEMPLATES.length
    ];
  const dotStyle = {
    "--radar-dot-a-x": `${seed % 13}px`,
    "--radar-dot-a-y": `${(seed >>> 4) % 17}px`,
    "--radar-dot-b-x": `${3 + ((seed >>> 8) % 15)}px`,
    "--radar-dot-b-y": `${2 + ((seed >>> 12) % 19)}px`,
    "--radar-dot-a-size": `${7 + (seed % 4)}px`,
    "--radar-dot-b-size": `${9 + ((seed >>> 5) % 5)}px`,
    "--radar-dot-glow-x": `${18 + ((seed >>> 10) % 66)}%`,
    "--radar-dot-glow-y": `${6 + ((seed >>> 16) % 30)}%`,
    "--radar-grain-x": `${(seed >>> 20) % 160}px`,
    "--radar-grain-y": `${(seed >>> 24) % 160}px`,
  } satisfies Record<`--radar-${string}`, string>;

  return {
    background: template.background,
    dotStyle,
    figure: CAREER_FIGURES[seed % CAREER_FIGURES.length],
    scrim:
      "linear-gradient(to top, rgb(0 0 0 / 0.92) 0%, rgb(0 0 0 / 0.74) 28%, rgb(0 0 0 / 0.38) 56%, rgb(0 0 0 / 0.08) 78%, transparent 100%)",
    tagBackground: "rgb(0 0 0 / 0.18)",
    textColor: "#ffffff",
    textShadow: "0 2px 18px rgb(0 0 0 / 0.68)",
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

function getCareerSearchText(field: RadarField) {
  return [
    field.slug,
    field.name_en,
    field.name_th,
    field.tagline_en,
    field.tagline_th,
    ...(field.tags || []),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLocaleLowerCase();
}

function normalizeCareerKeywordText(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/[^a-z0-9\u0E00-\u0E7F]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasThaiText(value: string) {
  return /[\u0E00-\u0E7F]/.test(value);
}

function matchesCareerKeyword(searchText: string, keyword: string) {
  const normalizedKeyword = normalizeCareerKeywordText(keyword);
  if (!normalizedKeyword) return false;

  if (hasThaiText(normalizedKeyword)) {
    return searchText.includes(normalizedKeyword);
  }

  return ` ${normalizeCareerKeywordText(searchText)} `.includes(` ${normalizedKeyword} `);
}

function getCareerSearchTags(field: RadarField) {
  const searchText = getCareerSearchText(field);
  return CAREER_SEARCH_TAGS.filter((tag) =>
    tag.keywords.some((keyword) => matchesCareerKeyword(searchText, keyword))
  );
}

function filterFieldsByCareerTags(
  fields: RadarField[],
  activeTag: string | null,
  searchQuery: string
) {
  const query = searchQuery.trim().toLocaleLowerCase();

  return fields.filter((field) => {
    const searchTags = getCareerSearchTags(field);
    if (activeTag && !searchTags.some((tag) => tag.key === activeTag)) return false;
    if (!query) return true;

    return (
      getCareerSearchText(field).includes(query) ||
      searchTags.some((tag) => tag.label.toLocaleLowerCase().includes(query))
    );
  });
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
  const pageRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardGridRef = useRef<HTMLDivElement>(null);
  const { allLabel } = useMemo(
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
    () => filterFieldsByCareerTags(fields, activeCollection, searchQuery),
    [fields, activeCollection, searchQuery]
  );
  const fieldBatches = useMemo(() => {
    const batches: RadarField[][] = [];
    for (let index = 0; index < filteredFields.length; index += 12) {
      batches.push(filteredFields.slice(index, index + 12));
    }
    return batches;
  }, [filteredFields]);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const isSafari =
      navigator.vendor.includes("Apple") &&
      !/(CriOS|FxiOS|EdgiOS|OPiOS)/.test(navigator.userAgent);
    if (!isSafari) return;

    page.classList.add("radar-index-page--safari");
    return () => {
      page.classList.remove("radar-index-page--safari");
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const grid = cardGridRef.current;
    if (!grid) return;

    const touchQuery = window.matchMedia("(hover: none)");
    if (!touchQuery.matches) return;

    const cards = Array.from(
      grid.querySelectorAll<HTMLElement>(".radar-career-card")
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("in-view", entry.isIntersecting);
          if (entry.isIntersecting) {
            const href = (entry.target as HTMLElement).dataset.radarHref;
            if (href) router.prefetch(href);
          }
        });
      },
      {
        rootMargin: "-38% 0px -38% 0px",
        threshold: 0,
      }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [filteredFields, router]);

  return (
    <div ref={pageRef} className="radar-index-page min-h-screen">
      <div className="radar-index-hero relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 md:pt-20 md:pb-10">
          <div className="mb-6 flex flex-wrap gap-2">
            <Link href="/radar" className="faculty-radar-mode faculty-radar-mode--active">
              Career Radar
            </Link>
            <Link href="/faculty-radar" className="faculty-radar-mode">
              Faculty Gallery
            </Link>
          </div>
          <h1 className="mb-4 font-radar-title text-5xl font-normal leading-none tracking-normal text-white sm:text-6xl md:text-7xl lg:text-8xl">
            Career Radar
          </h1>
          <p className="max-w-2xl font-radar-thai text-lg font-medium leading-relaxed text-white/85 sm:text-xl md:text-2xl">
            สำรวจสายอาชีพ ค้นหาสิ่งที่ใช่ และมองเห็นทิศทางของตัวเอง
            เลื่อนดูการ์ดเพื่อทำความรู้จักแต่ละเส้นทาง
          </p>
        </div>
      </div>

      <div className="radar-filter-shell relative z-30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="ค้นหาอาชีพ"
                className="pl-10 border-white/[0.12] bg-white/[0.06] text-white placeholder:text-white/40 focus:border-emerald-300/50 focus:ring-emerald-300/20"
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
                  className={`shrink-0 min-h-11 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70 ${
                    activeCollection === null
                      ? "border border-emerald-200/[0.36] bg-emerald-200/[0.16] text-emerald-50"
                      : "border border-white/10 bg-white/5 text-white/[0.62] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {allLabel}
                </button>
                {CAREER_SEARCH_TAGS.map((tag) => (
                  <button
                    key={tag.key}
                    onClick={() => handleCollectionClick(tag.key)}
                    aria-pressed={activeCollection === tag.key}
                    className={`shrink-0 min-h-11 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/70 ${
                      activeCollection === tag.key
                        ? "border border-emerald-200/[0.36] bg-emerald-200/[0.16] text-emerald-50"
                        : "border border-white/10 bg-white/5 text-white/[0.62] hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="radar-card-stage">
        <div className="max-w-7xl mx-auto px-4 pb-8 pt-8 sm:px-6 lg:px-8">
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
            <div
              ref={cardGridRef}
              className={`radar-career-batches flex flex-col gap-4 transition-opacity duration-200 ${isLoading ? "pointer-events-none opacity-60" : ""}`}
            >
              {fieldBatches.map((batch, batchIndex) => (
                <div
                  key={batch[0]?.id ?? batchIndex}
                  className="radar-career-batch"
                >
                  <div className="radar-career-grid">
                    {batch.map((field) => (
                      <FieldTile key={field.id} field={field} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const FieldTile = memo(function FieldTile({ field }: { field: RadarField }) {
  const visual = getCareerCardVisual(field);
  const labels = getCareerLabels(field);
  const primaryLabel = labels.primary;
  const secondaryLabel = labels.secondary;
  const tags: string[] = getCareerSearchTags(field)
    .map((tag) => tag.label)
    .slice(0, 2);
  if (tags.length === 0) tags.push("Career");
  const titleSize =
    primaryLabel.length > 42
      ? "text-lg sm:text-xl"
      : primaryLabel.length > 28
        ? "text-xl sm:text-2xl"
        : "text-2xl sm:text-[1.75rem]";
  const cardStyle: RadarCardStyle = {
    background: visual.background,
    color: visual.textColor,
    ...visual.dotStyle,
  };

  return (
    <Link
      href={`/radar/${field.slug}`}
      prefetch={false}
      data-radar-href={`/radar/${field.slug}`}
      className="radar-career-card group relative isolate block aspect-[4/5] w-full cursor-pointer overflow-visible rounded-lg text-left shadow-[0_18px_50px_rgba(0,0,0,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 sm:aspect-[3/5]"
      style={cardStyle}
    >
      <span className="radar-career-card__grain" aria-hidden="true" />

      <span className="radar-career-card__figure" aria-hidden="true">
        <Image
          src={visual.figure}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 34vw, 25vw"
          loading="lazy"
          quality={72}
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
        className="absolute inset-x-0 bottom-0 z-[110] block p-4 sm:p-5"
        style={{ textShadow: visual.textShadow }}
      >
        <span
          className={`block break-words font-radar-title font-normal leading-[0.9] ${titleSize}`}
        >
          {primaryLabel}
        </span>
        <span className="mt-1 block line-clamp-2 font-radar-thai text-sm font-semibold leading-tight opacity-90">
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
    </Link>
  );
});
