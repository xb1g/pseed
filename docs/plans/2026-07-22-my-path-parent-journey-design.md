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

Parent contacts live in a dedicated protected table attached to a trial. Anonymous clients receive no direct table privileges. A validated and rate-limited server route performs token lookup and writes through a privileged server client. Verification and unsubscribe use random bearer tokens stored as hashes where practical.

## Data Flow

1. `/plan` continues saving the journey through `sync_my_path_journey`.
2. `/me` loads the persisted My Path snapshot on the server and separately loads PathLab/trial progress required for the dashboard.
3. A small presentation model converts those sources into stable dashboard states and a single next action.
4. Starting the first PathLab creates or resumes the existing idempotent trial.
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

## Accessibility and Visual System

- Student and parent surfaces use Dawn atmospheric tokens and Thai typography rules.
- Existing `.ei-card`, `.ei-button-dawn`, `.ei-input`, and Shadcn primitives are reused rather than redefined inline.
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

