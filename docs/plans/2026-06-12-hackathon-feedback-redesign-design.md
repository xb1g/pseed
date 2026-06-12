# Hackathon Feedback Redesign

## Goal

Replace the current short feedback card with a mobile-first Thai survey that students can finish in 3-5 minutes, while collecting useful program, mentorship, project, in-app learning, and follow-up intent data.

## Audience

The participant's existing `grade_level` selects one of two versions:

- `ม.3`, `ม.4`, and `ม.5`: future-path version focused on self-discovery, study/career direction, and trying PassionSeed.
- All other participants: project-growth version focused on continuing the project, mentorship, and future opportunities.

The form does not ask for demographics again.

## Form Structure

The page uses three short sections with a visible progress indicator:

1. **ประสบการณ์ที่ได้**
   - Overall program rating, 1-5.
   - Up to three main takeaways.
   - Change in confidence to create positive social impact.

2. **Mentor, project, and learning in the app**
   - Whether the participant received mentorship.
   - Mentorship rating and help area only when mentorship was received.
   - Current project stage.
   - Interest in continuing the project.
   - Rating for how useful the in-app learning content was.
   - Up to three learning-content improvement areas.
   - Optional open feedback about content or app features.

3. **ก้าวต่อไป**
   - Interest in ongoing mentorship.
   - Interest in joining a similar activity again.
   - One optional general improvement response.
   - Tailored future-path or project-growth prompt.
   - Benefit-led follow-up opportunity choices.
   - Optional contact request. Name and conversation topics appear only when selected.

The form has two optional open-text questions. Conditional "other" fields only
clarify a selected multiple-choice answer.

## Follow-Up Opportunity Content

Follow-up choices are presented as selectable opportunities rather than plain checkboxes. Each choice has a title, a one-sentence outcome, and a small “what you get” line.

For `ม.3-ม.5`:

- **ทดลองใช้ PassionSeed เวอร์ชันใหม่**: early access to the self-discovery and future-planning product.
- **คุยกับ Mentor เรื่องอนาคต**: a focused conversation about study choices, strengths, and possible careers.
- **รับโอกาสสำหรับเยาวชน**: relevant camps, hackathons, project opportunities, and PassionSeed activities.

For older students:

- **ทดลองใช้ PassionSeed เวอร์ชันใหม่**: early access to the same product, independent of continuing the hackathon project.
- **ลงมือพัฒนาโปรเจกต์นี้ต่อ**: an ongoing build sprint with weekly goals.
- **ขอคำปรึกษาเฉพาะเรื่อง**: a one-time expert clinic without joining another program.
- **รับข่าวกิจกรรมและโอกาสใหม่**: future activities that are not tied to continuing the current project.

## Interaction Design

- Large 48px minimum tap targets.
- Choice buttons use clear selected states and concise Thai labels.
- Only the active section is shown, reducing visual load.
- Back and continue controls preserve answers.
- Validation occurs when advancing, with an inline message and focus on the first incomplete question.
- The final section shows conditional contact fields only after opt-in.
- The Dawn student theme, Thai typography, reduced-motion support, keyboard focus, and mobile touch behavior follow `docs/ui-design-system.md`.

## Data and API

Add structured columns to `hackathon_feedback` while retaining existing columns for compatibility. Arrays store multi-select answers. Stable string IDs store single-choice answers. The API derives `feedback_version` from the authenticated participant's grade and validates all payloads with a shared Zod schema.

The endpoint continues to upsert one feedback record per participant. Existing responses remain editable.

## Testing

- Unit tests cover grade-to-version selection.
- Unit tests cover optional mentorship, typed "other" answers, required ratings, allowed choice IDs, multi-select limits, and conditional contact validation.
- Component verification covers section navigation and tailored follow-up content.
- Run focused Jest tests, TypeScript/build checks, and browser QA at the feedback route.
