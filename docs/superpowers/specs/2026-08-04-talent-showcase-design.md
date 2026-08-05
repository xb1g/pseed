# Youth Talent Showcase — Design Spec

> **Date:** 2026-08-04
> **Route:** `/talent`
> **Theme:** Dusk (founder-facing)
> **Auth:** Public, no login required

---

## Purpose

A founder-facing talent showcase page for the Youth Talent Micro-Task & Bounty Platform pilot. Displayed at tomorrow's 100-founder meeting so attending startup founders and SME owners can browse pre-vetted student builders and feel confident placing a project brief.

Founders take action via a LINE OA QR code CTA at the bottom.

---

## Data Architecture

### Supabase table: `talent_profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | `gen_random_uuid()` |
| `full_name` | text NOT NULL | |
| `nickname` | text NOT NULL | |
| `age` | smallint | |
| `school` | text | |
| `line_id` | text | Private — not shown on public page |
| `phone` | text | Private — not shown on public page |
| `track` | text NOT NULL | One of: `dev`, `video`, `strategy`, `design` |
| `tools` | text[] | Array of tool/framework names |
| `portfolio_links` | text[] | Array of URLs |
| `verified` | boolean | Default `false`, toggled manually |
| `created_at` | timestamptz | Default `now()` |

### Track mapping (from CSV)

| CSV value | Normalized |
|-----------|------------|
| "Hacking" | `dev` |
| "Short-Form Video Editor" | `video` |
| "Business Strategy & Growth" | `strategy` |
| "Design, ..." (contains "Design") | `design` |

### RLS

- `SELECT` open to `anon` (public page).
- `INSERT`, `UPDATE`, `DELETE` restricted to service role only.

---

## Page Structure

**Route:** `app/talent/page.tsx` — server component

### Sections (top to bottom)

1. **Dusk atmospheric background** — fixed-position sky with cloud blobs, horizon glow, ember particles. Reuse existing Dusk layer CSS from `globals.css`.

2. **Hero section**
   - Eyebrow: uppercase label "YOUTH TALENT PLATFORM"
   - Headline: "Pre-Vetted Thai Youth Builders"
   - Subtext: "Access skilled Gen-Z creators and developers for high-impact, 48-hour turnaround projects."

3. **Stats bar** — 3–4 tallies in a rounded card (reuse `AdminRoster` Tally pattern):
   - Total builders
   - Tracks available
   - "48–72hr" avg turnaround (static text)

4. **Track filter pills** — client-side filter, no page reload:
   - All / Dev / Video / Strategy / Design
   - Color-coded to match card badges
   - Active pill gets solid background

5. **Card grid** — responsive: 1 col mobile, 2 col tablet, 3 col desktop

6. **LINE OA CTA section** — QR code image + "Submit Your Project Brief" heading + brief instructions

### Components

| File | Type | Responsibility |
|------|------|----------------|
| `app/talent/page.tsx` | Server | Fetch `talent_profiles`, render layout |
| `components/talent/TalentGrid.tsx` | Client (`"use client"`) | Filter state, renders grid of cards |
| `components/talent/TalentCard.tsx` | Client | Single talent card |

---

## Card Design

Each card shows:

- **Nickname** (large, white, bold)
- **Full name** (small, muted below nickname)
- **Track badge** — color-coded pill:
  - `dev` → `bg-blue-500/20 text-blue-300 ring-blue-500/30`
  - `video` → `bg-pink-500/20 text-pink-300 ring-pink-500/30`
  - `strategy` → `bg-amber-500/20 text-amber-300 ring-amber-500/30`
  - `design` → `bg-purple-500/20 text-purple-300 ring-purple-500/30`
- **Age + School** (small text)
- **Tools** — small pill tags, `bg-white/5 text-slate-300`
- **Portfolio links** — icon buttons, auto-detect domain:
  - `github.com` → GitHub icon
  - `linkedin.com` → LinkedIn icon
  - `tiktok.com` → TikTok icon
  - Everything else → Globe icon
- **Verified badge** — amber checkmark if `verified = true`

Card styling: `bg-white/5 ring-1 ring-white/10 rounded-xl`. Dusk hover pattern: charge-in glow on hover, snap-out on leave.

---

## Seed Script

`scripts/seed-talent.mjs`

1. Reads CSV path from CLI arg
2. Parses CSV rows
3. Maps `Primary Skill Track` → normalized track value
4. Splits `Tools & Frameworks` on commas → `text[]`
5. Splits `Portfolio Links` on comma/space → `text[]`, filters valid URLs
6. Upserts into `talent_profiles` on `full_name` + `nickname` composite
7. Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars

---

## Migration

`supabase/migrations/XXXXXX_create_talent_profiles.sql`

- `CREATE TABLE IF NOT EXISTS talent_profiles (...)`
- RLS: enable, add `SELECT` policy for anon
- No indexes beyond PK needed at this scale (< 50 rows)

---

## Out of Scope

- Individual profile pages (`/talent/[id]`)
- On-page intake form (founders use LINE OA)
- Admin CRUD UI (manage via Supabase dashboard)
- Auth-gated features
- Avatar/photo uploads
