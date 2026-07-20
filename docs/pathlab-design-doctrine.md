# PathLab Design Doctrine

The editorial standard for PathLab content. Structural validity is handled by
`lib/pathlab/generation-quality.ts`; this document covers the part a schema check
cannot see — whether a PathLab is *worth a student's five days*.

Read this before authoring, generating, or reviewing PathLab content.

---

## 1. Core essence

> A PathLab is not a course. It is a **decision instrument**.
>
> Its purpose is to let a student find out — cheaply, honestly, and in their own
> body — whether a career is theirs. Success is a student who confidently says
> "not for me" on day 3. Failure is a student who finishes all five days and
> still doesn't know.
>
> Every day exists to answer one question the student cannot answer from the
> outside. Every activity is real work drawn from the actual job, including the
> parts practitioners find boring. Nothing is included because it is
> interesting to teach; everything is included because it discriminates between
> students who fit and students who don't.

This paragraph is the compression of the whole document. It is designed to be
pasted directly into a generation prompt, an agent brief, or a reviewer's
instructions. If a decision isn't covered by the rules below, decide it by
asking which option better serves that paragraph.

---

## 2. Backward design

Author in this order. Never in reverse — content written first will always
smuggle in "this is neat to teach."

```
Career truth (evidence)
  → Decision question (what the student must learn about themselves)
    → Fit / misfit signal (what behavior would reveal the answer)
      → Activity (the task that produces that behavior)
        → Content (the minimum needed to attempt the task)
```

Content is last and smallest. If an activity needs 20 minutes of reading before
a student can attempt it, the activity is scoped wrong, not the reading.

### The day contract

Each day maps to exactly one `PathLabLearningObjective`
(`types/pathlab-generator.ts:19`) and must fill all four fields honestly:

| Field | What it must actually contain |
|---|---|
| `day` | Position in the arc — see §5 |
| `title` | The day's real work, not a topic label |
| `objective` | What the student will *do*, not what they will "understand" |
| `studentDecisionQuestion` | A question about **themselves**, answerable only by having done the day |

`studentDecisionQuestion` is the load-bearing field and the most commonly
botched. It is not a comprehension check.

- ✅ "Did the two hours of debugging feel like a puzzle or a punishment?"
- ✅ "When the client rejected your draft, did you want to argue or revise?"
- ❌ "Do you understand the design process?" — comprehension, not self-knowledge
- ❌ "Are you interested in coding?" — answerable without doing the day
- ❌ "Did you enjoy today?" — measures the lesson, not the career

Test: if a student could answer it accurately *before* starting the day, it is
not a decision question.

---

## 3. Evidence

Every career claim must trace to a source. Two are acceptable.

**Primary — the expert interview.** `PathLabExpertContext.careerTruths`
(`types/pathlab-generator.ts:39`) is the evidence base. Prefer it always. Note
what each field is *for*, because they are not interchangeable:

| Field | Role in the design |
|---|---|
| `mostImportant` | What the arc must build toward |
| `mundaneButRequired` | **The honesty tax — see §4** |
| `beginnersUnderestimate` | Where students self-select out; put these early |
| `hiddenChallenges` | Source of the difficult moment (§5, day 3–4) |
| `rewardingMoments` | The genuine pull — earn it, don't front-load it |
| `noviceToExpertShifts` | Sets the difficulty ceiling; don't exceed it |
| `misconceptions` | What the PathLab must actively break |

**Secondary — cited research**, when the interview is thin on a needed point.
Follow the research discipline in `.claude/skills/radar-research/SKILL.md`:
search for current real data, verify each source resolves and says what you
claim, prefer occupational and professional-body sources over content farms.

**Never acceptable:** plausible-sounding career detail from model priors. If
neither the interview nor a verified source supports a claim, cut it. A shorter
honest PathLab beats a full fabricated one — a student may choose a career
based on this.

Where the interview and research conflict, the interview wins for *lived
experience* ("what the work feels like"), research wins for *market facts*
(pay, demand, credentials).

---

## 4. Anti-generic rules

Generic content is the default failure mode of generated PathLabs. These rules
are the countermeasure. Each is written to be checkable.

### 4.1 The swap test — the primary gate

Take any day. Replace the career name with a different career. Does it still
read as sensible?

If yes, **the day is generic and must be rewritten.** A day about product design
that survives being relabeled as a day about accounting was never about product
design. Every day must contain at least one detail that breaks on swap: a real
tool, a real artifact, a real constraint, a real failure mode, a real piece of
jargon used correctly.

### 4.2 The honesty tax

Every PathLab must include at least one item from `mundaneButRequired`,
presented as actual work the student performs — not described, performed.

This is non-negotiable and it is the single highest-value rule in this
document. A PathLab that shows only the exciting 10% of a career produces
false positives: students who commit, arrive, and quit. The boring work is
where fit is actually decided, and it is exactly what a generator will omit
unless forced.

### 4.3 Real output

Every day produces an artifact the student made — a written thing, a built
thing, a decision with stated reasoning. Watching, reading, and answering
recall questions are not output.

Recall quizzes are the weakest instrument available. They measure whether the
student read the page. Use them only as a gate before an activity that would be
unsafe or wasteful to attempt uninformed — never as the day's assessment.

### 4.4 Struggle exposure

At least one activity must be genuinely hard — hard enough that some students
won't complete it cleanly. Difficulty is not cruelty; it is resolution. If
every student succeeds at everything, the PathLab has emitted zero signal about
aptitude, and every report reads the same.

Source the difficulty from `hiddenChallenges` or `beginnersUnderestimate` so it
is *the job's* difficulty, not invented difficulty.

### 4.5 Disconfirmation

`misfitSignals` must be as carefully designed as `fitSignals`. A PathLab that
can only confirm interest is a marketing funnel. Design at least one activity
where a plausible, non-shameful outcome is the student discovering this is not
for them — and make that outcome feel like a valid result, not a failure.

### 4.6 Specificity floor

No day may consist entirely of abstractions. Concrete nouns, real numbers, real
constraints, named tools. "Learn about user research" fails. "Interview three
people about how they currently track expenses, then find the contradiction
between what two of them said" passes.

### 4.7 No outcome promises

Never state or imply guaranteed employment, salary, or admission. Never make
medical or legal claims. Enforced in
`lib/ai/pathlab-generator-prompts.ts:71`; restated here because it is an
editorial rule, not only a safety one.

---

## 5. The five-day arc

Default shape for `totalDays: 5`. Scale proportionally for other lengths.

| Day | Role | Design note |
|---|---|---|
| 1 | **Real contact** | Student does actual work in hour one. No throat-clearing history lesson. Front-load one `beginnersUnderestimate` item — early self-selection is a feature |
| 2 | **Widen** | Show a second mode of the work; the day-1 activity was one facet, not the job |
| 3 | **The mundane** | Honesty tax lands here (§4.2). Deliberately the least glamorous day |
| 4 | **The difficulty** | Struggle exposure (§4.4), sourced from `hiddenChallenges`. Ambiguity with no clean answer |
| 5 | **Judgment** | Student assembles what they learned about *themselves*. Ends in an explicit fit decision |

Day 5 must not be a recap. It is the instrument's readout. It should surface the
student's own day-by-day reactions back to them and ask them to interpret the
pattern.

Ordering rationale: mundane before difficult. A student who finds the boring day
tolerable and the hard day energizing is the strongest possible fit signal. The
reverse order lets a hard-day high wash out the boredom response.

---

## 6. Review checklist

A PathLab draft ships only if every line passes.

**Evidence**
- [ ] Every career claim traces to the interview or a verified source
- [ ] No fabricated tools, workflows, salaries, or credential requirements

**Backward design**
- [ ] Each day maps to exactly one objective
- [ ] Every `studentDecisionQuestion` is about the student, not the material
- [ ] No `studentDecisionQuestion` is answerable before the day is done
- [ ] Content is the minimum needed to attempt the activity

**Anti-generic**
- [ ] Every day fails the swap test (§4.1)
- [ ] At least one `mundaneButRequired` item is performed, not described (§4.2)
- [ ] Every day produces a student-made artifact (§4.3)
- [ ] At least one genuinely hard activity exists (§4.4)
- [ ] At least one `misfitSignal` can surface (§4.5)
- [ ] No day is entirely abstract (§4.6)
- [ ] No outcome, medical, or legal promises (§4.7)

**Arc**
- [ ] Day 1 reaches real work within the first activity
- [ ] The mundane day precedes the difficult day
- [ ] Day 5 produces a fit decision, not a summary

**Honesty**
- [ ] A practitioner in this field would recognize this as their job
- [ ] "This isn't for me" is a supported, respected outcome

---

## 7. Consumers

This doctrine is the single source of truth for three surfaces. When it
changes, check all three.

| Consumer | Location | Relationship |
|---|---|---|
| Generator prompt | `lib/ai/pathlab-generator-prompts.ts` | Encodes §1–§5 as generation constraints |
| Quality validator | `lib/pathlab/generation-quality.ts` | Currently structural only. §4 rules are its intended editorial extension — the swap test and honesty tax are the first two worth automating |
| Human/agent review | §6 checklist | Final gate before publish |

**Known gap:** `generation-quality.ts` validates structure (day counts, DAG
acyclicity, orphan nodes, quiz option integrity) and enforces none of §4. Until
that gap closes, §6 must be run by a human or a reviewing agent on every
generated draft. Structural validity is not quality.
