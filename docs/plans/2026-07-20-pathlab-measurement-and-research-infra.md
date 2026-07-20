# PathLab Measurement + Research Infra Plan

**Goal:** Make PathLab measure aptitude, not just interest, and make it safe for AI research subagents to author PathLab content at a defensible quality bar.

**Architecture:** Two independent tracks. The *measurement* track wires the previously-dead `path_activities` → `path_activity_progress` → `path_assessment_submissions` chain so student work produces signal. The *authoring* track codifies the editorial standard as doctrine, then teaches the generator and the validator to enforce it.

**Tech Stack:** Next.js App Router, Supabase (Postgres + RLS), TypeScript, Jest, AI SDK (DeepSeek via `lib/ai/modelRegistry`).

**Consumer:** Mobile app. Everything below is API/lib/schema; the web UI is not the target surface.

---

## Why this exists (diagnosis baseline)

PathLab measured *interest* well and *aptitude* not at all:

- `path_reflections` captured energy/confusion/interest per day plus quit-with-reason — a genuinely good affective instrument.
- `path_assessment_submissions` stored student work with **no column to score it**. Reports read identically regardless of work quality.
- The student runtime rendered from the legacy `path_days.node_ids` path, so the entire `path_activities` content system was authored but never consumed.

Production evidence at time of writing: **53** `path_activity_progress` rows of which only **5** had `time_spent_seconds` populated; **3** assessment submissions, **all unscored**; **12** assessments authored.

---

## Track A — Measurement (DONE)

Commits `afb89f35`, `b46ed680`, `a799074c`, `d72fe462`, `7df3713d` on `feat/pathlab-performance-signal`.

| Item | Where |
|---|---|
| Score/effort columns | `supabase/migrations/20260719130000_add_pathlab_performance_signal.sql` (applied to prod) |
| Quiz scoring, server-side | `lib/pathlab/scoring.ts` |
| Progress row creation + time accrual | `startPathActivity`, `addPathActivityTime` in `lib/supabase/pathlab-activities.ts` |
| Student endpoints | `app/api/pathlab/progress/route.ts`, `app/api/pathlab/assessments/submit/route.ts` |
| Aptitude in reports | `buildPathPerformanceSummary` in `lib/supabase/pathlab-reports.ts` |
| Content normalisation | `lib/pathlab/content-block.ts` |
| AI chat on DeepSeek | `app/api/pathlab/ai-chat/[activityId]/route.ts` |

Design notes worth preserving:
- `max_score` is **snapshotted** at scoring time so later assessment edits cannot retroactively rewrite past scores.
- Time accrual is **additive** and capped at 4h per flush, to survive a tab left open overnight.
- Blank quiz submissions score **zero**, not perfect. Questions with no `correct_option` leave the denominator rather than penalising the student.
- Correct options never reach the client; `rubric_scores` is stripped from submit responses.

### Not verified

The authenticated flow (open → heartbeat → submit → score → report) has **never been exercised end-to-end**. Unit tests and typecheck pass; the chain does not have a live run behind it.

---

## Track B — Research/authoring infra (PARTIAL)

### Done

- **`docs/pathlab-design-doctrine.md`** — the editorial standard. Core essence, backward-design order, evidence provenance rules, seven anti-generic rules, the five-day arc, a 20-point review checklist.
- **Evidence contract already existed** in `types/pathlab-generator.ts`: `PathLabCareerTruths`, `fitSignals`, `misfitSignals`, `mustExperience`, `mustUnderstand`, and the per-day `studentDecisionQuestion`.

### Remaining

**B1. Wire the doctrine into the generator prompt**
`lib/ai/pathlab-generator-prompts.ts` predates the doctrine and restates a subset of it inline. The two can drift silently. Import the doctrine's core essence and §4 gates into `buildPathLabSystemPrompt` so there is one source of truth. Small.

**B2. Build a `pathlab-research` skill**
No PathLab equivalent of `.claude/skills/radar-research/` exists. Mirror its research → verify → cite → write shape, but targeting `PathLabGeneratorRequest` instead of radar cards. This is the actual "research subagent readiness" gap. The operating prompt is in the appendix below and should become the skill body.

**B3. Automate §4 in `generation-quality.ts`**
The validator enforces structure only — DAG acyclicity, day counts, orphan nodes, quiz option integrity. It enforces **none** of the editorial rules. Highest-value two to machine-check:
- *Swap test* — flag any day with no career-specific noun (tool, artifact, jargon, named constraint).
- *Honesty tax* — assert at least one `mundaneButRequired` item is referenced by an activity that the student performs.

Until B3 lands, doctrine §6 must be run by a human or reviewing agent on every generated draft. **Structural validity is not quality.**

---

## Open questions

1. **Mobile auth model.** The endpoints built in Track A authorize via Supabase session cookies (`supabase.auth.getUser()` server-side). If the mobile app talks to Supabase directly with a bearer token rather than hitting these routes, the authorization chain needs revisiting.
2. **Content has no gradable output.** The Web Developer PathLab has zero assessments across five days, so §4.3 ("every day produces a student-made artifact") is currently violated by the only shipped PathLab. Scoring works but has nothing to score.
3. **Cohort percentile** (deferred): "are they good at it" needs a comparison baseline. Blocked on submission volume.

---

## Appendix — research subagent operating prompt

Point a subagent at this with a career and an expert transcript. This should become the body of the B2 skill.

```
You are researching and authoring a PathLab — a 5-day career exploration
experience for students.

READ FIRST: docs/pathlab-design-doctrine.md. It is the quality bar and it
overrides your instincts about what makes good learning content.

CORE ESSENCE
A PathLab is not a course. It is a decision instrument. Its purpose is to let
a student find out — cheaply, honestly, and in their own body — whether a
career is theirs. Success is a student who confidently says "not for me" on
day 3. Failure is a student who finishes all five days and still doesn't know.
Every day exists to answer one question the student cannot answer from the
outside. Every activity is real work drawn from the actual job, including the
parts practitioners find boring. Nothing is included because it is interesting
to teach; everything is included because it discriminates between students who
fit and students who don't.

PHASE 1 — EVIDENCE (do not skip)
Primary source is the expert interview. Map it onto PathLabCareerTruths:
mostImportant, mundaneButRequired, beginnersUnderestimate, hiddenChallenges,
rewardingMoments, noviceToExpertShifts, misconceptions. These are NOT
interchangeable — see doctrine §3 for what each one drives.

Where the interview is thin, research and cite. Verify every source resolves
and says what you claim. Prefer O*NET, BLS/OOH, professional and credential
bodies, and practitioner writing over content farms.

Interview wins for lived experience ("what the work feels like").
Research wins for market facts (pay, demand, credentials).
If neither supports a claim, cut it. Never invent career detail from priors —
a student may choose a career based on this.

PHASE 2 — BACKWARD DESIGN
Author strictly in this order, never in reverse:
  career truth → decision question → fit/misfit signal → activity → content

Content is last and smallest. If an activity needs 20 minutes of reading before
it can be attempted, the activity is scoped wrong, not the reading.

Each day maps to exactly one learning objective. studentDecisionQuestion is the
load-bearing field: it must be a question about the STUDENT, answerable only by
having done the day. If they could answer it accurately beforehand, it is not a
decision question. Not "do you understand X" — that is comprehension.

PHASE 3 — THE ARC
  Day 1  Real contact — actual work in hour one, no history lesson.
         Front-load a beginnersUnderestimate item; early self-selection is a feature.
  Day 2  Widen — a second mode of the work.
  Day 3  The mundane — the honesty tax. Deliberately least glamorous.
  Day 4  The difficulty — sourced from hiddenChallenges. Ambiguity, no clean answer.
  Day 5  Judgment — student interprets their own day-by-day reactions.
         Ends in an explicit fit decision. Not a recap.

Mundane BEFORE difficult. A student who tolerates boredom and is energised by
difficulty is the strongest possible fit signal; the reverse order lets a
hard-day high wash out the boredom response.

PHASE 4 — SELF-REVIEW before returning
Run doctrine §6. Hard gates:
  - SWAP TEST: replace the career name with a different career. If the day
    still reads sensibly, it is generic — rewrite it. Every day needs a detail
    that breaks on swap: a real tool, artifact, constraint, failure mode, or
    correctly-used piece of jargon.
  - HONESTY TAX: at least one mundaneButRequired item must be PERFORMED by the
    student, not described. Non-negotiable. Omitting it produces false
    positives — students who commit, arrive, and quit.
  - REAL OUTPUT: every day produces a student-made artifact. Watching and
    reading are not output. Recall quizzes measure whether they read the page.
  - STRUGGLE: at least one activity hard enough that some students won't finish
    cleanly. If everyone succeeds, the PathLab emits zero aptitude signal.
  - DISCONFIRMATION: at least one activity where "this isn't for me" is a
    plausible, non-shameful outcome. Otherwise it is a marketing funnel.
  - No guaranteed outcome, medical, or legal claims.

State explicitly which career truth each day draws on, and flag anything you
could not source.
```
