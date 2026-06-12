# Hackathon Feedback Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a concise, grade-tailored Thai hackathon feedback flow with structured learning-content feedback and benefit-led follow-up opportunities.

**Architecture:** Put answer constants, audience selection, and Zod validation in a shared hackathon feedback module used by both the route and client. Extend the existing Supabase table with nullable structured fields, keep the one-row-per-participant upsert, and split the client UI into small reusable question and section components.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Zod, Supabase PostgreSQL, Tailwind CSS, Framer Motion, Jest.

---

### Task 1: Define and test the feedback contract

**Files:**
- Create: `lib/hackathon/feedback.ts`
- Test: `lib/hackathon/feedback.test.ts`

1. Write failing tests for `getFeedbackVersion()` with `ม.3`-`ม.5`, `ม.6`, vocational, and university grade values.
2. Write failing tests for valid feedback, more than three takeaways, invalid ratings, and missing contact details after contact opt-in.
3. Run `pnpm test -- lib/hackathon/feedback.test.ts --runInBand` and confirm failures are caused by the missing module.
4. Implement constants, types, audience selection, and `hackathonFeedbackSchema`.
5. Re-run the focused test and confirm it passes.

### Task 2: Extend persistence

**Files:**
- Modify: `supabase/migrations/20260612182604_improve_hackathon_feedback.sql`
- Modify: `app/api/hackathon/feedback/route.ts`

1. Add nullable columns for overall rating, takeaways, typed "other" answers, mentorship participation and help, project stage, continuation interests, learning-content feedback, follow-up interests, contact details, and feedback version.
2. Parse POST payloads with the shared schema.
3. Derive and store the feedback version from the authenticated participant's grade.
4. Keep legacy fields populated where mappings are unambiguous.
5. Return Thai-safe validation errors without exposing database details.

### Task 3: Build the three-section student flow

**Files:**
- Create: `components/hackathon/feedback/FeedbackChoice.tsx`
- Create: `components/hackathon/feedback/FeedbackRating.tsx`
- Create: `components/hackathon/feedback/FeedbackSection.tsx`
- Create: `components/hackathon/feedback/FollowUpOpportunity.tsx`
- Modify: `app/hackathon/feedback/page.tsx`

1. Replace the desktop split hero with a focused mobile-first form workspace.
2. Add progress, back/continue navigation, and section-level validation.
3. Render ratings and choices as accessible large tap targets.
4. Add learning-content rating, improvement choices, and optional open feedback.
5. Render grade-tailored future-path/project-growth content.
6. Render rich opportunity choices with titles, outcomes, and benefit summaries.
7. Reveal contact name and topics only after contact opt-in.
8. Preserve login, existing-response loading, update, success, and redirect behavior.

### Task 4: Verify behavior and presentation

**Files:**
- Test: `lib/hackathon/feedback.test.ts`
- Review: `app/hackathon/feedback/page.tsx`
- Review: `components/hackathon/feedback/*.tsx`

1. Run `pnpm test -- lib/hackathon/feedback.test.ts --runInBand`.
2. Run `pnpm exec tsc --noEmit`.
3. Run the app and inspect `/hackathon/feedback` at mobile and desktop sizes.
4. Verify keyboard focus, 48px touch targets, reduced motion, conditional versions, validation, existing-response hydration, and submit behavior.
5. Run `git diff --check` and inspect the final diff for secrets or unrelated changes.
