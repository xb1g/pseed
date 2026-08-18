# Med Seed Camp — 5-Day Redesign + Authored Content

**Format:** 5 days online, 20 students (M4–M5), no equipment.
Days 1–4 are 2 hours. **Day 5 is 3.5 hours** to fit twenty 1:1s — tell students
at enrolment, not on Thursday.
**Model:** supervised self-learn. Students work the PathLab platform individually
during the block; a med student mentor is present to unblock, not to lecture.
**Goals:** (C) everyone leaves with a real skill and a concrete next step;
(D) everyone leaves feeling that someone here actually helped *them*.

**On goal D:** this was originally "something a parent can watch and be impressed
by," and that was wrong. See "What students take home" at the end. The camp is
built for the students in it, not for an audience judging from outside.

## Design principles

1. **No off-time homework.** All work happens inside the block, where the mentor
   is present at the moment students hit the wall. This was the original plan's
   biggest risk; deleting it costs nothing.
2. **The mentor walks toward people, not the reverse.** In a room of 20 working
   silently, the students who most need help never raise a hand. Use
   `completion_percentage` from `ai_chat` progress as the signal for who to
   approach.
3. **Every day ends with something visible.** Being seen is what makes teenagers
   finish work nobody is grading.
4. **Build for the students, not for an audience.** Nothing in this camp exists
   to be shown to outsiders. An artifact aimed at people who cannot judge the
   work produces theatre, and students can tell when they are performing rather
   than learning. The verdict reflection stays private for the same reason: if it
   were shown to anyone, nobody would ever write "this isn't for me."
5. **Don't dumb down the medicine.** M4–M5 have had biology. Real cases.

## Platform mapping

| Need | Platform feature |
|---|---|
| AI patient (free text) | `ai_chat` content, custom `system_prompt` + `objective` |
| Timed pressure / QTE | `npc_chat` with `timer_seconds` on nodes |
| Written work, mentor-visible | `text_answer` assessment |
| Daily check-in | `reflection_prompts[]` on `path_days` |
| Mentor triage signal | `ai_chat` `completion_percentage` per student |
| 1:1 prep | mentor reads each student's `text_answer` submissions before the call |

**Not used:** `file_upload` / recording. An earlier draft had students record a
case presentation; it was cut. See Day 5.

**Not on the platform:** the 1:1s, which are the most important thing in the
camp. Booking can be a spreadsheet.

**Known risk:** `completion_percentage` is a DeepSeek judgment against a rubric
you write. It is reliable for "did the student gather X." It is weak for "is the
reasoning correct" and weakest for "did the student successfully defend their
answer." Every `completion_criteria` below is written to be checkable on
*observable conversation facts*, not on correctness. Where correctness matters,
a human judges.

---

# Day 1 — The Listener

**Point of the day:** the raw material of medicine is what a person tells you,
and most of it is not the chief complaint. Establish the baseline you will
compare against on Day 5.

`context_text`:
> Today you are not going to diagnose anything. You are going to listen. By
> Friday you will present a real patient case in your own words. It starts here,
> because everything a doctor knows about a patient begins with someone talking.

**Activities**

1. **Baseline** (`text_answer`, 3 min, ungraded) — two prompts:
   - Right now, how much do you want to be a doctor? 1–10.
   - Why that number and not one lower?

   *Day 5 compares against this. It costs three minutes. Do not skip it.*

2. **What is an illness script** (`short_video` or `text`, 10 min) — the core
   mental object of the week: a compact pattern of who gets a condition, how it
   shows up, what it does over time. Keep it to one worked example.

3. **The listening exercise** (`text_answer`, 40 min) — the best thing in the
   original plan, kept. Students talk to a real person (family, friend, in the
   room or on a call) about a problem that person actually has. Rules: do not
   solve it, do not advise, do not relate it to yourself. Ask "what else?" three
   times before you say anything of your own.

   Write-up prompts:
   - What did they say the problem was?
   - What did you notice that they never said out loud?
   - What did you want to say but didn't? What happened when you waited?

4. **First patient, no pressure** (`ai_chat`, 30 min) — a patient who is easy to
   talk to and whose story is straightforward. Goal is comfort with the
   interface and with asking questions, not diagnosis.

`reflection_prompts`:
- What was harder: not knowing the answer, or not being allowed to give one?
- What is one question you wish you had asked?

---

# Day 2 — Under Pressure

**Point of the day:** history-taking is a skill with moves, and it happens on a
clock. Then: you cannot recognise what you have never been taught. Students learn
five diseases, talk to a patient who could plausibly have any of them, and decide
which one it is themselves.

**This structure is also the fix for the AI-shortcut problem** (see the box at
the end of Day 3). A closed set of five turns diagnosis from an open question
into a discrimination task. An open question is what an AI answers well. "Which
of these five, and why not the other four?" requires knowing what was taught, and
because the symptoms overlap, a confidently-pasted AI answer is often wrong.

`context_text`:
> Yesterday you had all the time in the world. Real consultations don't work
> like that. Today the same skill, faster, and then you learn five conditions and
> meet someone who might have any of them.

**Activities**

1. **The QTE** (`npc_chat` with `timer_seconds`, 25 min) — branching dialogue,
   8–12 seconds per choice. Wrong turns are not failures; they lead to a patient
   who closes up, and the student sees the cost. Include at least one node where
   the fastest-looking option is the worst one.

   *Author note: the value is in the branches diverging visibly. If every path
   converges on the same information, the timer is decoration.*

2. **The five** (`short_video` or `text`, 25 min) — the teaching block. Five
   conditions that can all present with the same chief complaint. For each, one
   illness script: who gets it, how it shows up, what it does over time, and the
   one thing that most argues *against* it.

   Keep each to roughly 5 minutes. End with a single comparison table students
   can keep open during the next activity. This table is their instrument for
   the rest of the week, and they will reuse it on Day 5.

   **Design rule for the five — this makes or breaks the day.** The overlap must
   be *staggered*, not uniform:
   - Symptoms shared by 3–4 of the five. These carry no information. Their job
     is to teach students to ignore noise.
   - One or two features that split the set 2-vs-3.
   - One discriminating detail per condition that only surfaces if the student
     **asks for it**. It is never volunteered.

   If all five share everything, it is a coin flip and students learn
   helplessness. If each has a unique giveaway, it is a lookup table and there is
   no thinking. The staggered middle is the whole exercise.

3. **The ambiguous patient** (`ai_chat`, `max_messages: 18`, 35 min) — a patient
   whose story is genuinely consistent with at least three of the five. No
   options offered, no hints, and the AI never says which one it is. The message
   cap does the pressure work.

   The patient volunteers only the shared, uninformative symptoms. Every
   discriminating detail must be asked for. This is where Day 1's listening
   exercise pays off.

4. **Which one, and why not the others** (`text_answer`, 25 min) — the day's
   deliverable, and the input to Day 3:
   - Which of the five do you think this is?
   - Which two were your closest runners-up?
   - For each runner-up: what specifically argues against it in *this* patient?
   - What did you have to ask for that the patient did not offer?
   - What do you still not know that would settle it?

   *Question 3 is the one that matters. A student who can only argue for their
   answer has not diagnosed anything, they have guessed and rationalised. The
   ruling-out is the skill.*

## Day 2 timeline

| Time | What |
|---|---|
| 0:00–0:25 | QTE, timed dialogue |
| 0:25–0:50 | The five conditions + comparison table |
| 0:50–1:25 | The ambiguous patient |
| 1:25–1:50 | Which one, and why not the others |
| 1:50–2:00 | Reflection |

`reflection_prompts`:
- Where did the timer make you choose worse than you would have?
- Which two of the five were hardest to tell apart, and what would separate them?
- What did the patient tell you only because you asked twice?

---

# Day 3 — Objection

**Point of the day:** in medicine, being right is not enough. You have to show
your reasoning to someone trying to break it. This is the highest-value day for
the fit question — it is where students discover whether they find defending
their thinking energizing or humiliating.

**The change from the original plan: off-time research is deleted.** Research
happens in the block.

`context_text`:
> Yesterday you picked one of five. Today you find out whether you picked it for
> a reason. Someone is going to disagree with you, and "it seemed right" is not
> going to survive.

**Activities**

**AI policy for today — state this out loud to students.**

> You may use AI to research the diseases. You may not use AI to decide what your
> patient has. Looking up what a condition looks like is what a textbook is for,
> and AI is a faster textbook. But no AI has met your patient. Only you have the
> conversation, so only you can do the matching.

The two activities below enforce this by structure, not by trust. Part A is a
task AI can help with and no learning is lost. Part B is a task AI cannot do,
because the evidence exists only in the student's own transcript.

1. **Part A — the diseases, in general** (`text`/`ai_chat`, 20 min) — **AI
   allowed and encouraged.** Students research their answer and the two runners-up
   they named on Day 2. Deliverable, a three-column comparison:
   - What does each condition typically look like?
   - Who typically gets it?
   - In principle, what single finding most cleanly separates each pair?

   Nothing about their patient goes in Part A. This is textbook work. Students
   should note where they got each answer, including "asked the AI" — that is a
   legitimate citation today, not a confession.

   Narrowing this from "research your case" to "separate these three" is
   deliberate. It is a task with a right shape, so students who do not know how to
   research still produce something usable.

2. **Part B — this patient, specifically** (`text_answer`, 20 min) — **no AI.**
   The commitment, and the day's real deliverable. For every row of their Part A
   comparison, students state what their own patient showed, and each line must
   end in one of exactly two ways:
   - a direct quote of what the patient said, or
   - **"the patient never told me this."**

   Then:
   - Which of the five is it?
   - Which two facts from your own conversation most support that?
   - For each runner-up, what in *this* patient argues against it?
   - What would you ask if you could go back?

   *The "never told me this" option is load-bearing. It is the honest answer for
   a feature they did not ask about, and it turns a gap in their history-taking
   into a visible finding instead of something to bluff past. Students who
   fabricate get caught in the spoken defence. Students who admit the gap have
   learned exactly what they missed — which is the point of the whole week.*

   The commitment must happen before the objection, or there is nothing at stake.

3. **The objection** (`ai_chat`, 30 min) — the AI presses on what they committed
   to. Full prompt below. Treat this as rehearsal, not assessment.

4. **Spoken defence** (live, 30 min) — **the real one.** Pairs in breakouts, then
   the mentor samples. Each student has 90 seconds to answer, out loud:
   - Which one is it, and why not your first runner-up?
   - What would change your mind?
   - What did you have to ask for that the patient never offered?

   Speaking is what makes this uncheatable. A student who understands their case
   answers in four seconds. A student holding an AI tab cannot, and the pause is
   audible. Text is never the answer medium here.

   **Mentor sampling:** with 20 students the mentor cannot hear everyone. Rotate
   through all four rooms and hear 5 students, chosen from whoever's `ai_chat`
   `completion_percentage` looked *suspiciously perfect* as much as from whoever
   looked stuck. Announce in advance that sampling happens but not who.

## Day 3 timeline

| Time | What | AI |
|---|---|---|
| 0:00–0:05 | State the AI policy out loud | — |
| 0:05–0:25 | Part A: the diseases, in general | **allowed** |
| 0:25–0:45 | Part B: this patient, specifically | **no** |
| 0:45–1:15 | The objection (rehearsal) | our AI only |
| 1:15–1:45 | Spoken defence, pairs + mentor sampling | none, spoken |
| 1:45–2:00 | Reflection | — |

`reflection_prompts`:
- When you were challenged, did you want to defend your answer or abandon it?
- Was it harder to say out loud than to write? Why do you think that is?
- Where did AI actually help you today, and where did it turn out to be useless?
- Was being questioned interesting or unpleasant? Answer honestly. There is no
  right answer and nobody sees this but you.

---

## The AI-shortcut problem, and what actually fixes it

**The failure:** a student pastes the patient's clues into an external AI, gets
"probably X because Y and Z," pastes that into the objector, pastes the
objector's pressure back into the AI, and pastes the defence back. They are a
copy-paste pipe between two AIs. `completion_percentage` reaches 100 and the
transcript reads *excellently* — so the mentor sees a top performer. This is
worse than a student who struggles visibly.

**Why prompting cannot fix it.** `completion_criteria` scores the words in the
conversation, and AI-generated words satisfy any rubric better than a real
student's words do. A stricter rubric makes it worse, because it selects harder
for polished text. Any fix living inside the AI chat is theatre.

**The framing that resolves it: do not ban AI, split the task.**

"Research the disease" and "match it to the patient" are different operations,
and only the second one is the learning. Looking up what a condition looks like
is textbook work — AI is a faster textbook and nothing is lost. Deciding whether
*this* patient has it requires the transcript the AI never saw.

So Day 3 splits into Part A (AI allowed, general disease knowledge) and Part B
(no AI, and structurally useless, because every claim must cite the student's own
conversation).

**Sanctioning AI for Part A is itself a control.** A student secretly using AI
conceals it and you learn nothing. A student using it where it is permitted has no
reason to hide, so the ones reaching for it in Part B are visibly doing something
different from everyone else.

Five layers, none of which depend on the rubric:

1. **Closed set of five with ambiguous overlap** (Day 2). Turns an open question
   into a discrimination task. The AI's confident answer is frequently wrong when
   the five genuinely overlap, so pasting it is a losing strategy rather than a
   winning one.
2. **Task split.** AI is aimed at the half where it does no harm, which removes
   most of the motive to misuse it on the half where it does.
3. **Private information.** The discriminating details exist only in *that
   student's* Day 2 transcript, because the patient volunteers nothing. An
   external AI cannot know what the patient said unless the student pastes the
   whole conversation — enough friction to stop the lazy default, which is the
   actual problem. Determined students are not the ones to design around.
4. **Quotation or admission required.** Every Part B line ends in a patient quote
   or "the patient never told me this." Generic AI reasoning produces neither.
5. **Spoken defence.** The one robust layer. Removes text as the answer medium
   entirely.

**What this does not do:** stop a determined, well-organised student who pastes
transcripts and rehearses. Accept that. The goal is that the *easy* path runs
through actually thinking, and that anyone taking the shortcut gets caught the
moment they have to speak.

---

# Day 4 — The Parts Nobody Posts

**Point of the day:** the parts of medicine the week has not shown yet — what a
hard decision actually costs, what the years look like, and what it is like to
put your hands on a real person.

`context_text`:
> Everything this week has been the interesting part of medicine. Today, the
> rest of it.

## The debate — the centre of the day

**Replaces the AI ethics dilemma.** A simulated dilemma is a hypothetical. A real
case that actually happened has consequences you can point to, and a real person
who lived with the outcome. That is the difference between students discussing
weight and students feeling it.

**Format: Discord, two rooms of 10.** A single 20-person debate means five people
talk and fifteen watch.

| Time | What |
|---|---|
| 0:00–0:10 | The case, presented cold. No framing, no hint of a right answer. |
| 0:10–0:20 | **Write your position first** (`text_answer`), before hearing anyone. |
| 0:20–0:25 | Positions assigned — **against** what most of them wrote. |
| 0:25–0:50 | Debate, two Discord rooms of 10, mentor floats between them. |
| 0:50–1:00 | Back together: what was the strongest point the other side made? |

**Three rules that make it work:**

1. **Write before you hear anyone.** Otherwise the confident students set the
   room's opinion in the first two minutes and everyone else agrees. Writing
   first also means nobody can free-ride on the debate.
2. **Argue the side you disagree with.** Same mechanic as the old dilemma, but
   with a real case it is much stronger — you cannot dismiss a position as stupid
   once you have had to make its best case.
3. **The closing question is "what was the strongest point against you?"** Not
   "who won." Nobody wins. The exercise is knowing the cost of the side you chose.

**Choosing cases — this decides whether the day works.** Pick cases where **both
sides cost something real**. Avoid anything with an obvious right answer, or where
one side is indefensible — students will simply perform the correct opinion and
learn nothing about weight.

Shapes that work (your med student fills in with actual Thai cases):
- A doctor who kept working while exhausted, and what happened.
- A doctor who reported a senior colleague, and what it cost them.
- Resource allocation: who gets the bed, the ICU slot, the organ.
- A treatment refused by a competent patient whose family disagreed.
- A missed diagnosis that was reasonable given what was known at the time.

*The last shape is the most valuable one for this camp, because it is the one
they are least ready for: doing everything right and still being wrong. That is
the consequence students never imagine when they picture being a doctor.*

## The physical examination

**Why it belongs today.** Everything this week has been talking. Medicine is also
a physical craft, and this is the only moment students touch the work with their
hands. It also fills the gap in the original handwritten plan, which said "body
examine" twice and was never built out.

**Reference:** Geeky Medics respiratory examination —
https://www.youtube.com/watch?v=q6w3CClfhdk

Inspection, palpation and percussion need nothing but hands, which is why the
respiratory exam is the right choice for a no-equipment camp. It also maps onto
the five conditions from Day 2, so it is not a bolt-on.

**Be honest about the missing fourth step.** Auscultation needs a stethoscope
they do not have, and it is the part they will most want to do. Say so plainly:
*"You are doing three of the four steps. The fourth needs equipment you do not
have yet."* A camp that pretends is worse than one that names its limits.

### Structure (35 min)

| Time | What |
|---|---|
| 0:00–0:08 | Watch the technique. Inspection, palpation, percussion. |
| 0:08–0:18 | **On yourself.** Percussion is the one to spend time on. |
| 0:18–0:30 | **On someone at home.** Explain first, ask permission, then examine. |
| 0:30–0:35 | Record a short clip and send to the mentor. |

**Percussion is the moment.** It is genuinely surprising the first time — you can
hear a resonant chest against a dull one with no equipment at all, using only
your hands. Give it more time than it seems to need. That surprise is most of
what students will remember from today.

### The video

**Required, with a stated opt-out.** Every student does it and sends it, unless
they tell the mentor they are not comfortable — in which case it is simply fine,
no explanation needed and no follow-up.

Required-with-opt-out beats optional, because it flips who has to act: everyone
does it unless they speak up, rather than everyone skipping unless motivated. But
the opt-out must be real and stated **out loud, in advance, to the whole group**,
not buried in instructions. Some students have nobody willing at home, some
families will find it strange, and neither is a thing to be quietly excluded for.

- **Who watches:** the mentor, and only the mentor.
- **Length:** 60–90 seconds. Not the full exam.
- **Not graded.** It feeds tomorrow's 1:1 and nothing else.
- **Delivery:** Discord DM to the mentor. Not uploaded to the platform, not shown
  to the group.

**What the mentor watches for** — the useful part, because it is the only time
all week he sees them *do* something rather than write about it:

- Did they explain what they were doing before touching the person?
- Did they ask permission?
- Hand position and technique, roughly.
- Did they treat the person as a person, or as a mannequin?

*The permission question matters more than the technique. A student who is
technically clumsy but explains himself to his mother first is doing the harder
part correctly. That is worth saying to them in tomorrow's 1:1.*

**Timing note:** the mentor needs these videos before Friday. Sending them at the
end of Day 4 gives him the evening to watch 20 clips of 90 seconds — about 45
minutes with notes. Budget for it.

## Other activities

1. **What the years look like** (mentor, live to the whole group, 20 min) — the
   piece the original plan was missing. The mentor talks straight: the volume of
   memorisation, how long before you touch a patient, what call is like, what he
   got wrong about the path before he was on it, what he would still choose.

   *A student who hears the hard version and is still in on Friday is worth ten
   students who were only shown the puzzle.*

2. **The warning** (5 min) — tell them plainly: tomorrow you meet a patient
   nobody has seen, and it is not the same condition as your case this week.
   Bring your notes. Arrive ready to work.

## Day 4 timeline

| Time | What |
|---|---|
| 0:00–1:00 | The debate |
| 1:00–1:35 | The physical examination |
| 1:35–1:55 | What the years look like |
| 1:55–2:00 | The warning + reflection |

**The toolkit moved to Day 5.** Day 4 is full, and the toolkit is more useful
written immediately before the new patient anyway.

**If it overruns**, cut "what the years look like" to 12 minutes. Do not cut the
debate or the examination — they are the day.

`reflection_prompts`:
- What did you hear today that you did not know before?
- In the debate, what was the strongest point made by the side you were arguing
  against?
- What surprised you about examining a real person? What was awkward about it?
- Did today make medicine more or less attractive to you? Either answer is fine.

---

# Day 5 — The Case

**The goal:** every student leaves having done, unaided, something they could not
do on Monday — and knowing it, because they can see the difference themselves.

**Removed from the earlier draft: the recording and the group presentation.**
Both were theatre. The recording tested reading a script aloud, not thinking, and
a non-medical parent cannot tell a worked-up case from a Wikipedia summary, so it
proved nothing to the audience it was built for. The group round was the standard
classroom carousel where listeners wait their turn; assigning them questions
produces performed questions, not real ones. Neither is worth 55 minutes.

**What replaces them:** the students' own before/after, and 1:1 time with someone
who read their work.

## The 1:1s — Friday runs long

**Friday is a 3.5-hour day.** Every other day is 2 hours; this one is not, and
students must be told at enrolment, not on Thursday.

**The arithmetic.** 20 students × 10 minutes = 200 minutes of mentor time. Add
two 10-minute breaks and Friday is 3h20 to 3h30. The 1:1s run *underneath* the
student work, so students are not sitting for 3.5 hours of activity — they do
about 100 minutes of work and spend the rest waiting, resting, or in their slot.

**Breaks are not optional.** Twenty back-to-back 10-minute conversations is a
real load, and a tired mentor in slot 18 gives generic encouragement — exactly
the failure the 1:1 exists to prevent. Two breaks, after roughly slot 7 and slot
14. Protect them.

**Students do not need to stay the whole time.** Once a student has finished
their work and had their slot, they can leave. Say this at the start, so the
ones scheduled early are not sitting through two hours of nothing. Being made to
wait for no reason undoes the goodwill the 1:1 just built.

**Slot order matters.** Put the students who struggled most in the middle of the
day, not at the end. They need the mentor at his sharpest, and they are the
students the camp most needs to reach.

**Structure of a 1:1 (10 min).** The mentor has read that student's week before
the call — their Day 2 diagnosis, their Day 3 Part B, their exam video, and what
they missed.

- **3 min — one specific thing they did well.** Not "good job." Something only
  true of them: *"You asked about her sleep. Nobody else did, and it was the
  thing that cracked it."* This is the whole point of the 1:1. If the mentor
  cannot find something specific, he has not read carefully enough.
- **3 min — one specific thing to work on**, framed as a next question to ask,
  never as a deficiency.
- **4 min — their actual situation.** What they are worried about, what they want
  to ask a real med student, what they should do next. Let them drive. This is
  the section students remember, and the first to be lost if slots are shortened.

**Rules for the mentor:** no scores, no ranking, never compare a student to
another student, and never tell them whether they should do medicine. If asked
directly, describe what the path demands and hand the decision back.

**Booking:** students sign up for a slot. Do not assign them. Choosing a time is
a small act of agency and it reduces the dread.

**Mentor prep is real work.** Reading 20 students' week and writing one specific
observation each takes 2–3 hours, and it must happen Thursday night. If the
mentor arrives Friday not having read, the 1:1s become generic encouragement and
the camp loses its best asset. Budget this explicitly.

`context_text`:
> New patient. Nobody has seen them, including us. You have four days of practice
> and your own notes. Find out what is happening to them.

## Timeline — 3h30

| Time | What | Build as |
|---|---|---|
| 0:00–0:10 | Open. Explain the day and the leave-when-done rule. | live |
| 0:10–0:25 | Toolkit: write your own one-page work-up sheet | `text_answer` |
| 0:25–0:45 | New patient, solo work-up | `ai_chat`, `max_messages: 15` |
| 0:45–1:05 | Your answer, and why not the others | `text_answer` |
| 1:05–1:20 | **Monday vs today** — the before/after | `text_answer` |
| 1:20–1:35 | Private verdict + next step | `reflection_prompts` |
| **0:25–3:20** | **1:1s run underneath, 20 slots of 10 min** | live |
| 1:35 onward | Free: wait for your slot, then leave when done | — |
| 3:20–3:30 | Mentor closes with whoever is still there | live |

**The 1:1s run underneath everything from 0:25 onward** — 20 slots, plus a break
after roughly slot 7 and slot 14. Students are pulled out of solo work for their
slot. Nothing after 0:10 is a live group activity, so being interrupted costs
nothing.

**Student work is ~85 minutes; the day is 3h30.** That gap is intentional and is
why the leave-when-done rule matters. A student in slot 3 finishes their work,
has their 1:1, and goes home by 1:00. A student in slot 19 does their work, then
comes back later for their slot. Publish the slot times in advance so nobody
waits at a screen for two hours.

**The close is small on purpose.** Most students will have left. Do not build a
finale — the 1:1 was the ending, and it happened twenty separate times.

**The toolkit moved here from Day 4** — one page, written from memory, for
working up a patient from scratch: what to ask, in what order, plus the
comparison table for the five conditions. Writing it immediately before meeting
the new patient makes it revision rather than homework, and it is the thing they
keep.

**0:25–0:45 — the new patient.** Same chief complaint they have seen all week,
but a different one of the five underneath. The answer they memorised is now
wrong, so they have to work it out fresh. This is the only transfer test in the
camp, and doing it successfully *is itself* the feeling of having been helped —
no one has to tell them they improved.

**1:05–1:20 — Monday vs today.** The piece that does the work the recording was
supposed to do, except aimed at the student instead of a parent.

Show each student their **Day 1 transcript** next to their **Day 5 transcript**,
side by side, and ask:

- What did you ask today that you did not know to ask on Monday?
- Read your first conversation. What did you miss?
- How many questions did it take you on Monday to find out why they came in?
  How many today?

Most students have no idea they improved. They remember being confused on Monday
and being confused today, and conclude nothing changed. Putting the two
transcripts next to each other is the cheapest possible intervention and it is
the most reliable "oh" moment in the week. *This is the single highest-value
15 minutes on Friday.*

**1:20–1:35 — private verdict + next step.** Prompts below. Private, and say so.

Note that most students write this *before* their 1:1, which is deliberate: the
verdict should be their own, formed before a med student they admire says
anything encouraging to them. If they want to revise it afterwards, let them.

**3:20–3:30 — the close.** Short, with whoever is still there. The mentor names
one thing that surprised him about this group, and one thing he wishes someone
had told him at M4. No ceremony, no ranking, no certificates.

---

# Authored content — paste-ready

## Day 5 activity 1 — `ai_chat` (new patient)

**Title:** New Patient: 15 Minutes

**Instructions (student-facing):**
> This patient is new. Nobody has told you what is wrong with them. You have 15
> messages and your cheat sheet. Find out who they are and what is happening to
> them. When you are done, you will tell your group about them.

**`metadata.system_prompt`:**
```
You are a patient in an online consultation with a student who is learning to
take a clinical history. You are not a teacher, you are a person.

WHO YOU ARE
[AUTHOR: fill in — name, age, occupation, who they live with, why they came in
today rather than last week.]

WHAT IS ACTUALLY WRONG
[AUTHOR: fill in the true underlying diagnosis. It must be one of the five taught
on Day 2, and NOT the one this student concluded on Day 2-3. NEVER state it
directly. It must be assembled by the student from what you say.]

WHAT YOU SHARE WITH THE OTHER FOUR
[AUTHOR: list the shared, uninformative symptoms here. Volunteer these freely —
they are the noise the student must learn to see past.]

WHAT ONLY SURFACES IF ASKED
[AUTHOR: the discriminating detail. Never volunteer it. Give it plainly if asked
a direct question that would reasonably uncover it.]

WHAT YOU SAY FIRST
Open with your own words for the problem, the way a real person would. Do not
use medical vocabulary. Do not organise your story helpfully.

HOW YOU BEHAVE
- Answer only what you are asked. Do not volunteer the important detail.
- You have one thing you are embarrassed about and will only mention if asked
  directly, or asked twice, or asked kindly: [AUTHOR: fill in].
- If asked a vague question, give a vague answer. "Not great" is a complete
  answer to "how are you feeling?"
- If asked a specific question, answer it honestly and in detail.
- If the student is warm and unhurried, become more forthcoming.
- If the student is brusque or interrogating, get shorter and more guarded.
- You do not know which of your symptoms matter. Mention irrelevant things
  sometimes.
- If the student offers a diagnosis, react like a person, not a marker. Do not
  confirm or deny whether they are right.

HARD RULES
- Never say the name of your diagnosis.
- Never tell the student what to ask next.
- Never break character to give feedback, praise, or hints.
- Never say you are an AI.
- If the student asks something a patient could not know ("what does my white
  cell count show?"), say you don't know.
```

**`metadata.objective`:**
```
The student has gathered enough history to form a differential diagnosis: they
have established the nature and time course of the main complaint, asked at
least one question that uncovered information the patient did not volunteer,
and asked at least one question aimed at ruling something out rather than
confirming it.
```

**`metadata.completion_criteria`:**
```
Score on OBSERVABLE FACTS of the conversation only. Do NOT score on whether the
student's clinical conclusions are correct. Do NOT award points for politeness
alone.

Award 25 points each, maximum 100:
1. The student established the time course of the main complaint (when it
   started, whether it is changing).
2. The student asked at least one follow-up question that surfaced information
   the patient had not volunteered.
3. The student asked at least one question whose purpose is to exclude a
   possibility, not confirm one.
4. The student asked about context beyond the symptom itself (daily life, work,
   home, medication, family, what the patient thinks is happening).

Be strict. If a criterion is only partially met, award nothing for it. A
conversation that is friendly but gathers little information scores low.
```

**`metadata.max_messages`:** `15`

---

## Day 5 activity 2 — `text_answer` (your answer)

**Title:** Your Case

**Instructions:**
> Answer these in your own words. Not like a textbook — like someone telling a
> colleague about a person they just met.

**Prompts:**
1. Who is this patient? One sentence, as a person, not a diagnosis.
2. What did they tell you, and what did you notice that they never said?
3. Which of the five is it, and what makes you think so?
4. What else could it be, and what would you do to rule it out?
5. What would you want to know next, and what worries you most about them?

*Prompt 4 is load-bearing. It separates a student who memorised from one who is
reasoning. It is also the prompt the mentor should read before that student's
1:1 — it shows their thinking more clearly than the diagnosis does.*

*These answers feed the 1:1, not a presentation. Nobody performs them.*

---

## Day 5 activity 3 — `text_answer` (Monday vs today)

**Title:** Read Your Monday Self

**Setup:** the student needs their Day 1 transcript and their Day 5 transcript
visible at the same time. If the platform cannot show both, have them open two
tabs — this is worth the small friction.

**Instructions:**
> Open Monday's conversation next to today's. Read Monday's first, all the way
> through, before you answer anything.

**Prompts:**
1. What did you ask today that you did not know to ask on Monday?
2. Reading Monday's conversation now: what did you miss?
3. On Monday, how many questions did it take you to find out why they actually
   came in? Today?
4. What is one thing you would tell your Monday self?

*This is the highest-value 15 minutes of Friday. Most students genuinely do not
know they improved — they remember being confused on Monday and confused again
today, and conclude nothing happened. Putting the two transcripts side by side
is the cheapest intervention available and the most reliable "oh" moment in the
week. It replaces the recording, and unlike the recording it is aimed at the
student rather than at an audience who cannot judge the work.*

---

## Day 5 — `reflection_prompts` (private verdict)

Label these visibly as private, not shared with parents or family. The honesty
of the whole exercise depends on students believing that.

1. What part of this week felt like the real thing to you?
2. What part was harder than you expected?
3. On Monday you rated how much you want this. What is your number today, and
   did it move?
4. What is one thing you will do in the next 30 days?

**Prompt 4 needs an attached menu.** Offer, as a `text_answer` with options
listed in the instructions:
- Shadow a doctor or arrange to talk to one
- Read one specific book, and name it
- Follow one specific case series or channel
- Talk to one specific person, and name them
- **Nothing yet, and that is a real answer**

*The last option being explicitly offered is what makes the other four honest.*

**The next step must be specific enough to actually do.** "Shadow a doctor" helps
nobody — the student has no idea how to arrange it. The mentor should use the
1:1's last four minutes to convert whatever they chose into a concrete action:
the person to contact, what to say, and by when. A vague next step is the same as
no next step, and the difference is entirely in whether someone helped them make
it concrete.

---

## Day 3 — `ai_chat` (the objector)

**Title:** Objection

**`metadata.system_prompt`:**
```
You are an experienced senior doctor reviewing a student's diagnostic reasoning.
Your job is to press on it until it either holds or breaks. You are not hostile
and you are not sarcastic. You are demanding.

The student has committed in writing to a most-likely diagnosis and their
supporting reasons. Take their reasoning seriously and then push on it.

THE SET
The student has been taught exactly five conditions and has chosen one of them:
[AUTHOR: list the five here]
Confine your challenges to these five. Do not introduce a sixth condition.

HOW YOU PRESS
- Ask what specifically rules out the next most likely of the other four.
- Point out any evidence they have not accounted for.
- If they cite a fact, ask how it distinguishes their answer from another one.
  A fact consistent with three of the five is not evidence for one of them. Press
  hardest on facts that are actually shared across the set.
- Ask them what their patient said, in the patient's own words, that supports
  them. If they cannot produce anything specific to their own conversation, keep
  asking for it.
- If they say "it's most common," ask whether common is the same as likely in
  this particular patient.
- Ask what they would expect to see if they were wrong.
- Ask what they would do if they could not order any test.

RULES
- Never tell them whether they are right. Not at the end either.
- Never supply the answer or the reasoning you are fishing for.
- Do not accept "I think so" or "it feels right" — ask what it is based on.
- If they change their mind with good reason, acknowledge it and press the new
  answer just as hard.
- If they change their mind only because you pushed, say so and ask whether the
  evidence actually changed.
- Never apologise for questioning them.
- One question at a time.
```

**`metadata.objective`:**
```
The student has defended their diagnosis under sustained questioning: they have
distinguished their answer from at least one alternative, stated what evidence
would change their mind, and accounted for at least one piece of evidence they
had initially left out.
```

**`metadata.completion_criteria`:**
```
Score on OBSERVABLE FACTS only. Do NOT score on whether the student's diagnosis
is correct — a student can defend a wrong answer well, and that counts as
success here.

CRITICAL: Do not award points for agreement, politeness, or confidence. Do not
award points because the student answered at length. A student who concedes
every time they are challenged scores LOW, not high.

Award 20 points each, maximum 100:
1. The student gave a specific reason distinguishing their diagnosis from at
   least one other named condition in the set of five.
2. The student stated what evidence or finding would change their mind.
3. The student addressed at least one piece of evidence they had not accounted
   for in their original written commitment.
4. The student referred to something specific their own patient said, rather than
   to general features of the condition.
5. The student maintained or revised their position with stated reasoning, as
   opposed to abandoning it under pressure or restating it unchanged.

Be strict. Partial credit is not available per criterion.
```

**Author warning:** this score is *diagnostic for the mentor, not a gate for the
student.* Do not treat 100% here as evidence a student understands their case —
a well-executed copy-paste through an external AI scores higher than an honest
struggling student. Use it to decide who to walk toward and who to sample in the
spoken defence, in both directions: unusually low *and* suspiciously perfect.

Test it before camp by giving deliberately weak, agreeable answers and confirming
it scores low. If everyone finishes at 100% on the day, the criteria are too soft.
Criterion 4 is the one that most resists AI-generated answers — keep it.

---

# What students take home

**The parent-facing artifact is dropped.** It was the wrong goal. A recording of
a student stating a conclusion proves nothing to a non-medical adult, who cannot
distinguish worked-up reasoning from a summary read aloud. Building for an
audience that cannot judge the work produces theatre, and students can tell.

The goal instead is that **students finish the week feeling that someone helped
them.** That is built from four things, in order of how much they matter:

1. **The 1:1.** Ten minutes with a med student who has read their actual work and
   can name one specific thing they did. This is the single strongest lever in
   the camp. Everything else is a distant second.
2. **Their own before/after.** Monday's transcript next to Friday's. Improvement
   they notice themselves is worth far more than improvement they are told about.
3. **Doing Friday's new patient unaided.** Succeeding at a real transfer task is
   itself the experience of having been helped — nobody has to say it.
4. **A next step concrete enough to act on**, made concrete by the mentor in the
   1:1, not chosen from a menu alone.

**What they physically keep:** their toolkit page (written Day 4), their two
transcripts, and their next step. Nothing is shared with parents by default. If a
student wants to show their family, that is their choice to make.

**Private** — verdict reflection and the 30-day step. Student's own copy, and
say so out loud.

*Platform note: `path_reports` and `share_token` still exist and could deliver a
report, but nothing in this design needs it. `PathReportData` carries
`days_completed`, `total_time_minutes`, and a feelings trend — a participation
record, not evidence of capability. Do not spend engineering time on it.*

---

# What needs your med student, not me

1. **The five conditions, and their overlap pattern.** The single most important
   authoring decision in the camp. All five must present with the same chief
   complaint, share 3–4 uninformative symptoms, split 2-vs-3 on one or two
   features, and each carry one discriminating detail that only surfaces when
   asked for. Get the overlap wrong and the whole week collapses into either a
   coin flip or a lookup table.

   Sanity test before camp: write out the five and ask whether a smart student
   could reach the right answer *without* asking a single question they were not
   prompted to ask. If yes, the discriminating details are too easy to reach.

2. **The Day 5 case.** Must be one of the five, must not be the one that student
   concluded earlier in the week, and must be genuinely reachable with the
   comparison table plus good questioning. Second-hardest authoring problem.

3. **All `completion_criteria` wording**, tested before camp with deliberately
   weak answers.

4. **Day 4's honest account.** Nobody else can give it.

# Open engineering question

Surfacing `completion_percentage` per student to the mentor during the block.
The data is already stored on `path_activity_progress`; whether there is a live
view of it across 20 students needs checking. Without it, principle 2 — mentor
walks toward people — depends on the mentor guessing, which is where the quiet
students get lost.
