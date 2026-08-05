# Youth Talent Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public, Dusk-themed `/talent` page that showcases pre-vetted student builders for founders attending tomorrow's meeting.

**Architecture:** Supabase table `talent_profiles` stores student data (seeded from CSV). Server component fetches all profiles. Client component handles track filtering and renders a responsive card grid. Dusk atmospheric background reuses existing keyframe animations from `globals.css`.

**Tech Stack:** Next.js 15 App Router, Supabase (anon read), TailwindCSS, Lucide icons

## Global Constraints

- Dusk theme only — use `--dusk-*` CSS tokens and `.ei-card` class from `globals.css`
- Thai text uses Bai Jamjuree / Kodchasan fonts
- No auth required — public page
- LINE ID and phone are private — never rendered on the page
- Migration must be additive and idempotent (`IF NOT EXISTS`)
- Use `getAll()`/`setAll()` cookie pattern from `utils/supabase/server.ts`

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260804000000_create_talent_profiles.sql`

**Interfaces:**
- Consumes: nothing
- Produces: `talent_profiles` table accessible via Supabase anon key (SELECT only)

- [ ] **Step 1: Create the migration file**

```sql
-- Create talent_profiles table for the Youth Talent showcase
CREATE TABLE IF NOT EXISTS talent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  nickname text NOT NULL,
  age smallint,
  school text,
  line_id text,
  phone text,
  track text NOT NULL CHECK (track IN ('dev', 'video', 'strategy', 'design')),
  tools text[] DEFAULT '{}',
  portfolio_links text[] DEFAULT '{}',
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE talent_profiles ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "talent_profiles_anon_select"
  ON talent_profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);
```

- [ ] **Step 2: Push migration to production**

Run: `supabase db push`
Expected: Migration applied successfully, table created.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260804000000_create_talent_profiles.sql
git commit -m "feat(talent): create talent_profiles table with anon read RLS"
```

---

### Task 2: CSV Seed Script

**Files:**
- Create: `scripts/seed-talent.mjs`

**Interfaces:**
- Consumes: `talent_profiles` table from Task 1
- Produces: Rows in `talent_profiles` seeded from CSV

- [ ] **Step 1: Create the seed script**

```javascript
#!/usr/bin/env node
/**
 * Seed talent_profiles from a CSV export.
 *
 * Usage:
 *   node scripts/seed-talent.mjs "/path/to/responses.csv"
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("Usage: node scripts/seed-talent.mjs <csv-path>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

// ── Parse CSV ──
const raw = readFileSync(csvPath, "utf-8");
const lines = raw.split("\n").filter((l) => l.trim());
const headers = parseCSVLine(lines[0]);
const rows = lines.slice(1).map((line) => {
  const values = parseCSVLine(line);
  const obj = {};
  headers.forEach((h, i) => (obj[h] = values[i] ?? ""));
  return obj;
});

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// ── Map track values ──
function normalizeTrack(raw) {
  const lower = raw.toLowerCase();
  if (lower.includes("hacking") || lower.includes("developer") || lower.includes("next.js")) return "dev";
  if (lower.includes("video") || lower.includes("editor")) return "video";
  if (lower.includes("strategy") || lower.includes("business") || lower.includes("growth")) return "strategy";
  if (lower.includes("design")) return "design";
  return "dev"; // fallback
}

// ── Parse tools ──
function parseTools(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// ── Parse portfolio links ──
function parseLinks(raw) {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((l) => l.trim())
    .filter((l) => l.startsWith("http"));
}

// ── Upsert ──
const profiles = rows.map((r) => ({
  full_name: r["Full Name (ชื่อ-นามสกุล)"] || "",
  nickname: r["Nickname (ชื่อเล่น)"] || "",
  age: parseInt(r["Age (อายุ)"], 10) || null,
  school: r["School / University (สถานศึกษา & ชั้นปี)"] || null,
  line_id: r["LINE ID"] || null,
  phone: r["Phone Number (เบอร์โทรศัพท์)"] || null,
  track: normalizeTrack(r["Primary Skill Track (สายงานหลักที่ถนัด)"] || ""),
  tools: parseTools(r["Tools & Frameworks (เครื่องมือที่ใช้เป็นประจำ)"]),
  portfolio_links: parseLinks(r["Portfolio / GitHub / TikTok Links"]),
  verified: false,
}));

console.log(`Parsed ${profiles.length} profiles:`);
profiles.forEach((p) => console.log(`  ${p.nickname} (${p.track}) — ${p.tools.join(", ")}`));

const { data, error } = await supabase
  .from("talent_profiles")
  .upsert(profiles, { onConflict: "full_name,nickname", ignoreDuplicates: false });

if (error) {
  console.error("Upsert failed:", error.message);
  process.exit(1);
}

console.log(`Seeded ${profiles.length} talent profiles.`);
```

- [ ] **Step 2: Run the seed script**

Run: `node scripts/seed-talent.mjs "/Users/pine/Downloads/Youth Talent Platform Registration Responses.csv"`
Expected: "Seeded 4 talent profiles."

Note: If upsert on `full_name,nickname` fails because there's no unique constraint, add one first:
```sql
ALTER TABLE talent_profiles ADD CONSTRAINT talent_profiles_name_uq UNIQUE (full_name, nickname);
```
Add this to the migration file and re-push before running the seed.

- [ ] **Step 3: Commit**

```bash
git add scripts/seed-talent.mjs
git commit -m "feat(talent): add CSV seed script for talent_profiles"
```

---

### Task 3: Supabase Data Fetching

**Files:**
- Create: `lib/talent.ts`

**Interfaces:**
- Consumes: `talent_profiles` table
- Produces: `getTalentProfiles(): Promise<TalentProfile[]>` and `TalentProfile` type

- [ ] **Step 1: Create the data layer**

```typescript
import { createClient } from "@/utils/supabase/server";

export interface TalentProfile {
  id: string;
  full_name: string;
  nickname: string;
  age: number | null;
  school: string | null;
  track: "dev" | "video" | "strategy" | "design";
  tools: string[];
  portfolio_links: string[];
  verified: boolean;
}

/** Fetch all talent profiles, ordered by created_at desc. */
export async function getTalentProfiles(): Promise<TalentProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_profiles")
    .select("id, full_name, nickname, age, school, track, tools, portfolio_links, verified")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch talent profiles:", error.message);
    return [];
  }

  return (data ?? []) as TalentProfile[];
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/talent.ts
git commit -m "feat(talent): add getTalentProfiles data layer"
```

---

### Task 4: TalentCard Component

**Files:**
- Create: `components/talent/TalentCard.tsx`

**Interfaces:**
- Consumes: `TalentProfile` type from `lib/talent.ts`
- Produces: `<TalentCard profile={...} />` component

- [ ] **Step 1: Create the TalentCard component**

```tsx
import { Github, Linkedin, Globe, ExternalLink, CheckCircle2 } from "lucide-react";
import type { TalentProfile } from "@/lib/talent";

const TRACK_STYLE: Record<TalentProfile["track"], { label: string; classes: string }> = {
  dev: { label: "Developer", classes: "bg-blue-500/20 text-blue-300 ring-blue-500/30" },
  video: { label: "Video Editor", classes: "bg-pink-500/20 text-pink-300 ring-pink-500/30" },
  strategy: { label: "Strategy", classes: "bg-amber-500/20 text-amber-300 ring-amber-500/30" },
  design: { label: "Designer", classes: "bg-purple-500/20 text-purple-300 ring-purple-500/30" },
};

function linkIcon(url: string) {
  if (url.includes("github.com")) return <Github className="h-4 w-4" />;
  if (url.includes("linkedin.com")) return <Linkedin className="h-4 w-4" />;
  if (url.includes("tiktok.com"))
    return <span className="text-xs font-bold leading-none">TT</span>;
  return <Globe className="h-4 w-4" />;
}

function linkLabel(url: string) {
  if (url.includes("github.com")) return "GitHub";
  if (url.includes("linkedin.com")) return "LinkedIn";
  if (url.includes("tiktok.com")) return "TikTok";
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Link";
  }
}

export function TalentCard({ profile }: { profile: TalentProfile }) {
  const track = TRACK_STYLE[profile.track];

  return (
    <div className="ei-card flex flex-col gap-4 p-5">
      {/* Header: name + verified */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-xl font-bold text-white">{profile.nickname}</h3>
          <p className="text-sm text-slate-400">{profile.full_name}</p>
        </div>
        {profile.verified && (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-amber-400" />
        )}
      </div>

      {/* Track badge */}
      <span
        className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${track.classes}`}
      >
        {track.label}
      </span>

      {/* Age + school */}
      {(profile.age || profile.school) && (
        <p className="text-sm text-slate-400">
          {profile.age ? `${profile.age} yrs` : ""}
          {profile.age && profile.school ? " · " : ""}
          {profile.school ?? ""}
        </p>
      )}

      {/* Tools */}
      {profile.tools.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {profile.tools.map((tool) => (
            <span
              key={tool}
              className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-slate-300 ring-1 ring-white/10"
            >
              {tool}
            </span>
          ))}
        </div>
      )}

      {/* Portfolio links */}
      {profile.portfolio_links.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-2 border-t border-white/8 pt-3">
          {profile.portfolio_links.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1 text-xs text-slate-300 ring-1 ring-white/10 transition-colors duration-150 hover:bg-white/10 hover:text-white"
            >
              {linkIcon(url)}
              {linkLabel(url)}
              <ExternalLink className="h-3 w-3 opacity-40" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/talent/TalentCard.tsx
git commit -m "feat(talent): add TalentCard component with track badges and portfolio links"
```

---

### Task 5: TalentGrid Component (Client, with Filters)

**Files:**
- Create: `components/talent/TalentGrid.tsx`

**Interfaces:**
- Consumes: `TalentProfile` from `lib/talent.ts`, `<TalentCard />` from Task 4
- Produces: `<TalentGrid profiles={...} />` — client component with track filter pills

- [ ] **Step 1: Create the TalentGrid component**

```tsx
"use client";

import { useState } from "react";
import type { TalentProfile } from "@/lib/talent";
import { TalentCard } from "./TalentCard";

const TRACKS = [
  { key: "all", label: "All" },
  { key: "dev", label: "Developer", classes: "bg-blue-500/20 text-blue-300 ring-blue-500/30" },
  { key: "video", label: "Video", classes: "bg-pink-500/20 text-pink-300 ring-pink-500/30" },
  { key: "strategy", label: "Strategy", classes: "bg-amber-500/20 text-amber-300 ring-amber-500/30" },
  { key: "design", label: "Design", classes: "bg-purple-500/20 text-purple-300 ring-purple-500/30" },
] as const;

export function TalentGrid({ profiles }: { profiles: TalentProfile[] }) {
  const [activeTrack, setActiveTrack] = useState<string>("all");

  const filtered =
    activeTrack === "all"
      ? profiles
      : profiles.filter((p) => p.track === activeTrack);

  return (
    <div className="flex flex-col gap-8">
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {TRACKS.map((t) => {
          const isActive = activeTrack === t.key;
          const count =
            t.key === "all"
              ? profiles.length
              : profiles.filter((p) => p.track === t.key).length;

          return (
            <button
              key={t.key}
              onClick={() => setActiveTrack(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 transition-all duration-150 ${
                isActive
                  ? t.key === "all"
                    ? "bg-white/15 text-white ring-white/30"
                    : `${t.classes} ring-current`
                  : "bg-white/5 text-slate-400 ring-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((profile) => (
          <TalentCard key={profile.id} profile={profile} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-slate-500">
          No builders in this track yet.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/talent/TalentGrid.tsx
git commit -m "feat(talent): add TalentGrid with track filter pills"
```

---

### Task 6: Talent Page (Server Component + Dusk Scene)

**Files:**
- Create: `app/talent/page.tsx`

**Interfaces:**
- Consumes: `getTalentProfiles()` from `lib/talent.ts`, `<TalentGrid />` from Task 5
- Produces: Public page at `/talent`

- [ ] **Step 1: Create the page**

```tsx
import { getTalentProfiles } from "@/lib/talent";
import { TalentGrid } from "@/components/talent/TalentGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Youth Talent — Pre-Vetted Thai Builders",
  description:
    "Access skilled Gen-Z creators and developers for high-impact, 48-hour turnaround projects.",
};

// Rising embers — fixed layout so they don't re-randomise on re-render
const EMBERS = [
  { left: "8%", bottom: "12%", delay: "0s", dur: "6.5s" },
  { left: "18%", bottom: "8%", delay: "1.4s", dur: "8s" },
  { left: "29%", bottom: "15%", delay: "0.6s", dur: "7s" },
  { left: "41%", bottom: "5%", delay: "2.3s", dur: "5.8s" },
  { left: "53%", bottom: "18%", delay: "0.9s", dur: "7.5s" },
  { left: "63%", bottom: "10%", delay: "1.8s", dur: "6s" },
  { left: "74%", bottom: "14%", delay: "3.1s", dur: "5.2s" },
  { left: "83%", bottom: "7%", delay: "0.3s", dur: "8.5s" },
] as const;

export default async function TalentPage() {
  const profiles = await getTalentProfiles();

  const trackCounts = {
    total: profiles.length,
    tracks: new Set(profiles.map((p) => p.track)).size,
  };

  return (
    <div className="relative min-h-screen text-white">
      {/* ── Dusk atmospheric background (fixed) ── */}
      <div className="fixed inset-0 -z-10" aria-hidden>
        {/* Base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, #06000f 0%, #1a0336 28%, #3b0764 58%, #4a1230 82%, #2a0818 100%)",
          }}
        />

        {/* Cloud A — amber, top-left */}
        <div
          style={{
            position: "absolute",
            top: "-5%",
            left: "-10%",
            width: 640,
            height: 640,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(251,146,60,0.38) 0%, rgba(234,88,12,0.18) 45%, transparent 70%)",
            filter: "blur(72px)",
            animation: "dusk-cloud-a 14s ease-in-out infinite",
          }}
        />

        {/* Cloud B — rose/magenta, top-right */}
        <div
          style={{
            position: "absolute",
            top: "8%",
            right: "-14%",
            width: 560,
            height: 560,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(190,24,93,0.42) 0%, rgba(157,23,77,0.20) 45%, transparent 70%)",
            filter: "blur(64px)",
            animation: "dusk-cloud-b 18s ease-in-out infinite",
          }}
        />

        {/* Cloud C — violet with warm core */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "18%",
            width: 700,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(249,115,22,0.28) 0%, rgba(124,58,237,0.18) 50%, transparent 72%)",
            filter: "blur(80px)",
            animation: "dusk-cloud-c 22s ease-in-out infinite",
          }}
        />

        {/* Horizon warm glow */}
        <div
          style={{
            position: "absolute",
            bottom: "22%",
            left: "0%",
            right: "0%",
            height: 220,
            background:
              "radial-gradient(ellipse 75% 100% at 50% 100%, rgba(251,146,60,0.32) 0%, rgba(234,88,12,0.14) 45%, transparent 100%)",
            filter: "blur(52px)",
            transformOrigin: "bottom center",
            animation: "sun-rise 48s ease-in-out infinite",
          }}
        />

        {/* Dot grid — stars */}
        <svg
          className="absolute inset-0 h-full w-full"
          style={{ opacity: 0.07 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="talent-dusk-grid"
              x="0"
              y="0"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="50%" fill="url(#talent-dusk-grid)" />
        </svg>

        {/* Rising embers */}
        {EMBERS.map((e, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: e.left,
              bottom: e.bottom,
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              borderRadius: "50%",
              background:
                i % 2 === 0
                  ? "rgba(251,146,60,0.9)"
                  : "rgba(249,115,22,0.85)",
              boxShadow: "0 0 4px rgba(251,146,60,0.8)",
              animation: `ember-rise ${e.dur} ease-in-out ${e.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:py-24">
        {/* Hero */}
        <header className="mb-16 flex flex-col gap-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
            Youth Talent Platform
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Pre-Vetted Thai Youth Builders
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
            Access skilled Gen-Z creators and developers for high-impact,
            48-hour turnaround projects. Every builder has been verified for
            their track.
          </p>
        </header>

        {/* Stats bar */}
        <section className="mb-12 grid grid-cols-3 gap-y-6 rounded-2xl bg-slate-950/50 p-5 ring-1 ring-white/8 sm:divide-x sm:divide-white/8">
          <StatTally label="Builders" value={String(trackCounts.total)} />
          <StatTally label="Tracks" value={String(trackCounts.tracks)} />
          <StatTally label="Turnaround" value="48-72hr" />
        </section>

        {/* Grid */}
        <TalentGrid profiles={profiles} />

        {/* LINE OA CTA */}
        <section className="mt-20 flex flex-col items-center gap-6 rounded-2xl bg-slate-950/60 p-8 text-center ring-1 ring-white/8 sm:p-12">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Submit Your Project Brief
          </h2>
          <p className="max-w-lg text-slate-300">
            Scan the QR code below to submit your project brief via LINE.
            We&apos;ll match you with the right builder within 24 hours.
          </p>
          <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-white p-3">
            <p className="text-sm font-semibold text-slate-800">
              LINE OA QR
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Or search <span className="font-semibold text-amber-300">@passionseed</span> on LINE
          </p>
        </section>
      </div>
    </div>
  );
}

function StatTally({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5 px-1 sm:px-5">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span className="text-3xl font-black leading-none text-white">
        {value}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders**

Run: `pnpm dev` then navigate to `http://localhost:3000/talent`
Expected: Dusk atmospheric page with hero, stats bar, talent cards (if seed ran), and LINE CTA section.

- [ ] **Step 3: Commit**

```bash
git add app/talent/page.tsx
git commit -m "feat(talent): add /talent page with Dusk scene and LINE OA CTA"
```
