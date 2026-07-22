# My Path and Parent Journey Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Make `/me` the durable My Path home, connect Plan → Radar → PathLab into one next-action journey, and replace the trial payment wall with a trustworthy parent conversion and consented update flow.

**Architecture:** `/plan` remains the editor and persists through the existing My Path RPC. Authenticated and locally queued Radar intent writes into the same My Path event stream. A new server-side dashboard reader composes the persisted plan with PathLab enrollments and trial status into a deterministic presentation model consumed by `/me`. Parent contacts, hashed verification/unsubscribe tokens, and a notification outbox live in additive RLS-protected Supabase tables; public token routes validate input and use server-side privileged operations, while an authenticated cron worker delivers verified updates through Resend.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, TailwindCSS, Shadcn/ui, Supabase/PostgreSQL/RLS, Resend, Jest, React Testing Library.

---

### Task 1: Give Saved Plans a Real Home

**Files:**
- Modify: `components/my-path/__tests__/PlanWizard.test.tsx`
- Create: `components/main-nav.test.tsx`
- Modify: `components/my-path/wizard/StepMission.tsx`
- Modify: `components/main-nav.tsx`

**Step 1: Write the failing save-destination test**

Add a signed-in wizard test that reaches the mission step with a persisted plan and expects:

```tsx
expect(
  screen.getByRole("link", { name: /ไปดู My Path ของฉัน/ })
).toHaveAttribute("href", "/me#my-path");
```

Add a navigation assertion that `/me` is labeled “My Path”/“เส้นทางของฉัน” and that `/plan` is no longer a duplicate top-level destination.

**Step 2: Run the focused test and confirm RED**

Run: `pnpm test components/my-path/__tests__/PlanWizard.test.tsx components/main-nav.test.tsx --runInBand`
Expected: FAIL because the saved state is plain text and navigation still includes `/plan`.

**Step 3: Implement the minimal destination and navigation changes**

- Render the saved confirmation as a status message plus a `Link` to `/me#my-path`.
- Keep the existing saved/error semantics.
- Rename the `/me` navigation label to My Path and remove the separate Plan item from desktop and mobile navigation.
- Do not remove the `/plan` route.

**Step 4: Verify GREEN**

Run: `pnpm test components/my-path/__tests__/PlanWizard.test.tsx components/main-nav.test.tsx --runInBand`
Expected: PASS.

**Step 5: Commit**

```bash
git add components/my-path/__tests__/PlanWizard.test.tsx components/my-path/wizard/StepMission.tsx components/main-nav.tsx components/main-nav.test.tsx
git commit -m "feat(my-path): link saved plans to their dashboard"
```

### Task 2: Make Radar Feed the Canonical My Path Shortlist

**Files:**
- Create: `lib/my-path/radar-sync.ts`
- Create: `lib/my-path/__tests__/radar-sync.test.ts`
- Create: `app/api/my-path/radar/route.ts`
- Modify: `components/radar/RadarFieldPageClient.tsx`
- Modify: `lib/supabase/radar.ts`
- Modify: `lib/my-path/server-mutation.ts`
- Modify: `lib/my-path/__tests__/server-mutation.test.ts`

**Step 1: Write failing sync-domain tests**

Cover locally queued anonymous events, stable client event IDs, authenticated flush, duplicate flush safety, known planning-registry slugs, and mappings:

```ts
opened -> radar_profile_opened
interested | saved -> career_saved
not_interested | dismissed -> career_removed
```

Unknown start-option slugs remain Radar analytics and must not enter My Path.

**Step 2: Verify RED**

Run: `pnpm test lib/my-path/__tests__/radar-sync.test.ts lib/my-path/__tests__/server-mutation.test.ts --runInBand`
Expected: FAIL because Radar has no My Path ingress.

**Step 3: Implement the authenticated endpoint and local queue**

- Validate with Zod and authenticate with `getUser()`.
- Append events through an RPC/server mutation that preserves the existing `client_event_id` uniqueness contract.
- Queue anonymous field-level events in local storage and flush after auth state changes.
- Never translate arbitrary Radar start-option IDs into career slugs.
- Keep raw `radar_path_intents` and `radar_field_views` analytics intact.

**Step 4: Connect the Radar field client**

Record a field open once per mount and save/remove the field slug when the final intent is interested/not-interested. Submitting a Radar reflection continues using the existing reflection sync and is read as evidence by My Path.

**Step 5: Verify GREEN**

Run: `pnpm test lib/my-path/__tests__/radar-sync.test.ts lib/my-path/__tests__/server-mutation.test.ts --runInBand`
Expected: PASS.

**Step 6: Commit**

```bash
git add lib/my-path/radar-sync.ts lib/my-path/__tests__/radar-sync.test.ts app/api/my-path/radar/route.ts components/radar/RadarFieldPageClient.tsx lib/supabase/radar.ts lib/my-path/server-mutation.ts lib/my-path/__tests__/server-mutation.test.ts
git commit -m "feat(my-path): sync Radar intent into the journey"
```

### Task 3: Build the My Path Dashboard Presentation Model

**Files:**
- Create: `lib/my-path/dashboard.ts`
- Create: `lib/my-path/__tests__/dashboard.test.ts`
- Create: `lib/my-path/dashboard-read.ts`
- Create: `lib/my-path/__tests__/dashboard-read.test.ts`
- Modify: `lib/my-path/server-read.ts`

**Step 1: Write failing domain tests**

Define tests for a pure `buildMyPathDashboard` function covering:

- no persisted plan → `create-plan` next action;
- saved plan without a selected PathLab → `choose-pathlab`;
- selected PathLab without enrollment → `start-pathlab`;
- active enrollment → `resume-pathlab` with `/seeds/pathlab/:enrollmentId`;
- paused enrollment → resumable saved experiment;
- quit enrollment → choose a different experiment;
- completed/explored enrollment → evidence and a next recommendation;
- multiple eligible enrollments → most recent activity progress, then `enrolled_at`, then stable ID;
- active, pending, paid, and expired trial labels;
- saved Radar directions are limited to three and retain stable order.
- accessible enrollments and terminal quit/completed signals outrank an unrelated expired trial; expiry recovery applies only when it blocks the otherwise-next incomplete experiment.

Use an explicit result shape:

```ts
interface MyPathDashboardModel {
  state: "empty" | "planned" | "active" | "completed";
  nextAction: { kind: string; title: string; detail: string; href: string };
  plan: { goal: string | null; timelineMonths: number; headline: string } | null;
  radarDirections: Array<{ slug: string; title: string; href: string }>;
  pathlabs: MyPathPathlabSummary[];
  evidence: MyPathEvidence[];
}
```

**Step 2: Verify domain tests fail**

Run: `pnpm test lib/my-path/__tests__/dashboard.test.ts --runInBand`
Expected: FAIL because the module does not exist.

**Step 3: Implement the pure model minimally**

Reuse `getSavedPossibilities`, `getSelectedPathlabs`, `getLockedGoal`, `getGoalTimeline`, and `buildMissionPlan`. Keep query concerns out of this module.

**Step 4: Verify domain tests pass**

Run: `pnpm test lib/my-path/__tests__/dashboard.test.ts --runInBand`
Expected: PASS.

**Step 5: Write failing server-reader tests**

Use a narrow mock client contract and assert queries for:

- the signed-in user's `path_enrollments` joined through `paths(seed)`;
- relevant `trial_accesses`;
- completed activity counts without loading private reflection bodies;
- graceful empty arrays when a non-critical query fails.

**Step 6: Verify reader tests fail**

Run: `pnpm test lib/my-path/__tests__/dashboard-read.test.ts --runInBand`
Expected: FAIL because the reader does not exist.

**Step 7: Implement the reader and compose with persisted My Path**

Use authenticated server queries only. Log database errors without exposing details to the client. Return a stable source object for `buildMyPathDashboard`.

**Step 8: Verify reader and existing My Path tests**

Run: `pnpm test lib/my-path/__tests__/dashboard.test.ts lib/my-path/__tests__/dashboard-read.test.ts lib/my-path/__tests__/server-read.test.ts --runInBand`
Expected: PASS.

**Step 9: Commit**

```bash
git add lib/my-path/dashboard.ts lib/my-path/dashboard-read.ts lib/my-path/server-read.ts lib/my-path/__tests__
git commit -m "feat(my-path): compose dashboard journey state"
```

### Task 4: Redesign `/me` Around the Next Action

**Files:**
- Create: `components/my-path/MyPathDashboard.tsx`
- Create: `components/my-path/__tests__/MyPathDashboard.test.tsx`
- Modify: `app/me/page.tsx`
- Modify: `app/me/loading.tsx`
- Modify: `app/globals.css`
- Modify: `docs/ui-design-system.md`

**Step 1: Write failing component tests**

Cover the empty, planned, active, expired-trial, and completed models. Assert:

- the first heading and CTA describe the next action;
- the plan editor link is `/plan?resume=1`;
- Radar links use `/radar/:slug`;
- active PathLabs link to the enrollment route;
- payment status is secondary to the learning action;
- Journey Map and reflection remain reachable below the core loop.

**Step 2: Verify component tests fail**

Run: `pnpm test components/my-path/__tests__/MyPathDashboard.test.tsx --runInBand`
Expected: FAIL because the component does not exist.

**Step 3: Implement the Dawn dashboard**

Build small internal sections (`NextActionHero`, `PlanSummary`, `RadarShortlist`, `PathlabExperiments`, `EvidenceSection`, `SupportingJourneyLinks`) in the same file unless reuse proves necessary. Use Thai-first copy, `.ei-card`, `.ei-button-dawn`, existing typography tokens, 48px touch targets, reduced motion, and the existing in-view helper for touch animation. Add and document a globals-level Dawn modifier/override for `.ei-card` so student cards do not inherit Dusk amber material.

**Step 4: Connect the server page**

In `app/me/page.tsx`, authenticate with the existing SSR client, load the persisted My Path and dashboard sources in parallel where safe, build the model, and render `MyPathDashboard`. Preserve redirects and avoid client-side auth/data waterfalls.

**Step 5: Verify component tests and type safety**

Run: `pnpm test components/my-path/__tests__/MyPathDashboard.test.tsx --runInBand`
Expected: PASS.

Run: `pnpm exec tsc --noEmit`
Expected: no new TypeScript errors.

**Step 6: Commit**

```bash
git add app/me/page.tsx app/me/loading.tsx app/globals.css docs/ui-design-system.md components/my-path/MyPathDashboard.tsx components/my-path/__tests__/MyPathDashboard.test.tsx
git commit -m "feat(my-path): make me the student journey home"
```

### Task 5: Add Verified Parent Update Subscriptions and Atomic Launch

**Files:**
- Create via `supabase migration new parent_pathlab_updates`: `supabase/migrations/<generated>_parent_pathlab_updates.sql`
- Create: `lib/trials/parent-updates.ts`
- Create: `lib/trials/__tests__/parent-updates.test.ts`
- Create: `lib/trials/parent-email.ts`
- Create: `app/api/trials/[token]/parent-updates/route.ts`
- Create: `app/api/trials/parent-updates/verify/[verificationToken]/route.ts`
- Create: `app/api/trials/parent-updates/unsubscribe/[unsubscribeToken]/route.ts`
- Create: `app/api/cron/parent-pathlab-updates/route.ts`
- Modify: `app/api/trials/route.ts`
- Create: `lib/trials/__tests__/start-trial.test.ts`
- Modify: `vercel.json`
- Modify: `lib/my-path/__tests__/migration-contract.test.ts`

**Step 1: Verify current Supabase documentation before schema work**

Read the current official documentation for RLS, security-definer functions, and scheduled delivery. Keep the migration additive and idempotent because this repository applies migrations production-first.

**Step 2: Create the migration through the CLI**

Run: `npx supabase migration new parent_pathlab_updates`
Expected: a generated timestamped migration file.

**Step 3: Write failing migration contract tests**

Assert that the migration contains:

- `parent_pathlab_subscriptions` with a unique `trial_access_id`, normalized email, consent/attestation timestamp, verified timestamp, unsubscribe state, required hashed verification/unsubscribe tokens, verification expiry, and delivery timestamps;
- `parent_pathlab_update_outbox` with an idempotency key, event kind, safe payload, status, attempt count, and scheduled/delivered timestamps;
- RLS enabled on both tables;
- no anonymous or authenticated direct DML grants;
- private trigger functions with an empty `search_path` and explicitly qualified names;
- indexes for due outbox rows and token hashes.

**Step 4: Verify migration tests fail**

Run: `pnpm test lib/my-path/__tests__/migration-contract.test.ts --runInBand`
Expected: FAIL before the migration is implemented.

**Step 5: Implement the additive schema and trigger/outbox behavior**

- Queue `pathlab_started` on enrollment insert, `milestone_completed` on the first progress transition to completed, `pathlab_completed` on the first enrollment transition to explored, and `payment_status_changed` on stored trial status changes. Do not emit lazy deadline-expiry email in v1.
- Never copy reflection text, chat content, answers, or notes into the outbox.
- Use `subscription:event:source-table:source-id:source-state` idempotency keys to prevent duplicate notifications.
- Keep outbox and subscription tables inaccessible to anonymous clients.
- Extend the token RPC with a privacy-safe parent projection only: public seed description, total days, one saved Radar title, authored outcomes, price, deadline, and status.

**Step 6: Write failing domain/API tests**

Test email normalization, mandatory token hashing, consent attestation, invalid/unknown pay tokens, one-contact cardinality, idempotent resubscribe, 30-minute verification expiry/rotation, resend throttling, replay-safe unsubscribe, student revoke, cron authorization, aggregation, lease safety, retry backoff, and terminal failure. Mock Resend only at the transport boundary.

**Step 7: Verify parent-update tests fail**

Run: `pnpm test lib/trials/__tests__/parent-updates.test.ts lib/trials/__tests__/start-trial.test.ts --runInBand`
Expected: FAIL because the modules/routes do not exist.

**Step 8: Implement domain helpers, routes, and email transport**

- Validate all route inputs with Zod.
- Resolve public pay tokens through the existing `get_trial_by_token` RPC.
- Store only hashed verification and unsubscribe tokens.
- Use `RESEND_API_KEY` and `RESEND_FROM_EMAIL`; fail gracefully when email is not configured.
- Verification and unsubscribe responses reveal no unrelated trial/student data.
- Cron delivery requires `Authorization: Bearer ${CRON_SECRET}`.
- Aggregate progress updates so a subscription receives at most one non-transactional message per 24 hours.
- Retry transient delivery five times at 5/10/20/40/80 minutes, lease claimed rows, and terminally fail permanent rejection or exhausted attempts with a non-sensitive code.
- Require the recipient attestation, show the student a masked verified address, and allow the authenticated trial owner to revoke it.

**Step 9: Make launch create both trial and enrollment**

Change `POST /api/trials` so it idempotently creates/resumes the trial and PathLab enrollment, then returns `enrollmentId` and `enrollmentUrl`. If enrollment fails after trial creation, the next request reuses the trial and retries the missing enrollment. Do not report launch success until both exist.

**Step 10: Verify backend tests**

Run: `pnpm test lib/trials/__tests__/parent-updates.test.ts lib/trials/__tests__/start-trial.test.ts lib/my-path/__tests__/migration-contract.test.ts --runInBand`
Expected: PASS.

**Step 11: Commit**

```bash
git add supabase/migrations lib/trials app/api/trials app/api/cron/parent-pathlab-updates vercel.json lib/my-path/__tests__/migration-contract.test.ts
git commit -m "feat(trials): add verified parent progress updates"
```

### Task 6: Rebuild the Student and Parent Conversion Surfaces

**Files:**
- Create: `components/trials/ParentUpdateOptIn.tsx`
- Create: `components/trials/__tests__/ParentUpdateOptIn.test.tsx`
- Create: `components/trials/__tests__/PayPageClient.test.tsx`
- Modify: `components/my-path/wizard/PayLaterSheet.tsx`
- Modify: `components/trials/TrialGate.tsx`
- Modify: `components/trials/PayPageClient.tsx`
- Modify: `components/trials/TrialShareActions.tsx`
- Modify: `app/pay/[token]/page.tsx`
- Modify: `components/my-path/MyPathDashboard.tsx`

**Step 1: Write failing student-launch tests**

Assert the student sees:

- “เริ่มวันแรกก่อนได้ — ยังไม่ต้องจ่ายตอนนี้”;
- the full ฿1,490 price and 24-hour term before starting;
- “ไม่มีการตัดเงินอัตโนมัติ”;
- reassurance that the plan remains saved;
- the parent link only after the trial is created.
- navigation to the returned enrollment URL only after both trial and enrollment exist.

**Step 2: Write failing parent-conversion tests**

Assert the first payment screen explains:

- what the child chose;
- what they will do;
- what evidence and progress summary the family receives;
- full credit toward Admission Evidence Sprint;
- transparent price;
- optional email consent before PromptPay;
- private reflections are not shared.
- the first mobile viewport contains the title, one tailored/fallback connection, three outcomes, full price, and a payment-anchor CTA.

Test opt-in idle, submitting, verification-sent, validation-error, and retry states.

**Step 3: Verify UI tests fail**

Run: `pnpm test components/trials/__tests__/ParentUpdateOptIn.test.tsx components/trials/__tests__/PayPageClient.test.tsx components/my-path/__tests__/PlanWizard.test.tsx --runInBand`
Expected: FAIL on missing copy/components.

**Step 4: Implement the student launch copy and hierarchy**

Use Dawn styling, `.ei-button-dawn`, honest adjacent disclosure, and compact reassurance. Keep trial creation idempotent. Do not hide or delay price disclosure.

**Step 5: Implement the parent page hierarchy and opt-in**

Place the value story before payment mechanics. Post the optional email and consent to `/api/trials/:token/parent-updates`. Keep PromptPay and slip upload behavior unchanged. Use the Dawn atmosphere and Thai typography required for parents.

**Step 6: Verify focused UI tests**

Run: `pnpm test components/trials/__tests__/ParentUpdateOptIn.test.tsx components/trials/__tests__/PayPageClient.test.tsx components/my-path/__tests__/PlanWizard.test.tsx --runInBand`
Expected: PASS.

**Step 7: Commit**

```bash
git add components/my-path/wizard/PayLaterSheet.tsx components/trials app/pay/[token]/page.tsx
git commit -m "feat(trials): sell PathLab outcomes to families"
```

### Task 7: Integration Verification and Browser QA

**Files:**
- Modify only files required by verified defects.

**Step 1: Run the My Path and trial suites**

Run: `pnpm test lib/my-path components/my-path lib/trials components/trials --runInBand`
Expected: PASS with no warnings introduced by this feature.

**Step 2: Run lint**

Run: `pnpm lint`
Expected: PASS or only documented pre-existing failures outside the feature diff.

**Step 3: Run the production build**

Run: `pnpm build`
Expected: PASS.

**Step 4: Run browser QA**

Verify at desktop and mobile widths:

- `/plan` save → `/me#my-path`;
- `/me` empty, planned, active, expired, and completed states;
- student trial launch disclosure and sheet;
- parent value hierarchy, opt-in validation, QR, and slip upload;
- keyboard focus, reduced motion, and touch/in-view animation behavior.

**Step 5: Audit the final diff for secrets and unrelated changes**

Run: `git diff --check`
Run: `git status --short`
Run: `rg -n "(re_[A-Za-z0-9]|service_role|SUPABASE_SERVICE_ROLE_KEY=|RESEND_API_KEY=)" <changed-files>`
Expected: no embedded credentials and no unrelated files staged.

**Step 6: Commit verified fixes, if any**

```bash
git add <verified-feature-files>
git commit -m "fix(my-path): address integrated journey QA"
```
