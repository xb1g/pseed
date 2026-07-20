import type { PlanningRegistry } from "./types";

export interface SeedPathlab {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  categoryName: string | null;
  totalDays: number | null;
}

/**
 * Maps a planning-registry career slug to keywords likely to appear in a
 * PathLab (seed) title or description. Seeds are created dynamically, so this
 * is a heuristic — unmatched seeds are never hidden, only sorted after
 * matched ones.
 */
const CAREER_SEED_KEYWORDS: Record<string, string[]> = {
  "ai-engineer": ["ai", "artificial intelligence", "machine learning", "ml", "neural"],
  "data-scientist": ["data", "analytics", "visualization", "statistics", "python"],
  "software-engineer": ["software", "web", "coding", "programming", "developer", "app"],
  "ux-designer": ["ux", "ui", "product design", "user research", "figma"],
  "product-manager": ["product", "roadmap", "startup", "mvp"],
  cybersecurity: ["security", "cyber", "hacking", "ctf"],
  "devops-sre": ["devops", "cloud", "infrastructure", "deploy"],
  "qa-engineer": ["qa", "testing", "automation test"],
  "it-support-sysadmin": ["it support", "sysadmin", "network"],
  accountant: ["accounting", "finance", "บัญชี"],
  "fashion-designer": ["fashion", "แฟชั่น", "clothing", "เสื้อผ้า"],
  "marketing-strategist": ["marketing", "brand", "seo", "ads", "การตลาด"],
  "marketing-specialist": ["marketing", "content", "social media", "การตลาด"],
  "mechanical-engineer": ["mechanical", "robotics", "cad", "engineering"],
  "medical-technologist": ["medical", "health", "lab", "การแพทย์"],
  model: ["model", "photography"],
  "graphic-designer": ["graphic", "design", "illustration", "ออกแบบ"],
  teacher: ["teaching", "education", "ครู", "tutor"],
  nurse: ["nursing", "care", "health", "พยาบาล"],
  "financial-analyst": ["finance", "investment", "stock", "การเงิน"],
  "content-writer": ["writing", "content", "storytelling", "เขียน"],
  journalist: ["journalism", "news", "ข่าว"],
  photographer: ["photo", "photography", "video", "ถ่าย"],
};

function keywordsForSlug(
  slug: string,
  registry: PlanningRegistry
): string[] {
  const keywords = new Set(CAREER_SEED_KEYWORDS[slug] ?? []);
  const item = registry[slug];
  if (item) {
    for (const word of item.titleEn.toLowerCase().split(/[\s/]+/)) {
      if (word.length >= 3) keywords.add(word);
    }
  }
  return Array.from(keywords);
}

function scoreSeed(seed: SeedPathlab, keywords: string[]): number {
  const haystack = `${seed.title} ${seed.description ?? ""}`.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (haystack.includes(keyword.toLowerCase())) score += 1;
  }
  return score;
}

/**
 * Orders seeds so PathLabs related to the student's selected interests come
 * first. When nothing matches (or nothing is selected), the original order is
 * preserved — matching only reorders, never filters out.
 */
export function matchSeedsToInterests(
  selectedSlugs: string[],
  seeds: SeedPathlab[],
  registry: PlanningRegistry
): SeedPathlab[] {
  if (!selectedSlugs.length || !seeds.length) return [...seeds];
  const keywords = Array.from(
    new Set(selectedSlugs.flatMap((slug) => keywordsForSlug(slug, registry)))
  );
  return seeds
    .map((seed, index) => ({ seed, index, score: scoreSeed(seed, keywords) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.seed);
}

export function isSeedMatched(
  seed: SeedPathlab,
  selectedSlugs: string[],
  registry: PlanningRegistry
): boolean {
  if (!selectedSlugs.length) return false;
  const keywords = Array.from(
    new Set(selectedSlugs.flatMap((slug) => keywordsForSlug(slug, registry)))
  );
  return scoreSeed(seed, keywords) > 0;
}
