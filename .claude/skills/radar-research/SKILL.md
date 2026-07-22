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
8. **Skills used in this path** — research the skills a practitioner in the field would actually name, not a generic outsider's guess. Search official occupation profiles, practitioner guides, certification bodies, professional bodies, employer/career sources, and field-specific frameworks for fundamentals, workflows, tools/processes, judgment calls, communication requirements, ethics/responsibility, and AI/digital tool expectations. Prefer O*NET, BLS/OOH, professional bodies, credential bodies, reputable employer/career pages, and role-specific frameworks.

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
- [ ] The `text` card at position 125 explains "ทักษะที่ใช้จริง" with practitioner-depth skill requirements, not generic soft skills or shallow tool lists
- [ ] The skills card sounds like an expert in the field reviewed it: it includes field-specific fundamentals, workflows, judgment, tools/processes by context, and common failure modes
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
| name_th | text | Thai display name. **Pure Thai only** — no English in parentheses. e.g. `นักบัญชี` not `Accountant (นักบัญชี)` |
| name_en | text | English display name. **Pure English only** — no Thai in parentheses. e.g. `Accountant` not `Accountant (นักบัญชี)` |
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
    "demand_growth": { "th": "Thai explanation", "sources": [{ "title": "Title", "url": "https://..." }] },
    "grad_employment_pct": { "th": "...", "sources": [{ "title": "...", "url": "..." }] }
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

### radar_cards — exactly 13 cards per field

Every field MUST have exactly these 13 cards, no more, no less. Do NOT add extra cards like `reflection`, `jobs`, `growthCompare`, `list`.

| # | Kind | Position | Required fields |
|---|------|----------|----------------|
| 1 | `hook` | 0 | `eyebrow`, `title`, `body`, `stat`, `statLabel` |
| 2 | `fantasyReality` | 10 | `eyebrow`, `title`, `fantasy`, `reality`, `source_refs` |
| 3 | `salaryProgression` | 40 | `eyebrow`, `title`, `currency` (default e.g. `USD`), `levels[]` (each: `level`, `years`, `salary`, `note`), optional `eyebrow_thb`/`title_thb`/`levels_thb[]` for Thai-Baht toggle, `source_refs` |
| 4 | `aiImpact` | 70 | `eyebrow`, `title`, `verdict`, `augmented[]`, `automated[]`, `ai_risk_score`, `source_refs` |
| 5 | `marketThailand` | 80 | `eyebrow`, `title`, `body`, `openings`, `companies[]`, `source_refs`. Optional `job_access` object: `{ score, label?, confidence?, demand_score?, competition_score?, entry_barrier_score?, applicant_data?, methodology? }` |
| 6 | `dayInLife` | 90 | `eyebrow`, `title`, `steps[]` (each: `label`, `detail`), `source_refs`. Steps describe activities, not a schedule. |
| 7 | `realPeople` | 100 | `eyebrow`, `title`, `people[]` (each: `name?`, `role?`, `imageUrl?`, `background`, `salary?`, `path?[]` (year+label), `nowDoing?`, `whereHeading?`, `advice?`, `publisher?`, `url?`), `source_refs` |
| 8 | `risks` | 110 | `eyebrow`, `title`, `risks[]`, `source_refs` |
| 9 | `entryRoutes` | 120 | `eyebrow`, `title`, `description`, `faculties[]` (each: `name`, `tier`: `direct`/`related`/`alternative`, `examples?`, `note?`), `source_refs` |
| 10 | `text` | 125 | `presentation: "skills"`, `eyebrow`, `title`, `skills[]` (each: `title`, `description?`, `level?`), `source_refs` — "ทักษะที่ใช้จริง" structured skills list |
| 11 | `text` | 130 | `presentation: "startCarousel"`, `eyebrow`, `title`, `options[]` (each: `type`, `title`, `description?`, `url?`, `duration?`, `cost?`, `cta`), `source_refs?` — "เริ่มลงมือ" scannable start options |
| 12 | `cta` | 140 | `eyebrow`, `title`, `body`, `button` |
| 13 | `sources` | 150 | `eyebrow`, `title`, `items[]` (each: `ref`, `title`, `publisher`, `url`) |

The `entryRoutes` card shows which university faculties/majors lead to the career. Each faculty has a `tier`:
- `direct` — the faculty directly teaches this career's core skills (e.g., CS for Software Engineer)
- `related` — the faculty covers related knowledge that transfers well (e.g., Statistics for Data Scientist)
- `alternative` — a non-obvious path that can still lead to the career with extra effort (e.g., Liberal Arts for UX Design)

## Content Depth Guidelines

Depth determines whether a smart teen trusts the card or skips it. Follow these targets:

- **hook**: 1-2 sentences. Lead with the mission/shift, not a big salary number. If you use a stat, label it honestly (e.g., "experienced level", "global median").
- **fantasyReality**: Fantasy ~1 sentence; reality 1-2 sentences that name the boring but real work.
- **salaryProgression**: 4 levels (`Entry`, `Mid`, `Senior`, `Staff+`). Every level needs `years` + `salary` + a `note`. The note must answer: (a) what it takes at this level and (b) the durable skill underneath that survives tool changes. Never leave a level without a note. Include `levels_thb` for Thai-Baht toggle when Thai salary data is available.
- **aiImpact**: Verdict 1-2 sentences. 3-5 `augmented` items, 2-4 `automated` items. `ai_risk_score` (0-10) must be justified by the verdict, not by keyword matching.
- **marketThailand**: Body 1-2 sentences; `openings` as a real number or range; 4-8 `companies`. Do not invent opening counts.
- **dayInLife**: 5-7 `steps` describing **activities/tasks** the person actually does — NOT a time-based schedule. Each step has `label` (short activity description) and `detail` (expanded context: tools used, what it involves in practice). Do NOT include `time` field. Focus on what they work on, not when.
- **risks**: 3-5 risks, each 1 sentence. Be honest — this builds trust.
- **entryRoutes**: 4-6 faculties with tiers (`direct`, `related`, `alternative`). Each faculty has `examples` (university names) and a `note` explaining the path.
- **realPeople (pos 100)**: 1-3 real people with sourced backgrounds. Each person needs at minimum `background` (short bio). Optional but valuable: `path` (trajectory), `nowDoing`, `whereHeading`, `advice`. Never fabricate — only use data from verified sources.
- **text (pos 125)**: `presentation: "skills"` — structured `skills[]` array with 7-9 items. Each skill has `title` (specific skill name in Thai) and `description` (how it's used in real work). See below.
- **text (pos 130)**: `presentation: "startCarousel"` — structured `options[]` array with 3-5 actionable items. Each option has `type` (e.g. "YouTube", "ลองทำ", "คอร์ส / PathLab"), `title`, `description`, optional `url`/`duration`/`cost`, and `cta` button text.
- **cta**: `body` 1-2 sentences; `button` 2-4 words.
- **sources**: 3-6 sources. Every card that uses `source_refs` must point to a real source in this list.

Cross-cutting rules from the editorial spine:
- Every snapshot carries a price tag: years, effort, or what it takes.
- Every snapshot points to a trajectory: where is this heading in 3-5 years?
- Anchor on durable skills (judgment, framing, decisions under uncertainty), not tools that churn every 6 months.
- If a number is uncertain, omit it. Empty is better than fake.

### Skills card depth (position 125)

The position 125 `text` card uses `presentation: "skills"` and a structured `skills[]` array (NOT a plain `body` string). Always set `eyebrow: "ทักษะที่ใช้จริง"` and `title: "งานนี้ต้องใช้ทักษะอะไรบ้าง?"`.

The skills card must have practitioner-level depth. It should read like it came from someone inside that field, not from a generic career article.

Provide 7-9 items in the `skills[]` array. Each item has:
- `title`: specific skill name or competency in Thai
- `description`: how it is used in real work, with field-specific nouns, workflows, artifacts, tools, or decisions

Example:
```json
{
  "presentation": "skills",
  "eyebrow": "ทักษะที่ใช้จริง",
  "title": "งานนี้ต้องใช้ทักษะอะไรบ้าง?",
  "skills": [
    { "title": "การวิเคราะห์ช่องโหว่ (Vulnerability Analysis)", "description": "อ่าน CVE, ประเมินความรุนแรง, จัดลำดับ patch ตามความเสี่ยงจริงของระบบ" },
    { "title": "Incident Response", "description": "วิเคราะห์ log, กำหนด scope ของ breach, ตัดสินใจ contain vs. eradicate ภายใต้แรงกดดัน" }
  ],
  "source_refs": [1, 3]
}
```

Prioritize durable fundamentals over random tool lists. Include tools only as examples and clarify when tools differ by sub-role.

### Start card depth (position 130)

The position 130 `text` card uses `presentation: "startCarousel"` and a structured `options[]` array (NOT a plain `body` string). Always set `eyebrow: "เริ่มลงมือ"` and `title: "ไม่ต้องรอจบมหาวิทยาลัย"`.

Provide 3-5 items in the `options[]` array. Each item has:
- `type`: category label (e.g. "YouTube", "ลองทำ", "คอร์ส / PathLab")
- `title`: name of the resource or activity
- `description`: what the student will learn/do
- `url`: link (optional)
- `duration`: estimated time (optional)
- `cost`: price or "ฟรี" (optional)
- `cta`: button text (e.g. "สนใจวิธีนี้", "อยากลองโจทย์นี้")

Do not merge with the skills card. Keep start options scannable and actionable.

The `cta` card is always generated with: `eyebrow: "สนใจไหม?"`, `title: "อยากลองสาย[field_name_th]"`, `body` inviting the user to tap if interested, and `button: "สนใจสายนี้"`. The button links to `field.squad_url` if set.

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

## Metric Integrity — CRITICAL

**NEVER use training data or gut feeling for metrics.** Every single metric value must come from a verified source found via web search in the current session. This section exists because past sessions hallucinated metrics that looked plausible but were wrong — leading to misleading career advice for students.

### Rules

1. **Every metric needs a source URL.** If you cannot find a real source for a metric, set it to `null` rather than guessing. A missing metric is better than a fake one.

2. **Cross-check relative rankings.** After updating any field's metrics, query ALL published fields and sanity-check the ranking. Ask yourself:
   - Does QA Engineer really score higher than AI Engineer? (It shouldn't.)
   - Does IT Support really have higher demand growth than Software Engineer? (It shouldn't.)
   - If a field's `salary_ceiling` looks unusually high or `progression_difficulty` unusually low, it's probably wrong.

3. **Use the score formula to verify.** Calculate the score manually before writing:
   ```
   score = ROUND((demand_growth/10 + grad_employment_pct/100 + (1-saturation_level/10) + (1-progression_difficulty/10)) / 4 * 10)
   ```
   If the score doesn't match your intuition about the field's prospects, re-examine each metric.

4. **metric_details must have real source URLs.** Every entry in `metric_details` and `global_metric_details` must include a `sources` array with `{ title, url }` objects, each fetched and verified with `WebFetch` during research. Do not leave `sources` empty or use URLs from training data.

5. **Minimum source count.** Each field must have at least 4 verified sources in `research.sources`. If you can only find 2, search harder — try BLS, JobsDB, Glassdoor, professional associations, and industry reports.

6. **When re-researching existing fields**, always compare before and after values. Log what changed and why in the sub-agent output. If a metric changes by more than 2 points, double-check the new source.

### Red flags that metrics are hallucinated

- `research.sources` array is empty or has fewer than 3 entries
- `metric_details` entries have empty `sources` arrays
- A niche field scores higher than a mainstream high-demand field
- `salary_ceiling` exceeds what senior roles actually pay (check JobsDB/Glassdoor)
- `grad_employment_pct` is above 90% for a non-licensed profession
- `demand_growth` is 8+ but BLS shows flat or declining growth

## Common Mistakes

- Using training data instead of fetching real sources — ALWAYS web search first
- **Writing plausible-looking metrics without sources** — this is the #1 integrity risk. Every number must trace to a URL.
- **Not comparing across fields** — a metric only makes sense relative to other fields. Always check the leaderboard after updating.
- Forgetting to add `source_refs` to cards — every card (except hook, sources) should have them
- Using `title` instead of `level` in salaryProgression levels
- Using `yearsExp` instead of `years` in salaryProgression levels
- Merging "ทักษะที่ใช้จริง" and "เริ่มลงมือ" into one wall of text — keep skills and scannable recommendations separate
- Writing generic soft skills without researching occupation-specific skills and citing sources
- Listing tools as if every sub-role uses all of them — name fundamentals first, then tools by context/sub-role
- Writing "normal person guessing the job" content — use practitioner vocabulary, workflows, artifacts, and judgment calls
- Setting `ai_risk_score` by keyword matching instead of reading the actual research
- Forgetting to write to both local AND production
- Hardcoding UUIDs that differ between environments
- Fabricating salaries, quotes, or years in `realPeople` — omit the field if the source did not provide it
- Treating `text` cards as always hidden — only the title `"ทางนี้คืออะไร"` is filtered
- Skipping the render and lint checks after seeding
- Using `time` field in dayInLife steps — steps should be activity-based with `label` and `detail`, NOT time-based schedules
- Mixing languages in `name_th`/`name_en` — `name_th` must be pure Thai (e.g. `นักบัญชี`), `name_en` must be pure English (e.g. `Accountant`). Never `Accountant (นักบัญชี)` in either field
