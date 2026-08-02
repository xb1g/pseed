# ProjectSeed — Batch 1 Launch Gate Tracker

**Derived from** [`PROJECTSEED-SAFEGUARDING.md`](./PROJECTSEED-SAFEGUARDING.md) §11.
That policy is the source of record. This file tracks it; it does not amend it.

**Last updated:** 2026-08-01 · **Updated by:** documentation pass (drafting only —
no human, system, or verification step was performed)

> **THE GATE IS OPEN. BATCH 1 MUST NOT BE OFFERED OR SOLD.**
> `IS_OPEN_FOR_SALE` in `lib/projectseed/offer.ts` is `false` and must stay `false`.

---

## Summary

**Cohort-level: 2 of 17 done.** (4 BLOCKED — partially closed, 11 NOT STARTED)
**Per-minor items: 0 of 2 done** (cannot be done — no minor is enrolled, and both
depend on cohort items that are still open).

| Owner type | Total | Done |
|---|---|---|
| DOCUMENT — closable by writing | 4 | 1 |
| HUMAN — requires a person to act | 10 | 1 |
| SYSTEM — requires configuring software | 3 | 0 |
| *(per-minor, HUMAN)* | 2 | 0 |

Three Thai documents were written in this pass. They close exactly **one** gate item
outright (#3, the student-facing version) and advance three others to BLOCKED.
**Nothing that actually protects a child has changed.** Screening, the deputy lead,
the reporting inbox, and the Discord configuration are all still open, and those are
the controls that do the work.

### THE REAL GATE — HUMAN-owned blockers

These cannot be closed by writing anything. Ordered by how long each realistically
takes.

| # | Blocker | Realistic time |
|---|---|---|
| H1 | Test the dedicated reporting inbox end to end (gate 6, second half) | minutes, once the inbox exists |
| H2 | Create a dedicated safeguarding inbox to replace `seedpassion@gmail.com` (gate 6) | under an hour |
| H3 | Name the record store in writing, set access to lead + deputy, record retention (gate 15) | 1–2 hours |
| H4 | Rehearse the disclosure and immediate-danger response (gate 17) | half a day |
| H5 | Confirm every rostered mentor's age and that no 18/19-year-old is a second authorized adult (gate 13) | half a day |
| H6 | Confirm second-authorized-adult coverage per channel; shrink the batch if short (gate 7) | half a day, plus recruiting if short |
| H7 | Brief every rostered mentor live and collect signed acknowledgements (gate 12) | 1–2 hours per mentor, after H8 |
| H8 | Native-Thai-speaker review of the three Thai documents (gate 2) | days — depends on the reviewer |
| H9 | Appoint and screen a Deputy Safeguarding Lead (gate 5) | **weeks** — a person must be found, agree, and clear §3A |
| H10 | Screen every mentor under §3A: references contacted directly, police clearance, ID/age check (gate 11) | **weeks** — Thai police clearance turnaround dominates |

**H9 and H10 set the launch date.** Everything else fits inside them. Any plan that
opens batch 1 sooner than the police-clearance turnaround is a plan that skips
screening.

---

## Cohort-level items

### 1. "This policy is active, published, and included in the sales/onboarding material."

- **Status:** BLOCKED
- **Owner type:** DOCUMENT
- **Closed by:** partially — the policy is published at `/projectseed/safeguarding`
  (`app/projectseed/safeguarding/page.tsx`, rendered from the markdown so it cannot
  drift) and linked from the ProjectSeed landing page
  (`app/projectseed/page.tsx:491`).
- **Remains:** no sales or onboarding pack exists yet, so the policy cannot be
  "included in" it. Closes when the onboarding pack is assembled.

### 2. "A Thai translation of this policy exists, reviewed by a native Thai speaker. A parent cannot consent to a policy they cannot read."

- **Status:** BLOCKED
- **Owner type:** HUMAN (the review). The translation itself was DOCUMENT.
- **Closed by:** [`PROJECTSEED-SAFEGUARDING-TH.md`](./PROJECTSEED-SAFEGUARDING-TH.md)
  — full translation, section numbering preserved, marked `<!-- REVIEW PENDING -->`.
- **Remains:** the native-speaker review, which is the half the gate item actually
  names. An unreviewed translation does not close this item.

### 3. "The student-facing version exists in Thai, in age-appropriate language, covering the non-negotiables and how to report."

- **Status:** DONE
- **Owner type:** DOCUMENT
- **Closed by:** [`PROJECTSEED-SAFEGUARDING-STUDENT-TH.md`](./PROJECTSEED-SAFEGUARDING-STUDENT-TH.md)
- **Remains:** the item text does not require native review, so it is closed — but
  send it through H8 with the others before it reaches a student, and test it on one
  real 16-year-old.

### 4. "Bunyasit Fang is available as Safeguarding Lead."

- **Status:** DONE
- **Owner type:** HUMAN
- **Closed by:** named in §11 and throughout the policy.
- **Remains:** nothing, until §12 review asks whether one lead is holding.

### 5. "A Deputy Safeguarding Lead is named, screened, and contactable."

- **Status:** NOT STARTED
- **Owner type:** HUMAN
- **Remains:** everything. No name exists. The policy states this explicitly
  ("NOT YET APPOINTED"). Blocker **H9** — the longest-lead human item after mentor
  screening, because the deputy must also clear §3A. Until this exists there is no
  internal route for a concern about the founder.

### 6. "A dedicated safeguarding reporting address exists — not the founder's general account — and has been tested end to end."

- **Status:** NOT STARTED
- **Owner type:** HUMAN
- **Remains:** everything. `seedpassion@gmail.com` is still the address in the
  policy, on `/projectseed/safeguarding`, and in the two parent/student documents
  written in this pass. Blockers **H2** then **H1**. Every document written today
  will need the address swapped once it exists.

### 7. "Official mentoring channels and their second authorized adults are defined, and the number of second authorized adults is sufficient for the number of channels."

- **Status:** NOT STARTED
- **Owner type:** HUMAN
- **Remains:** no channel-to-adult map exists. Note the age constraint: a second
  authorized adult must be 20+, so the pool is smaller than the mentor pool.
  Blocker **H6**. If coverage is short, §11 requires shrinking the batch, not
  thinning supervision.

### 8. "The Discord server is configured per section 4: forum channels for project work, verification and member screening on, invites restricted to staff, mentors on a distinct visible role."

- **Status:** NOT STARTED
- **Owner type:** SYSTEM
- **Remains:** all four settings. Out of scope for this pass — no Discord
  configuration was inspected or changed.

### 9. "The notification bot is broadcast-only — it never asks a student a question, refuses DM replies with a single automated pointer back to the channel, and never forwards DM content to a mentor."

- **Status:** NOT STARTED
- **Owner type:** SYSTEM
- **Remains:** verification against the bot's actual code and behaviour. Commit
  `68910c61` added a Discord bot with voice presence, slot reminders and `/stats` —
  a `/stats` slash command and reminder DMs are exactly the surface where a
  "conversational" affordance leaks in. This needs a read of the bot source against
  the three §4 constraints, then a live test of DM-ing the bot.

### 10. "Onboarding walks every student and mentor through disabling server-member DMs, with confirmation recorded."

- **Status:** NOT STARTED
- **Owner type:** SYSTEM (the recorded confirmation) + HUMAN (running the walkthrough)
- **Remains:** no onboarding script and no confirmation record exist. The parent
  notice already promises this happens — that promise is currently unbacked.

### 11. "Every mentor on the launch roster has completed section 3A screening: self-declaration, two references contacted, criminal record check or a recorded reason it could not be obtained, and identity/age verification."

- **Status:** NOT STARTED
- **Owner type:** HUMAN
- **Remains:** everything, for every mentor. Blocker **H10** and the true
  determinant of the launch date. Thai police clearance turnaround cannot be
  compressed by working harder.

### 12. "Every mentor on the launch roster has completed the briefing and signed the acknowledgement."

- **Status:** NOT STARTED
- **Owner type:** HUMAN
- **Remains:** everything. §9 forbids briefing anyone who has not cleared §3A, so
  this is strictly downstream of gate 11. The signature form exists (§10, translated
  in `PROJECTSEED-SAFEGUARDING-TH.md` §10); no one has signed it.

### 13. "Every mentor meets the age rules in section 1, and no mentor aged 18 or 19 is rostered as a second authorized adult."

- **Status:** NOT STARTED
- **Owner type:** HUMAN
- **Remains:** no roster with verified dates of birth exists. Note this depends on
  gate 11's identity/age verification — a self-reported age does not close it.
  Blocker **H5**. High risk in this specific programme: mentors are university-age
  alumni, so a meaningful share will be 18 or 19.

### 14. "The parent notice and acknowledgement process is ready, and it states that the DM rule cannot be technically enforced (section 4)."

- **Status:** BLOCKED
- **Owner type:** DOCUMENT (the notice) + HUMAN (the process)
- **Closed by:** [`PROJECTSEED-PARENT-NOTICE-TH.md`](./PROJECTSEED-PARENT-NOTICE-TH.md)
  — §4 of that document states the non-enforceability in the policy's own terms, and
  the acknowledgement block requires the parent to tick it specifically.
- **Remains:** the *process*, not the document. Three gaps: (a) the deputy lead field
  is blank and the document must not be sent to a parent with it blank; (b) the
  reporting address in it is still the founder's general account; (c) no delivery,
  collection, or storage route exists for the signed acknowledgements — see gate 15.

### 15. "The named record store exists, with access limited per section 8, and retention periods recorded."

- **Status:** NOT STARTED
- **Owner type:** HUMAN
- **Remains:** everything. §8 names retention periods but not a location. Blocker
  **H3**. Until this exists, there is nowhere lawful to put a signed parent
  acknowledgement or a screening record — which quietly blocks gates 11, 12 and 14.

### 16. "Every published AI prompt has been checked against section 5A, and every page publishing one shows the helplines and the personal-data warning."

- **Status:** BLOCKED
- **Owner type:** DOCUMENT (the check) + SYSTEM (the fix)
- **Closed by:** the check — see the §5A audit below.
- **Remains:** the audit found the prompt page **non-compliant on placement**, plus
  a missing-helpline gap in the policy itself. Both fixes require editing files this
  pass was not permitted to touch. See "Required changes" below.

### 17. "The founder has rehearsed the disclosure and immediate-danger response."

- **Status:** NOT STARTED
- **Owner type:** HUMAN
- **Remains:** everything. §7 gives the seven steps; nobody has walked them under
  pressure. Blocker **H4**. This is the cheapest item on the list and the one most
  likely to be skipped.

---

## Per-minor items

Checked per student, immediately before that student's first mentor contact.
Neither can be satisfied yet — both depend on cohort items 5, 6, 7, 11, 12 and 14.

### M1. "Their parent or guardian has received and acknowledged the information in section 5."

- **Status:** NOT STARTED
- **Owner type:** HUMAN
- **Remains:** the notice exists (`PROJECTSEED-PARENT-NOTICE-TH.md`) but cannot be
  sent — blank deputy field, wrong reporting address, nowhere to file the returned
  acknowledgement.

### M2. "The student, assigned mentor, and second authorized adult are in the approved group channel."

- **Status:** NOT STARTED
- **Owner type:** HUMAN (verification) on SYSTEM (the channel)
- **Remains:** the channels do not exist yet (gate 8) and the second authorized
  adults are not assigned (gate 7).

---

## §5A audit — published AI prompts

**Scope:** `app/projectseed/prompt/page.tsx` (the only page publishing a prompt) and
`lib/ai/project-discovery-prompts.ts` (the prompt text), audited against
`PROJECTSEED-SAFEGUARDING.md` §5A on 2026-08-01.

**Verdict: NON-COMPLIANT.** The prompt content passes. The page fails on placement,
and the policy has a gap the page inherits.

### 5A-1. Does the prompt instruct the assistant to stop on distress? — PASS

`lib/ai/project-discovery-prompts.ts:279-291`:

> `STOP COACHING IMMEDIATELY if the student discloses or hints at: self-harm,
> suicidal thoughts, abuse, violence at home, an eating disorder, or distress that
> goes beyond ordinary exam stress.`
> …
> `- Drop the project conversation entirely. Do not steer back to it.`
> `- Name a trusted adult: ผู้ปกครอง ครูที่ไว้ใจ หรือครูแนะแนว`
> `- Give the hotline: กรมสุขภาพจิต โทร 1323 (24 ชม.) หรือ Samaritans 02-113-6789`
> `- Do not resume the project conversation in the same session, even if they ask.`

This meets the §5A requirement literally, including "beyond ordinary exam stress" —
the same phrase the policy uses. The "do not resume in the same session" line is
stronger than §5A requires and should be kept.

### 5A-2. Does the prompt forbid personal identifiers, meeting strangers, and secrets? — PASS

`lib/ai/project-discovery-prompts.ts:293-302`:

> `- Never ask for or store: full legal name, ID card number, phone, address, school
> name combined with a full name, photos, or social media handles — theirs or anyone
> else's.`
> `- Never suggest meeting anyone the student does not already know, online or in
> person.`
> `- If the student asks you to keep something secret from their parents or teachers,
> do not agree.`

All three §5A clauses are covered. Reinforced in the arc at line 141-142
(`Never ask for full names, phone numbers, addresses, ID numbers, photos, or social
handles of anyone`) and in RED FLAG 5 (line 213-216) and RED FLAG 10 (line 233-236).

### 5A-3. Does the page show the helplines and the personal-data warning "where a student sees them before starting"? — **FAIL (placement)**

Both are present:

- Personal-data warning: `app/projectseed/prompt/page.tsx:103-106`
  (`อย่าใส่ข้อมูลส่วนตัว — ชื่อจริง เลขบัตรประชาชน เบอร์โทร ที่อยู่…`)
- Helplines: `app/projectseed/prompt/page.tsx:114-123`
  (`กรมสุขภาพจิต 1323 (24 ชม.) หรือ Samaritans 02-113-6789 · ฉุกเฉิน โทร 1669`)

Both sit in `<SafetyNotice />`, rendered at `app/projectseed/prompt/page.tsx:49` —
**after** `<PromptCopy>` at line 47. `PromptCopy` contains the copy button
(`components/projectseed/prompt-copy.tsx`, `handleCopy`) *and* the deep links to
`chatgpt.com`, `claude.ai/new` and `gemini.google.com` (`AI_TOOLS`, lines 20-24).

The realistic flow on a phone is: land, pick grade, tap copy, tap "open ChatGPT",
gone. The student starts having scrolled past nothing, because the warning is below
the fold *and* below the exit. The section header even says
`ก่อนเริ่ม อ่านสองข้อนี้` ("read these two before starting") while sitting after the
thing you start with. §5A says "where a student sees them **before starting**". This
does not.

**Required change (do not apply from this pass — reported only):**
move the `<SafetyNotice />` call at `app/projectseed/prompt/page.tsx:49` to above the
`<PromptCopy>` block at lines 46-48, so the render order becomes
`Hero → SafetyNotice → PromptCopy`. No copy changes needed; the existing text is
adequate once it is above the copy button. If the design objects to a warning block
above the primary action, the minimum acceptable alternative is a compact
helplines + no-personal-data strip rendered inside the `Hero` (after
`app/projectseed/prompt/page.tsx:87`), with the fuller footer left where it is.

### 5A-4. Does the prompt itself risk eliciting personal or distressing disclosures from a minor? — YES, BY DESIGN. Mitigated but worth naming.

The policy already anticipates this ("asks a student why a problem matters to them
personally, which can surface family pressure, academic anxiety, or distress").
The specific lines that do the eliciting:

`lib/ai/project-discovery-prompts.ts:152-155`:

> `- ทำไมเธอถึงเห็นปัญหานี้ ในเมื่อคนอื่นเดินผ่านไปเฉย ๆ`
> `- เธอเข้าถึงอะไรที่คนอื่นเข้าไม่ถึง — คน สถานที่ ประสบการณ์ ภาษา ครอบครัว`
> `Strongest answer: they have lived inside the problem.`

Naming `ครอบครัว` (family) as a category of "unfair access", and rewarding "they have
lived inside the problem" as the strongest answer, is a direct invitation to disclose
family circumstances. This is the single highest-risk line in the file.

`lib/ai/project-discovery-prompts.ts:222-224` (RED FLAG 7, the parent's project):

> `→ Ask directly and gently: ถ้าไม่มีใครรู้เลยว่าเธอทำอันนี้ เธอยังอยากทำอยู่ไหม`

This is a well-designed question that will, in some fraction of Thai students, open
directly onto parental pressure.

`lib/ai/project-discovery-prompts.ts:78-82` (PUSH, DO NOT PRAISE) instructs the
assistant to `Push at least twice before accepting an answer as specific.` Pushing
twice on "why does this matter to you" is precisely how a polished answer becomes a
personal one.

**Assessment:** this is not a defect. The elicitation is the point of the exercise,
§5A exists because of it, and the SAFEGUARDING block correctly overrides the arc
(`This section overrides the arc.`, line 279). Two things make it acceptable rather
than reckless: the stop rule is stated before the arc in the assembled prompt
(`buildProjectDiscoverySystemPrompt`, lines 390-398 — `HARD_RULES`, then
`SAFEGUARDING_RULES`, then the arc), and the assistant is told not to resume in the
same session. Keep that ordering if the prompt is ever refactored.

One residual gap: nothing tells the assistant to soften the `ครอบครัว` probe. A
one-line addition to `SAFEGUARDING_RULES` — do not push a second time on a family
answer, take what is given and move on — would close it. Recommended, not required
by §5A.

### 5A-5. Helpline gap — the policy publishes no numbers

§5A requires prompts to direct a student to "the published helplines" and requires
every publishing page to "display the helplines". **`PROJECTSEED-SAFEGUARDING.md`
does not contain a single helpline number.** There is no canonical list for anything
to be checked against; the page and the prompt are each carrying their own.

What is actually published today, in code:

| Line | Where | Source |
|---|---|---|
| กรมสุขภาพจิต **1323** | prompt page, safeguarding page, prompt text | `MENTAL_HEALTH_HOTLINE_TH`, `lib/ai/project-discovery-prompts.ts:30` |
| Samaritans **02-113-6789** | same three places | `SAMARITANS_TH`, `lib/ai/project-discovery-prompts.ts:33` |
| ฉุกเฉิน **1669** | prompt page:121, safeguarding page:142, prompt text:290 | hardcoded |

**ศูนย์ช่วยเหลือสังคม 1300 and ตำรวจ 191 appear nowhere in the repository.** This is
a substantive gap, not a formatting one: **1669 is the medical emergency line.** The
prompt tells a student disclosing *abuse or violence at home* — see
`lib/ai/project-discovery-prompts.ts:281` — to call 1669 for immediate danger. For
violence in the home, the correct lines are **1300** (24h social assistance,
Ministry of Social Development and Human Security) and **191** (police). Sending an
abuse disclosure to an ambulance dispatcher is a real routing failure.

The two Thai student/parent documents written in this pass publish all five lines
(191, 1669, 1300, 1323, Samaritans) with the situation each is for. They are now the
most complete list ProjectSeed has, which is the wrong place for it to live.

**Required changes (reported only — all touch files this pass may not edit):**

1. **`docs/project/PROJECTSEED-SAFEGUARDING.md` §5A** — add a canonical helpline
   list so "the published helplines" resolves to something. Owner: policy owner;
   this pass is not permitted to revise the policy.
2. **`lib/ai/project-discovery-prompts.ts:290`** — the line
   `- If there is immediate danger: โทร 1669` should route abuse and violence to
   **191** and **1300**, keeping 1669 for medical emergency. Suggested replacement:
   `- If there is immediate danger: ตำรวจ 191 · ถ้าเจ็บป่วยฉุกเฉิน 1669 · ถูกทำร้ายหรือ
   ไม่ปลอดภัยที่บ้าน ศูนย์ช่วยเหลือสังคม 1300`
3. Once (1) and (2) land, add matching constants next to
   `MENTAL_HEALTH_HOTLINE_TH` (`lib/ai/project-discovery-prompts.ts:30`) and surface
   them on `app/projectseed/prompt/page.tsx:121` and
   `app/projectseed/safeguarding/page.tsx:142`, so all three surfaces read from one
   source.

### §5A audit conclusion

Gate item 16 stays **open**. The check half is now done and recorded here; the page
does not yet "show the helplines and the personal-data warning" in a position a
student sees before starting, and the helplines themselves are incomplete and
partly misrouted. Re-run this audit after the changes above land, and again at every
§12 review point, per §5A's own requirement that prompts be reviewed "whenever they
change".

---

## How to use this file

Update the status line and the summary counts whenever an item closes, and record
who verified it and when. §11 is explicit that copying a checklist does not complete
it — an item is DONE only when the underlying control was observed working, not when
a document describing it exists.
