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

## Setup

Before starting, read these files for current schema and patterns:
1. `components/radar/RadarCards.tsx` lines 10-110 (card content type definitions)
2. `components/radar/CareerResearchView.tsx` lines 1-47 (CareerResearch type)
3. `app/radar/[slug]/page.tsx` (how careerSurvival card is injected)

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
  "reasoning": "Thai explanation of tier",
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

### radar_cards kinds and content_th shapes

| Kind | Required fields | Position range |
|------|----------------|---------------|
| `hook` | `eyebrow`, `title`, `body`, `stat`, `statLabel` | 0 |
| `fantasyReality` | `eyebrow`, `title`, `fantasy`, `reality`, `source_refs` | 10 |
| `salaryProgression` | `eyebrow`, `title`, `levels[]` (each: `level`, `years`, `salary`, `note`), `source_refs` | 40 |
| `aiImpact` | `eyebrow`, `title`, `verdict`, `augmented[]`, `automated[]`, `ai_risk_score`, `source_refs` | 70 |
| `marketThailand` | `eyebrow`, `title`, `body`, `openings`, `companies[]`, `source_refs` | 80 |
| `dayInLife` | `eyebrow`, `title`, `steps[]` (each: `time`, `label`), `source_refs` | 90 |
| `risks` | `eyebrow`, `title`, `risks[]`, `source_refs` | 110 |
| `sources` | `eyebrow`, `title`, `items[]` (each: `ref`, `title`, `publisher`, `url`) | 150 |

Hidden kinds (filtered in UI but valid): `text`, `jobs`, `growthCompare`, `list`, `entryRoutes`, `cta`, `reflection`

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
