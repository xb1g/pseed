---
name: radar-research
description: Research a career field and create full radar content (cards, sources, metrics). Use when asked to add a new career to radar, research a career field, update radar data, or seed radar content. Covers web research, data validation, DB writes to both local and production.
---

# Radar Research Skill

## When to Use

- Adding a new career field to Career Radar
- Updating or fixing existing radar field data
- Researching career metrics (salary, demand, AI impact) for a field
- Seeding cards and sources for a radar field

## Parallel Research (multiple fields at once)

When asked to research multiple career fields (e.g. "add photographer, chef, and lawyer to radar"), dispatch one **sub-agent per field** using the Agent tool with `subagent_type=Task`. Each sub-agent independently:
1. Web-searches for real data
2. Builds the complete data JSON
3. Writes to both local and production

Give each sub-agent this context:
- The full research phase instructions (Steps 1-4 below)
- The data schema reference
- The DB credentials from `.env.local`
- The field name (Thai + English), slug, emoji, and color

Do NOT wait for one field to finish before starting the next — run them all in parallel.

## Setup

Before starting, read these files for current schema and patterns:
1. `components/radar/RadarCards.tsx` lines 16-105 (card content type definitions)
2. `components/radar/CareerResearchView.tsx` lines 8-45 (CareerResearch type)
3. `app/radar/[slug]/page.tsx` (how careerSurvival card is injected)
4. `docs/CAREER_RADAR_EDITORIAL_SPINE.md` (content rules: money de-heroed, snapshot→trajectory, durable-skill anchor, real paths)

DB credentials:
- Production: `HACKATHON_SUPABASE_URL` and `HACKATHON_SUPABASE_SERVICE_ROLE_KEY` from `.env.local`
- Local: container `supabase_db_pseed`, direct psql or REST at `http://127.0.0.1:54321`
- See memory file `local-db.md` for connection patterns

## Research Phase — DO NOT SKIP

### Step 1: Web search for real data

Use `WebSearch` and `WebFetch` to find **current, real data** for the career field. Search for:

1. **Salary data Thailand** — search: `"เงินเดือน [field] ไทย 2025"`, `"[field] salary Thailand"` on JobsDB, WorkVenture, Adecco
2. **Salary data global** — BLS Occupational Outlook, Glassdoor, Payscale
3. **Job demand & growth** — BLS projections, LinkedIn workforce reports, WEF Future of Jobs
4. **AI impact** — search: `"AI replace [field]"`, `"AI automation [field]"`, McKinsey/WEF reports
5. **Thailand market** — number of openings on JobsDB/Indeed Thailand, top employers
6. **Professional requirements** — certifications, licenses, education paths
7. **Day in life** — search: `"day in the life of a [field]"`, Reddit, Quora

### Step 2: Verify every source

For each source you plan to cite:
- **Fetch the URL** with `WebFetch` to confirm it exists and contains relevant content
- **Extract the actual data point** (salary number, growth %, etc.) from the page
- **Record**: title, publisher, URL, date, and a key quote

### Step 3: Build the data file

Run the seed script to generate a template:
```bash
node .claude/skills/radar-research/scripts/seed-template.mjs <slug>
```
Then fill in the JSON with researched data.

### Step 4: Validate before writing

Before writing to any database:
- [ ] Every `source.url` has been fetched and verified
- [ ] Salary figures match what the source actually says (not training data)
- [ ] `source_refs` on each card point to sources that actually support that card's claims
- [ ] `metrics.demand_growth` (0-10), `saturation_level` (0-10), `progression_difficulty` (0-10) are justified
- [ ] `metrics.grad_employment_pct` is a real percentage from a real source
- [ ] `metrics.salary_floor` and `salary_ceiling` are in THB/month from Thai sources
- [ ] `tier` is one of: `growing`, `shifting`, `exposed` — justified by the metrics
- [ ] `ai_risk_score` (0-10) is justified and not tripped by keyword matching

## Data Schema Reference

### radar_fields (key columns)

| Column | Type | Notes |
|--------|------|-------|
| slug | text | URL-safe, unique. e.g. `accountant` |
| name_th | text | Thai display name |
| name_en | text | English display name |
| emoji | text | Single emoji for the field |
| color | text | Hex color for accent. e.g. `#4ade80` |
| tile_size | text | `sm`, `md`, or `lg` |
| tags | text[] | Collection keys for filtering |
| is_published | bool | Must be true to show |
| has_content | bool | True when cards exist |
| research | jsonb | CareerResearch object (see below) |
| score | smallint | 0-10, calculated from metrics |
| tier | text | `growing`, `shifting`, or `exposed` |

### research JSONB structure

```json
{
  "tier": "growing|shifting|exposed",
  "reasoning": "Thai explanation of tier (optional; keep it honest and de-heroed — omit if it would sound like hype)",
  "metrics": {
    "demand_growth": 7,
    "grad_employment_pct": 85,
    "saturation_level": 4,
    "progression_difficulty": 5,
    "salary_floor": 18000,
    "salary_ceiling": 120000
  },
  "global_metrics": { "...same shape, global data..." },
  "metric_details": {
    "demand_growth": { "th": "Thai explanation", "source": "Title", "source_url": "https://..." },
    "grad_employment_pct": { "th": "...", "source": "...", "source_url": "..." }
  },
  "global_metric_details": { "...same shape..." },
  "sources": [
    { "title": "...", "url": "...", "author": "...", "date": "2025-01-01" }
  ],
  "insights": [
    { "category": "skills|salary|market|education|timeline", "content": "...", "priority": 1 }
  ],
  "aliases": ["alternative job titles"],
  "escape_route_slug": "related-field-slug"
}
```

All `content_th` fields are required for display; `content_en` is optional and the UI falls back to Thai when English is absent.

### radar_cards kinds and content_th shapes

| Kind | Required fields | Position range |
|------|----------------|---------------|
| `hook` | `eyebrow`, `title`, `body`, `stat`, `statLabel` | 0 |
| `fantasyReality` | `eyebrow`, `title`, `fantasy`, `reality`, `source_refs` | 10 |
| `salaryProgression` | `eyebrow`, `title`, `currency` (default e.g. `USD`), `levels[]` (each: `level`, `years`, `salary`, `note`), optional `eyebrow_thb`/`title_thb`/`levels_thb[]` for Thai-Baht toggle, `source_refs` | 40 |
| `aiImpact` | `eyebrow`, `title`, `verdict`, `augmented[]`, `automated[]`, `ai_risk_score`, `source_refs` | 70 |
| `marketThailand` | `eyebrow`, `title`, `body`, `openings`, `companies[]`, `source_refs` | 80 |
| `dayInLife` | `eyebrow`, `title`, `steps[]` (each: `time`, `label`), `source_refs` | 90 |
| `realPeople` | `eyebrow`, `title`, `people[]` (each: `name?`, `role?`, `imageUrl?`, `background`, `salary?`, `path[]?`, `nowDoing?`, `whereHeading?`, `advice?`, `publisher?`, `url?`), `source_refs` | 100 |
| `risks` | `eyebrow`, `title`, `risks[]`, `source_refs` | 110 |
| `futureOutlook` | `eyebrow`, `title`, `growthRate?`, `growthLabel?`, `timeline[]?`, `demandSignal?`, `risk?`, `source_refs` | 120 |
| `cta` | `eyebrow`, `title`, `body`, `button` | 140 |
| `sources` | `eyebrow`, `title`, `items[]` (each: `ref`, `title`, `publisher`, `url`) | 150 |

## Content Depth Guidelines

Depth determines whether a smart teen trusts the card or skips it. Follow these targets:

- **hook**: 1-2 sentences. Lead with the mission/shift, not a big salary number. If you use a stat, label it honestly (e.g., "experienced level", "global median").
- **fantasyReality**: Fantasy ~1 sentence; reality 1-2 sentences that name the boring but real work.
- **salaryProgression**: 4 levels (`Entry`, `Mid`, `Senior`, `Staff+`). Every level needs `years` + `salary` + a `note`. The note must answer: (a) what it takes at this level and (b) the durable skill underneath that survives tool changes. Never leave a level without a note.
- **aiImpact**: Verdict 1-2 sentences. 3-5 `augmented` items, 2-4 `automated` items. `ai_risk_score` (0-10) must be justified by the verdict, not by keyword matching.
- **marketThailand**: Body 1-2 sentences; `openings` as a real number or range; 4-8 `companies`. Do not invent opening counts.
- **dayInLife**: 5-7 `steps` that show a realistic mix of meetings, deep work, and waiting for results.
- **realPeople**: 3-4 people. Each person: `background` 1-2 sentences; `path` 3-5 steps; `nowDoing` 1 sentence; `whereHeading` 1 sentence; `advice` 1 sentence. Only include `salary` if the person shared it. Sourced/consented `imageUrl` only.
- **risks**: 3-5 risks, each 1 sentence. Be honest — this builds trust.
- **futureOutlook**: `growthRate` + `growthLabel` if you have a real figure; `timeline` 3-5 items; `demandSignal` 1 sentence; `risk` 1 sentence.
- **entryRoutes**: 3-5 routes, each with a `tag` and a clear `route` sentence.
- **cta**: `body` 1-2 sentences; `button` 2-4 words.
- **sources**: 3-6 sources. Every card that uses `source_refs` must point to a real source in this list.

Cross-cutting rules from the editorial spine:
- Every snapshot carries a price tag: years, effort, or what it takes.
- Every snapshot points to a trajectory: where is this heading in 3-5 years?
- Anchor on durable skills (judgment, framing, decisions under uncertainty), not tools that churn every 6 months.
- If a number is uncertain, omit it. Empty is better than fake.

Notes on `realPeople`:
- Use the interview prompt in `app/admin/radar-interview/RadarInterviewClient.tsx` as the shape guide.
- `imageUrl` only if the photo is sourced and the person consented.
- `salary` only if the person actually shared it; never fabricate a salary, quote, year, or fact. Empty is better than fake.

The `cta` card content comes from the seed data (`content_th.body` and `content_th.button`). The button links to `field.squad_url` if it is set; otherwise it records intent. A typical Thai CTA uses: `eyebrow: "สนใจไหม?"`, `title: "อยากลองสาย[field_name_th]"`, `body` inviting the user to tap if interested, and `button: "สนใจสายนี้"`.

The `careerSurvival` card is NOT stored in radar_cards — it's injected at runtime from `field.research.metrics` + `field.score` + `field.tier`.

Hidden kinds (filtered in UI but valid): `jobs`, `growthCompare`, `list`, `entryRoutes`, `reflection`. `text` cards are only hidden when their title is exactly `"ทางนี้คืออะไร"`.

### radar_sources

| Column | Type | Notes |
|--------|------|-------|
| field_id | uuid | FK to radar_fields |
| ref | int | Reference number, unique per field |
| title | text | Source title |
| publisher | text | Organization name |
| url | text | Direct link |
| tier | text | `primary`, `secondary`, `tertiary` |
| quote_th | text | Key quote in Thai (optional) |
| quote_en | text | Key quote in English (optional) |
| UNIQUE | | (field_id, ref) |

## Writing to DB

### Always write to BOTH local and production

Use the seed script:
```bash
node .claude/skills/radar-research/scripts/seed-radar.mjs <path-to-data.json>
```

Or manually — always use upsert pattern:

**Production** (REST API):
```bash
source .env.local
curl -X POST "${HACKATHON_SUPABASE_URL}/rest/v1/radar_fields" \
  -H "apikey: ${HACKATHON_SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${HACKATHON_SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d '<json>'
```

**Local** (psql):
```bash
docker exec supabase_db_pseed psql -U postgres -d postgres -c "INSERT INTO ... ON CONFLICT ... DO UPDATE SET ..."
```

### Write order (FK dependencies)
1. `radar_fields` first
2. `radar_sources` second (needs field_id)
3. `radar_cards` last (needs field_id)

### Key rules
- Look up `field_id` by `slug` at runtime — never hardcode UUIDs across environments
- Use `ON CONFLICT DO UPDATE` / `Prefer: resolution=merge-duplicates` for idempotency
- Verify writes with a SELECT after each table

### Post-write verification

After seeding, do these checks before considering the task done:

1. **Render check** — open `/radar/<slug>` locally and scroll through every card. Confirm no blank panels, no broken layout, and the currency toggle works if `levels_thb` was provided.
2. **Lint / type check** — run `npx eslint components/radar/RadarCards.tsx app/radar/[slug]/page.tsx` and `npx tsc --noEmit | grep -E "RadarCards|RadarField|CareerResearchView"` to catch schema mismatches.
3. **Data audit** — query the DB to confirm `radar_fields.research`, `radar_sources`, and `radar_cards` all landed, and that every `source_refs` number points to an existing source ref.
4. **Content audit** — re-read the seeded cards against `docs/CAREER_RADAR_EDITORIAL_SPINE.md`. No hype numbers, no fabricated salaries/quotes, every snapshot carries its price tag.

## Score Calculation

The `score` column on `radar_fields` is calculated from metrics:

```
score = ROUND(
  (
    demand_growth / 10
    + grad_employment_pct / 100
    + (1 - saturation_level / 10)
    + (1 - progression_difficulty / 10)
  ) / 4 * 10
)
```

The `careerSurvival` card is NOT stored in radar_cards. It's injected server-side from `field.research.metrics` + `field.score` + `field.tier`.

## Common Mistakes

- Using training data instead of fetching real sources — ALWAYS web search first
- Forgetting to add `source_refs` to cards — every card (except hook, sources) should have them
- Using `title` instead of `level` in salaryProgression levels
- Using `yearsExp` instead of `years` in salaryProgression levels
- Setting `ai_risk_score` by keyword matching instead of reading the actual research
- Forgetting to write to both local AND production
- Hardcoding UUIDs that differ between environments
- Fabricating salaries, quotes, or years in `realPeople` — omit the field if the source did not provide it
- Treating `text` cards as always hidden — only the title `"ทางนี้คืออะไร"` is filtered
- Skipping the render and lint checks after seeding
