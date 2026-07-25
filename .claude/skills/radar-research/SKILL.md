---
name: radar-research
description: Research a career field and create full radar content (cards, sources, metrics). Use when asked to add a new career to radar, research a career field, update radar data, seed radar content, or audit existing radar data for accuracy. Covers web research, data validation, evidence tracking, integrity audits, and DB writes.
user-invocable: true
argument-hint: "[research|audit] [target-slug]"
---

# Radar Research Skill

## Modes

```
/radar-research research <slug>   — Source-first research to create or update a career field
/radar-research audit <slug>      — Integrity audit of an existing field's data and sources
/radar-research audit all         — Audit all published fields
```

If no mode is specified, ask the user which mode they want.

## When to Use

- **research** — Adding a new career field, updating existing field data, re-researching with fresh sources
- **audit** — Checking if existing data is accurate, sources are alive, claims have evidence, scores make sense

---

# MODE: research

## Parallel Research (multiple fields at once)

When asked to research multiple career fields (e.g. "add photographer, chef, and lawyer to radar"), dispatch one **sub-agent per field** using the Agent tool with `subagent_type=Task`. Each sub-agent independently:
1. Web-searches for real data
2. Builds the complete data JSON
3. Writes evidence file
4. Writes to both local and production

Give each sub-agent this context:
- The full research phase instructions (Steps 1-6 below)
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

### Step 1: Find sources FIRST (source-first workflow)

**Do NOT write any content yet.** First, build your source library. Use `WebSearch` and `WebFetch` to find **current, real data** for the career field:

1. **Salary data Thailand** — search: `"เงินเดือน [field] ไทย 2025"`, `"[field] salary Thailand"` on JobsDB, WorkVenture, Adecco
2. **Salary data global** — BLS Occupational Outlook, Glassdoor, Payscale
3. **Job demand & growth** — BLS projections, LinkedIn workforce reports, WEF Future of Jobs
4. **AI impact** — search: `"AI replace [field]"`, `"AI automation [field]"`, McKinsey/WEF reports
5. **Thailand market** — number of openings on JobsDB/Indeed Thailand, top employers
6. **Professional requirements** — certifications, licenses, education paths
7. **Day in life** — search: `"day in the life of a [field]"`, Reddit, Quora
8. **Skills used in this path** — research the skills a practitioner in the field would actually name, not a generic outsider's guess. Search official occupation profiles, practitioner guides, certification bodies, professional bodies, employer/career sources, and field-specific frameworks for fundamentals, workflows, tools/processes, judgment calls, communication requirements, ethics/responsibility, and AI/digital tool expectations. Prefer O*NET, BLS/OOH, professional bodies, credential bodies, reputable employer/career pages, and role-specific frameworks.

### Step 2: Verify every source and extract data points

For each source you plan to cite:
- **Fetch the URL** with `WebFetch` to confirm it exists and contains relevant content
- **Extract the actual data point** (salary number, growth %, etc.) from the page
- **Record**: title, publisher, URL, date, and the **exact quote or data point** from the page

### Step 3: Build the evidence file

**Before writing any card content**, create the evidence file:

```bash
# Evidence file path
supabase/migrations/evidence/<slug>.json
```

The evidence file maps every factual claim to its source. Structure:

```json
{
  "slug": "<slug>",
  "last_audited": "2026-07-23",
  "sources": [
    {
      "ref": 1,
      "title": "Software Developers — O*NET OnLine",
      "publisher": "O*NET / BLS",
      "url": "https://www.onetonline.org/link/summary/15-1252.00",
      "fetched_at": "2026-07-23",
      "status": "alive",
      "key_quotes": [
        "Projected growth: Much faster than average (17%)"
      ]
    }
  ],
  "claims": {
    "hook.stat": {
      "value": "7%+",
      "source_ref": 1,
      "source_quote": "Projected growth: 17% (much faster than average)",
      "note": "O*NET says 17% US, we use 7%+ as conservative Thailand estimate"
    },
    "hook.body": {
      "value": "junior hiring dropped 50%",
      "source_ref": 9,
      "source_quote": "junior IT hiring dropped by 50% in 2026",
      "note": null
    },
    "marketThailand.openings": {
      "value": "~800-1,000",
      "source_ref": 2,
      "source_quote": "825 Software Engineer positions",
      "note": "Live count from JobsDB, fluctuates"
    },
    "salaryProgression.levels[0].salary": {
      "value": "24,000-37,000฿",
      "source_ref": 2,
      "source_quote": "THB 18,000 - THB 66,000 (10th to 90th percentile)",
      "note": "Junior subset of full range"
    },
    "marketThailand.job_access.demand_score": {
      "value": 5,
      "source_ref": 9,
      "source_quote": "junior IT hiring dropped by 50%",
      "note": "Demand exists for seniors but not juniors"
    }
  }
}
```

**Rules for the evidence file:**
- Every number, percentage, score, or factual statement in any card MUST have a `claims` entry
- Each claim entry MUST have `source_ref` pointing to a source in the `sources` array
- Each claim entry MUST have `source_quote` — the actual text from the source page
- Each claim entry MUST have `applicability` — an object with `geographic`, `time`, `population` fields, each `"match"` or a string explaining the mismatch and how the number was adjusted
- If you cannot find a source for a claim, do NOT include the claim in the card. Omit it.
- If a source doesn't match geographically/temporally/by population, you MUST either find a better source OR adjust the number and document the adjustment in `note`
- Editorial opinions (e.g. "ต้องเรียนรู้ตลอดเวลา") don't need evidence entries — only factual claims do

Example claim with applicability:
```json
{
  "value": 50,
  "source_ref": 3,
  "source_quote": "71% secured positions within 180 days (CIRR standard)",
  "applicability": {
    "geographic": "Global, not Thailand-specific",
    "time": "Pre-AI crisis data — junior hiring dropped 50% since then",
    "population": "Bootcamp grads only, not all CS graduates"
  },
  "note": "Adjusted from 71% → 50% to account for junior hiring -50% (ARDURA 2026)"
}
```

### Step 4: Build the data file from evidence

Now write card content. **Every factual claim must trace back to the evidence file.** Run the seed script to generate a template:

```bash
node .claude/skills/radar-research/scripts/seed-template.mjs <slug>
```

Then fill in the JSON with researched data. The content is shaped by what sources say — never the other way around.

### Step 5: Pre-write validation (BLOCKS write if fails)

Before writing to any database, run ALL of these checks. **If any check fails, fix the issue before proceeding. Do NOT skip.**

- [ ] **Evidence file exists** at `supabase/migrations/evidence/<slug>.json`
- [ ] **Every source URL fetched and alive** — no 404s, no redirects to unrelated pages
- [ ] **Every factual claim has an evidence entry** — check `claims` object covers all numbers/stats in cards
- [ ] **Every evidence entry has a source_quote** — no empty quotes
- [ ] **source_refs on each card point to sources that actually support that card's claims** — cross-reference with evidence file
- [ ] **Salary figures match what the source actually says** — not training data, not rounded up
- [ ] **The `text` card at position 125** explains "ทักษะที่ใช้จริง" with practitioner-depth skill requirements
- [ ] **The skills card sounds like an expert** — field-specific fundamentals, workflows, judgment, tools/processes by context
- [ ] **Metrics are justified**: `demand_growth` (0-10), `saturation_level` (0-10), `progression_difficulty` (0-10)
- [ ] **`metrics.grad_employment_pct`** is a real percentage from a real source
- [ ] **`metrics.salary_floor` and `salary_ceiling`** are in THB/month from Thai sources
- [ ] **`tier`** is one of: `growing`, `shifting`, `exposed` — justified by the metrics
- [ ] **`ai_risk_score`** (0-10) is justified and not tripped by keyword matching
- [ ] **Score calculation matches formula** (see Score Calculation section)
- [ ] **Cross-card consistency check** (see below) — no contradictions between cards

### Cross-Card Consistency Check — MANDATORY

Data about the same topic lives in multiple places. If you update one, you MUST check and align the others. This check applies to BOTH research and audit modes.

**Demand signals (must tell the same story):**
- `radar_fields.research.metrics.demand_growth` → shown in Outlook card as "ความต้องการตลาด X/10"
- `marketThailand.job_access.demand_score` → shown in Competition card as "ความต้องการจ้าง X/10"
- These should be within 1 point of each other. If they differ by 2+, align them.

**Employment/hiring signals (must not contradict):**
- `radar_fields.research.metrics.grad_employment_pct` → shown in Outlook as "อัตราการจ้างจบใหม่ X%"
- `hook.statLabel` or `hook.body` → may mention hiring trends (e.g. "junior hiring ลดลง 50%")
- `risks` card → may mention hiring difficulty
- If the hook says "junior hiring dropped 50%" but grad_employment_pct is 72%, that's a contradiction. The metric must reflect the narrative.

**AI impact signals (must agree):**
- `radar_cards kind=aiImpact → ai_risk_score` → shown in AI Impact card
- `radar_fields.research.metrics` → indirectly affects tier/score
- `risks` card → may mention AI displacement
- If ai_risk_score is 7/10 but risks card doesn't mention AI, that's inconsistent.

**Salary signals (must match exactly):**
- `salary_floor` MUST equal the **lower bound** of `salaryProgression.levels[0].salary` (entry level). If entry says "24,000-37,000฿", floor must be 24,000.
- `salary_ceiling` MUST equal the **upper bound** of `salaryProgression.levels[-1].salary` (top level). If top says "130,000-220,000+฿", ceiling must be 220,000 — not 200,000, not a "conservative" round-down.
- The rule is simple: a student sees "220,000+" on the salary card and "200,000" on the Outlook card — that's a contradiction. Pick one number from one source and use it everywhere.
- When updating any salary figure, grep ALL cards + `research.metrics` for the old number before writing.

**Name consistency:**
- `radar_fields.name_th` must match the name used in: hook title/eyebrow, dayInLife title, cta title, text card titles, risks eyebrow
- If the field was renamed, grep ALL cards for the old name.

**Rule: When you change ANY metric or claim, scan all 13 cards + field research for related data points before writing.**

### Step 6: Write to DB + cross-field leaderboard

After passing all validations:
1. Write to both local and production (see Writing to DB section)
2. Run the **cross-field leaderboard check** (see below)

---

# MODE: audit

## Audit Flow

The audit has 6 phases. Show results after each phase and wait for user judgment before fixing.

### Phase 1: Source Health Check

Fetch every URL in the field's `sources` card items. Report:

```
## Source Health — <field_name>

| # | Source | Status | Last verified |
|---|--------|--------|---------------|
| 1 | O*NET 15-1252 | ✅ Live | 2026-07-23 |
| 2 | JobsDB salary | ✅ Live | 2026-07-23 |
| 3 | Robert Walters | ❌ 404 | never |
| 9 | ARDURA junior crisis | ✅ Live | 2026-07-23 |
```

For each live source, also check: does the page actually contain the data we cite? If not, mark as `⚠️ Live but data not found`.

### Phase 2: Claim Extraction & Evidence Check

For each card, extract every factual claim (numbers, stats, percentages, rankings, scores). Check against the evidence file if it exists (`supabase/migrations/evidence/<slug>.json`).

```
## Claim Audit — <field_name>

| Card | Claim | Source | Evidence file | Verdict |
|------|-------|--------|---------------|---------|
| hook | "7%+ growth" | [1] O*NET | ✅ Has entry | ✅ Matches |
| hook | "junior hiring ลดลง 50%" | [9] ARDURA | ✅ Has entry | ✅ Matches |
| marketThailand | "5,000+ ตำแหน่ง" | None | ❌ No entry | ❌ FABRICATED |
| salaryProgression | "Junior 24-37K" | [2] JobsDB | ⚠️ No entry | ⚠️ Close but unverified |
```

Verdicts:
- ✅ **Matches** — source confirms claim, evidence file has entry
- ⚠️ **Close** — source has related data but numbers don't exactly match
- ⚠️ **Stale** — evidence file exists but `fetched_at` is older than 6 months
- ⚠️ **Misapplied** — source is real but doesn't apply to what we're claiming (see below)
- ❌ **Fabricated** — no source supports this claim
- ❌ **Contradicted** — source says something different from the claim
- ❌ **No source** — claim references a source_ref that doesn't exist

### Phase 2.5: Source Applicability Check — CRITICAL

This is the most dangerous loophole in data integrity: **a claim can cite a real source with a real quote, but the source doesn't actually apply to the claim's context.** This passes all other checks but still produces misleading data.

For every claim that passed Phase 2 as ✅ or ⚠️, ask these three questions:

**1. Geographic match:** Does the source cover the same region as the claim?
- A US bootcamp placement rate (71-79%) cannot be used as Thailand's `grad_employment_pct`
- A global salary survey cannot set Thailand `salary_floor`
- Flag: `⚠️ Source is [region], claim is about [different region]`

**2. Time match:** Is the source still current given known market changes?
- A 2024 employment rate is invalid if 2025-2026 had a major market shift (e.g. AI crisis)
- If the hook or risks card mentions a recent disruption, ALL pre-disruption metrics must be adjusted
- Flag: `⚠️ Source is pre-[event], claim doesn't account for [event]`

**3. Population match:** Does the source measure the same group as the claim?
- Bootcamp grad placement ≠ all CS graduate employment
- Senior developer salary ≠ entry-level developer salary
- Global SWE demand ≠ Thailand junior SWE demand
- Flag: `⚠️ Source measures [group A], claim is about [group B]`

Report:
```
## Source Applicability — <field_name>

| Claim | Source | Geographic | Time | Population | Verdict |
|-------|--------|-----------|------|-----------|---------|
| grad_employment_pct: 72% | [3] Metana bootcamp | ❌ Global, not TH | ❌ Pre-AI crisis | ❌ Bootcamp only | ❌ MISAPPLIED |
| salary_floor: 25K | [2] JobsDB TH | ✅ Thailand | ✅ Current | ✅ SWE roles | ✅ Applicable |
| demand_growth: 5 | [1] O*NET | ⚠️ US data | ✅ 2024-2034 | ✅ SWE roles | ⚠️ Partial |
```

**If a claim is marked MISAPPLIED, it must be fixed** — either find an applicable source or adjust the number to account for the mismatch (with a note in the evidence file explaining the adjustment).

### Phase 3: Score Validation

Re-derive all scores from verified data. Compare against stored values.

```
## Score Validation — <field_name>

| Metric | Current | Suggested | Justification |
|--------|---------|-----------|---------------|
| demand_score | 7/10 | 5/10 | Junior hiring -50% [9], only ~825 listings [2] |
| competition_score | 5/10 | 7/10 | Bootcamp placement 71-79% [3], CS underemploy 42.5% |
| entry_barrier_score | 4/10 | 6/10 | Need portfolio + projects, not just cert |
| ai_risk_score | 3/10 | 7/10 | Sources [4,5] say AI reducing headcount |
| overall job_access | 63 | 40 | Formula: demand*50% + (10-comp)*25% + (10-barrier)*25% |
```

### Phase 3.5: Cross-Card Consistency Check

Check for contradictions between cards and field metrics. See the **Cross-Card Consistency Check** section (under pre-write validation) for the full list of signals to compare. Report:

```
## Cross-Card Consistency — <field_name>

| Signal pair | Card A | Card B | Status |
|-------------|--------|--------|--------|
| Demand: Outlook vs Competition | demand_growth=5 | demand_score=5 | ✅ Aligned |
| Employment: Outlook vs Hook | grad_employment_pct=50% | "junior hiring ลดลง 50%" | ✅ Consistent |
| AI: aiImpact vs Risks | ai_risk_score=7 | risks mentions AI displacement | ✅ Consistent |
| Salary: Progression vs Metrics | entry 24-37K | salary_floor=25K | ✅ Aligned |
| Name: field vs cards | "นักพัฒนาซอฟต์แวร์" | all cards use same name | ✅ Consistent |
```

Flag any ⚠️ or ❌ for the judgment report.

### Phase 4: Cross-Field Sanity Check

Query all published fields and compare. Flag anomalies.

```
## Cross-Field Comparison

| Field | demand | competition | ai_risk | score | tier |
|-------|--------|-------------|---------|-------|------|
| AI Engineer | 8 | 6 | 4 | 7 | growing |
| Cybersecurity | 7 | 5 | 3 | 7 | growing |
| Software Dev | 5 | 7 | 7 | 4 | shifting | ← auditing
| Data Scientist | 6 | 7 | 5 | 5 | shifting |

⚠️ Anomalies:
- None found (rankings make sense)
```

### Phase 5: Judgment Report

Summarize all findings in a single decision table:

```
## Judgment Report — <field_name>

### Must Fix (data integrity issues)
1. ❌ hook stat "25% growth" → should be "7%+" per O*NET [1]
2. ❌ marketThailand "5,000+ ตำแหน่ง" → should be "~825" per JobsDB [2]
3. ❌ ai_risk_score 3/10 → should be 7/10 per SO Survey [4] + WEF [5]

### Should Fix (accuracy improvements)
4. ⚠️ salaryProgression Junior range could be tighter per JobsDB data
5. ⚠️ source [3] Robert Walters URL is 404 — replace or remove

### OK (no action needed)
6. ✅ dayInLife steps are reasonable and sourced
7. ✅ risks card is honest and verified
```

**Wait for user to review and approve before proceeding to Phase 6.**

### Phase 6: Fix with Migration

After user approves:
1. Generate a migration SQL file: `supabase/migrations/YYYYMMDD_audit_fix_<slug>.sql`
2. Update (or create) the evidence file: `supabase/migrations/evidence/<slug>.json`
3. Apply with `supabase db push`
4. Run the cross-field leaderboard check
5. Print confirmation of what changed

---

# Cross-Field Leaderboard Check

Run this after ANY write (research or audit fix). Query all published fields and print comparison:

```sql
SELECT slug, name_en, score, tier,
  research->'metrics'->>'demand_growth' as demand,
  research->'metrics'->>'saturation_level' as saturation,
  research->'metrics'->>'salary_ceiling' as ceiling
FROM radar_fields
WHERE is_published = true
ORDER BY score DESC;
```

Print as a table. Flag if:
- A niche field scores higher than a mainstream high-demand field
- Any field's rank changed by more than 2 positions
- `salary_ceiling` exceeds what senior roles actually pay

---

# Evidence File System

Evidence files live at `supabase/migrations/evidence/<slug>.json`. They are NOT migration files — they are research artifacts that persist across sessions.

### When to create/update
- **research mode**: Always create before first DB write
- **audit mode**: Create or update during Phase 2 (claim extraction)
- **Any card fix**: Update the relevant claims in the evidence file

### Structure
See Step 3 in the research flow for the full schema.

### What counts as a "claim" that needs evidence
- Any number (salary, growth %, count of openings, scores)
- Any statistic or ranking
- Any "X% of Y" statement
- Any "X company/organization says Y" statement

### What does NOT need evidence
- Editorial framing ("ทุกธุรกิจต้องใช้ซอฟต์แวร์")
- Skill descriptions (unless they cite specific stats)
- CTA button text
- Source card items (they ARE the sources)

---

# Data Schema Reference

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
5. **Cross-field leaderboard** — run the leaderboard check (see above). Verify rankings make sense.

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

### Red flags that metrics are hallucinated or misapplied

- `research.sources` array is empty or has fewer than 3 entries
- `metric_details` entries have empty `sources` arrays
- A niche field scores higher than a mainstream high-demand field
- `salary_ceiling` exceeds what senior roles actually pay (check JobsDB/Glassdoor)
- `grad_employment_pct` is above 90% for a non-licensed profession
- `demand_growth` is 8+ but BLS shows flat or declining growth
- Evidence file doesn't exist or has fewer claims than the number of factual statements in cards
- **A metric uses global/US data for a Thailand-specific claim** — e.g. US bootcamp placement rate as Thailand `grad_employment_pct`
- **A metric uses pre-disruption data when the field has since been disrupted** — e.g. 2024 employment rate when 2026 had a 50% junior hiring drop
- **A metric measures a different population than claimed** — e.g. bootcamp grads ≠ all graduates, senior salaries ≠ entry salaries
- **Two cards show the same concept with different numbers** — e.g. Outlook "demand 8" but Competition "demand 5"

## Common Mistakes

- Using training data instead of fetching real sources — ALWAYS web search first
- **Writing plausible-looking metrics without sources** — this is the #1 integrity risk. Every number must trace to a URL.
- **Skipping the evidence file** — no evidence file = no way to audit later. Always create it.
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
- **Writing content first, then looking for sources to back it up** — this is backwards. Find sources first, then write content shaped by what sources say.
- **Updating one metric without checking related cards** — demand_growth (Outlook) and demand_score (Competition) MUST tell the same story. grad_employment_pct (Outlook) must not contradict hiring claims in hook/risks. Salary floor/ceiling must bracket salaryProgression range. ALWAYS run the cross-card consistency check.
