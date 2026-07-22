# My Path and Parent Journey Design

**Status:** Approved
**Date:** 2026-07-22

## Problem

PassionSeed currently tells a student that their plan was saved to “My Path,” but the confirmation has no link and `/me` does not render the persisted plan. `/plan`, `/me`, Radar, and PathLab therefore feel like separate products.

The trial payment flow has a second break. The student is asked to forward a payment link, while the parent page leads with payment mechanics instead of explaining the educational outcome. Parents cannot opt in to useful progress updates, and students may interpret “start” as an immediate financial commitment.

## Product Premises

1. `/me` is the durable My Path home. `/plan` is the focused plan creator and editor.
2. The first dashboard question is “What should I do next today?” rather than “Which PassionSeed feature should I open?”
3. Radar creates hypotheses, PathLab tests them, and My Path turns the resulting evidence into a next action.
4. Students must see the price and terms before starting, but should also understand that there is no automatic charge and they can start the first activity before the parent pays.
5. Parents buy an understandable outcome: real work, a career-fit signal, a progress summary, and credit toward the larger sprint. They do not buy access to screens.
6. Parent updates require verified consent, strict content boundaries, an unsubscribe path, and frequency limits.

## Approaches Considered

### A. Link and Copy Patch

Add a `/me` link to the save confirmation, show a plan card on `/me`, improve payment copy, and collect a parent email.

- Lowest implementation cost.
- Leaves Plan, Radar, and PathLab conceptually disconnected.
- Captures an email without delivering a complete update experience.

### B. Unified My Path Hub — Recommended

Make `/me` the server-rendered source of truth for the student's plan, Radar shortlist, PathLab activity, evidence, and next action. Keep `/plan` as the editor. Rebuild the public parent page around value, trust, explicit consent, and milestone updates.

- Resolves the navigation and product-model ambiguity.
- Creates one coherent student loop without rewriting the mature Radar or PathLab experiences.
- Adds a complete, privacy-conscious parent relationship.

### C. Embed Plan Creation in `/me`

Retire `/plan` as a distinct page and place the wizard inside the dashboard.

- Produces one route eventually.
- Makes the dashboard heavy and couples editing state to the daily-use home.
- Creates unnecessary migration risk for existing plan links and anonymous drafts.

## Student Information Architecture

The `/me` page becomes “My Path” and renders these sections in order:

1. **Next action today** — resume the current PathLab activity, choose a matching PathLab, or create a plan.
2. **2–4 month plan** — goal, timeline, expected outcomes, and current month; links to `/plan?resume=1` to edit.
3. **Radar shortlist** — up to three saved directions, with a clear exploration status.
4. **PathLab experiments** — selected, active, pending-payment, paid, expired, and completed states.
5. **Evidence** — completed artifacts and career-fit signals.
6. **Supporting reflection and Journey Map** — existing features remain accessible but no longer dominate the page.

The primary navigation labels `/me` as “My Path / เส้นทางของฉัน.” The duplicate top-level Plan destination is removed; creation and editing live as contextual actions inside `/me`. Existing `/plan` URLs continue to work.

After a successful save, the wizard displays a real link:

> บันทึกไว้ใน My Path แล้ว
> ไปดู My Path ของฉัน →

The destination is `/me#my-path`.

## Canonical Radar Loop

The My Path shortlist is canonical in `my_path_possibilities`; raw Radar analytics remain measurement data and never become dashboard state by themselves.

- An authenticated Radar “interested/save” action appends an idempotent `career_saved` My Path event and upserts the possibility to `saved`.
- An authenticated “not interested/remove” action appends `career_removed` and updates the possibility without deleting history.
- Opening a Radar field records `radar_profile_opened`; a submitted reflection remains in `radar_reflections` and is surfaced as evidence by the existing My Path reader.
- Anonymous Radar intent is queued locally with a client event ID. On authentication, the client submits the queue to the same authenticated endpoint; duplicate client IDs are ignored by the existing My Path event uniqueness constraint.
- The `/plan` wizard reads the same persisted possibilities, so changing the shortlist in Radar and then opening the editor shows the updated choices.

This v1 syncs field-level interest. Start-option analytics inside a Radar story remain analytics unless they map to a known planning-registry career slug.

## Deterministic Next-Action Rules

The dashboard applies the first matching rule in this order:

| State | Primary action | Destination |
|---|---|---|
| Persisted plan unavailable because the read failed | Retry My Path | `/me` refresh action |
| No persisted plan | Create My Path | `/plan` |
| Accessible active enrollment with incomplete activities | Resume the current activity/day | `/seeds/pathlab/:enrollmentId?day=:currentDay` |
| Accessible paused enrollment | Choose whether to resume the saved experiment | `/seeds/pathlab/:enrollmentId?day=:currentDay` |
| Quit enrollment | Use the recorded negative signal to choose a different experiment | `/plan?resume=1` |
| Completed PathLab with another selected experiment | Start the next experiment | that seed's launch flow |
| Completed PathLab with no next experiment | Review evidence and refine the plan | `/plan?resume=1` |
| Expired trial that blocks an otherwise incomplete selected experiment | Ask parent to restore access | existing `/pay/:token` sharing flow |
| Selected PathLab without enrollment or expired trial | Start the first day | combined trial/enrollment launch |
| Plan without a selected PathLab | Choose a matching PathLab | `/plan?resume=1` at the PathLab step when available, otherwise `/plan?resume=1` |

Trial states `active`, `pending`, and `paid` never replace an available learning action. They appear as secondary status. An enrollment is accessible when its trial is active, pending, or paid, or when that enrollment is exempt from trial gating. Completion is `path_enrollments.status = 'explored'` or a non-null end reflection. Quit/completed signals and any other accessible experiment outrank payment recovery for an unrelated expired trial. Current day and activity come from `path_enrollments.current_day`, `path_days`, `path_activities`, and `path_activity_progress`. When more than one enrollment can produce the same priority action, the enrollment with the most recent activity-progress timestamp wins, then the latest `enrolled_at`, then enrollment ID for a stable final tie-break. Evidence v1 includes a completed PathLab report/artifact when present and a privacy-safe fit signal derived from completion/performance metadata; it never includes raw reflections on the dashboard.

## Student Launch Experience

The first PathLab CTA is:

> เริ่มวันแรกก่อนได้ — ยังไม่ต้องจ่ายตอนนี้

Adjacent disclosure states:

> ทดลองครบ PathLab ฿1,490 · ส่งให้ผู้ปกครองชำระภายใน 24 ชม. · ไม่มีการตัดเงินอัตโนมัติ

The post-click sheet reassures the student that:

- the first activity is available immediately;
- no card or automatic payment is involved;
- the parent receives a page with full details before deciding;
- the saved plan remains available if they stop.

Price and timing are never hidden. The language reduces fear by clarifying control, not by obscuring the obligation.

The launch operation idempotently creates or resumes both the trial and the PathLab enrollment and returns the enrollment URL. If trial creation succeeds but enrollment creation fails, the retry reuses the existing trial and attempts only the missing enrollment. The UI never claims the first activity is ready until both records exist.

## Parent Conversion Page

The parent payment page uses the Dawn theme, which the design system assigns to students and parents. Its hierarchy is:

1. The PathLab the child chose.
2. Why it connects to the child's current My Path and Radar interests.
3. What the child will do.
4. What the family receives:
   - completed work or portfolio evidence;
   - a clearer career-fit signal;
   - a concise progress summary;
   - full credit toward Admission Evidence Sprint.
5. Transparent price and trial-access deadline.
6. Optional verified parent progress updates.
7. PromptPay and slip upload.
8. FAQ covering time commitment, privacy, access, and what happens next.

The 24-hour countdown explains access state. It is not the primary sales device. The page does not invent discounts, testimonials, refunds, or guarantees.

On mobile, the first viewport contains the PathLab title, one tailored connection to the student's saved direction (or a generic “chosen as part of My Path” fallback), three concise outcomes, the full ฿1,490 price, and a “ดูวิธีชำระ” anchor CTA. PromptPay remains below the value story. Desktop keeps the same reading order in a two-column layout with the value story on the left and a sticky payment summary on the right.

The public token projection may expose only: seed title and public description, total days, price, deadline/status, one saved Radar direction title, and pre-authored outcome labels. It never exposes the student's name, email, reflection text, answers, chat, scores, or notes. If no plan or matching Radar data exists, the page uses the generic connection copy.

## Parent Email Updates

The public payment page accepts an optional parent email with explicit consent. Submission sends a verification email. No progress update is sent until the address is verified.

Allowed messages are:

- verification and unsubscribe confirmation;
- PathLab started;
- a meaningful day or milestone completed;
- PathLab completed;
- payment received or access status changed;
- a concise next-step summary.

Private reflection text, assessment answers, chat content, notes, and sensitive student data are never included.

Updates are aggregated to at most one progress message per 24 hours. Transactional payment messages are not subject to that aggregation. Every non-transactional email includes an unsubscribe action.

Parent contacts live in a dedicated protected table attached to a trial. Anonymous clients receive no direct table privileges. A validated and rate-limited server route performs token lookup and writes through a privileged server client. Verification and unsubscribe use random bearer tokens that are always stored as hashes.

V1 supports one active parent contact per trial. The form requires the recipient to attest that they are a parent/guardian or have the family's permission to receive updates. Email verification proves address control, not legal guardianship; the product states that boundary honestly. The student sees the masked verified address and can revoke updates from `/me`.

All new verification and unsubscribe tokens are random, stored only as SHA-256 hashes, and compared by hash. Verification tokens expire after 30 minutes; resend rotates the token and invalidates the previous one. Verification endpoints are idempotent after success. Unsubscribe tokens remain valid until the contact is removed or resubscribed, and unsubscribe is replay-safe.

## Notification Delivery Contract

Database triggers create safe outbox events for these transitions:

- `path_enrollments` insert → `pathlab_started`;
- `path_activity_progress` first transition to `completed` → `milestone_completed`;
- `path_enrollments` first transition to `explored` → `pathlab_completed`;
- stored `trial_accesses.status` change → `payment_status_changed`.

Lazy deadline expiry is deliberately excluded from email in v1 because `expired` is derived at read time rather than persisted. Parents see expiry on the pay page; pending and paid stored transitions may generate transactional messages.

Each event uses `subscription_id:event_kind:source_table:source_id:source_state` as its unique idempotency key. Milestone events due within the same 24-hour window are aggregated into one progress email. Transactional verification, unsubscribe, and payment-state messages are delivered separately.

An authenticated Vercel Cron route claims due rows, sends through Resend, and marks them delivered. It retries transient failures up to five times with exponential backoff (5, 10, 20, 40, and 80 minutes). Permanent provider rejection or five failed attempts moves a row to `failed` with a non-sensitive error code for admin inspection. A lease timestamp prevents concurrent workers from double-sending.

## Data Flow

1. `/plan` continues saving the journey through `sync_my_path_journey`.
2. `/me` loads the persisted My Path snapshot on the server and separately loads PathLab/trial progress required for the dashboard.
3. A small presentation model converts those sources into stable dashboard states and a single next action.
4. Starting the first PathLab idempotently creates or resumes both the trial and PathLab enrollment, then returns the enrollment URL.
5. A parent contact submission validates the pay token, stores consent, and sends verification.
6. Verified milestone events enter a protected outbox. Delivery is idempotent and frequency-limited.

## Error and Empty States

- No saved plan: invite the student to build one.
- Plan without a selected PathLab: recommend a matching experiment.
- Active trial: resume work and show payment status without blocking the main task.
- Pending or paid trial: continue access and report the correct state.
- Expired trial: preserve plan data and provide a clear parent-payment recovery action.
- Dashboard read failure: retain navigation and display a retryable fallback.
- Invalid parent email: inline validation without losing payment-page state.
- Verification already used: show a safe success state.
- Email provider failure: preserve consent and allow a rate-limited resend.
- Unsubscribed contact: never enqueue new progress messages.

| Feature | Loading | Success | Recoverable failure |
|---|---|---|---|
| `/me` shell | Dawn skeleton for the hero | Independent sections render | Failed section shows a compact retry while other sections remain usable |
| Plan save | Disabled CTA + status | Link to `/me#my-path` | Local draft remains and retry is offered |
| Trial/enrollment launch | Single progress state | Navigate to enrollment | Existing trial is reused on retry; no duplicate charge/access row |
| Parent opt-in | Inline submit progress | “Check your email” with masked address | Preserve email, show error, and rate-limit resend |
| Verification | Verifying state | Safe confirmed state | Expired token offers a resend path without exposing trial data |
| Outbox delay | No blocking UI | Updates arrive asynchronously | Payment and learning access continue even if email delivery fails |
| Slip upload | Existing preview/progress | Pending review | Existing retry behavior remains |

On mobile, the next-action CTA remains in the first viewport and sections stack in decision order. Desktop may use two columns after the hero, but DOM and keyboard order remain Plan → Radar → PathLab → Evidence. Each server-read section degrades independently rather than turning the entire `/me` page into an error screen.

## Accessibility and Visual System

- Student and parent surfaces use Dawn atmospheric tokens and Thai typography rules.
- Existing `.ei-card`, `.ei-button-dawn`, `.ei-input`, and Shadcn primitives are reused rather than redefined inline.
- A documented `.dawn-theme .ei-card` token override/modifier is added in `app/globals.css`; it preserves the shared card/glow structure while changing the Dusk amber material to Dawn blue/gold. Components do not redefine the card inline.
- Any new glow animates clip-path, opacity, and filter together.
- Hover-in uses tension keyframes; hover-out snaps back quickly.
- Touch states use `IntersectionObserver` and `@media (hover: none)`.
- Controls meet 48px touch targets, visible focus requirements, and WCAG AA contrast.
- Reduced-motion behavior remains functional and calm.

## Testing

Implementation follows red-green-refactor.

- Domain tests cover dashboard state and next-action selection.
- Server-read tests cover saved plan, Radar choices, PathLab progress, and degraded reads.
- Component tests cover empty, partial, active, paid, completed, and error states.
- Wizard tests require a visible `/me#my-path` link after save.
- Parent page tests cover the value hierarchy, transparent price, consent states, and payment states.
- API tests cover invalid tokens, invalid emails, consent, verification, resend limits, unsubscribe, and idempotency.
- Migration contract tests require RLS and no anonymous table access.
- Final verification runs focused tests, lint, production build, and browser QA at mobile and desktop widths.

## Success Criteria

- A saved plan always has an obvious destination.
- `/me` communicates the student's next action within the first viewport.
- Radar choices and PathLab work visibly affect the plan.
- A student can start without fearing an automatic charge or losing their plan.
- A parent can explain what ฿1,490 buys after reading the first screen.
- Parent email updates require verified consent and never expose private student content.
- Existing saved plans, trials, and Journey Map data remain compatible.

## V1 Non-Goals

- Parent accounts or a parent portal.
- More than one parent contact per trial.
- SMS, LINE, or push progress updates.
- Private reflection, assessment-answer, chat, or note excerpts in parent communication.
- A new billing provider, subscription billing, discounts, or refund policy.
- Replacing the existing Journey Map or embedding the plan wizard inside `/me`.
