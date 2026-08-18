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
reasoning correct." Every `completion_criteria` below is written to be checkable
on *observable conversation facts*, not on correctness. Where correctness matters,
a human judges — and after the Day 3 redesign, the only human judgment in the week
happens in the Friday 1:1. See "What the AI-shortcut problem costs us now."

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

**This structure is also the main remaining defence against the AI-shortcut
problem** (see the section after this day). A closed set of five turns diagnosis
from an open question into a discrimination task. An open question is what an AI
answers well. "Which of these five, and why not the other four?" requires knowing
what was taught, and because the symptoms overlap, a confidently-pasted AI answer
is often wrong.

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
   deliverable, and the main thing the mentor reads before that student's 1:1:
   - Which of the five do you think this is?
   - Which two were your closest runners-up?
   - For each runner-up: what specifically argues against it in *this* patient?
   - What did you have to ask for that the patient did not offer?
   - What do you still not know that would settle it?

   *Question 3 is the one that matters. A student who can only argue for their
   answer has not diagnosed anything, they have guessed and rationalised. The
   ruling-out is the skill.*

   **Every claim ends in a quote or an admission.** Each line of the answer must
   end in one of exactly two ways:
   - a direct quote of what the patient said, or
   - **"the patient never told me this."**

   *This requirement moved here from the deleted Day 3. The "never told me this"
   option is load-bearing: it is the honest answer for a feature they did not ask
   about, and it turns a gap in their history-taking into a visible finding
   instead of something to bluff past. It is also what makes the deliverable hard
   to produce from an external AI, which has never seen this student's transcript.*

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

## What the AI-shortcut problem costs us now

**The failure:** a student pastes the patient's clues into an external AI, gets
"probably X because Y and Z," and pastes that back as their Day 2 deliverable.
`completion_percentage` reaches 100 and the transcript reads *excellently* — so
the mentor sees a top performer. This is worse than a student who struggles
visibly, because it misdirects the one scarce resource in the camp: mentor
attention.

**Why prompting cannot fix it.** `completion_criteria` scores the words in the
conversation, and AI-generated words satisfy any rubric better than a real
student's words do. A stricter rubric makes it worse, because it selects harder
for polished text. Any fix living inside the AI chat is theatre.

**What the current design still has.** Three layers, none of which depend on the
rubric:

1. **Closed set of five with ambiguous overlap** (Day 2). Turns an open question
   into a discrimination task. The AI's confident answer is frequently wrong when
   the five genuinely overlap, so pasting it is a losing strategy rather than a
   winning one. This is now the strongest remaining control, which raises the
   stakes on getting the overlap right.
2. **Private information.** The discriminating details exist only in *that
   student's* Day 2 transcript, because the patient volunteers nothing. An
   external AI cannot know what the patient said unless the student pastes the
   whole conversation — enough friction to stop the lazy default, which is the
   actual problem. Determined students are not the ones to design around.
3. **Quotation or admission required.** Every line of the Day 2 deliverable ends
   in a patient quote or "the patient never told me this." Generic AI reasoning
   produces neither.

**What was removed, and what it cost.** An earlier draft had a Day 3 built around
an AI objector plus a 90-second spoken defence in pairs. The spoken defence was the
one robust layer — it removed text as the answer medium entirely, and a student
holding an AI tab could not answer in four seconds. Both were cut on the judgment
that being challenged by an AI carries no real social pressure and therefore
cannot test tolerance for being questioned, which was the day's stated purpose.

That judgment is about the *objector*. Cutting the spoken defence alongside it was
a deliberate simplification, and the cost is real: **there is now no point in the
week where a student has to account for their reasoning out loud.** A well-organised
student who routes Day 2 through an external AI will not be detected.

**If this turns out to matter on the day**, the cheapest patch is not to rebuild
Day 3. It is to add one question to the Friday 1:1, which is already a real
conversation with a real person: *"Tell me about your Tuesday patient. Why not
your first runner-up?"* Ten minutes with a mentor who has read the transcript
does the same work the spoken defence did, at no extra cost in camp time, and
without the artificial pressure of a simulated objection.

---

# Day 3 — The Parts Nobody Posts

**Point of the day:** the parts of medicine the week has not shown yet — what a
hard decision actually costs, what the years look like, and what it is like to
put your hands on a real person.

**Design change from the earlier draft: the Objection day is deleted.** It ran an
AI "senior doctor" that pressed on the student's Day 2 diagnosis, plus a spoken
defence in pairs. Both are cut, because being challenged by an AI carries no real
social pressure, and pressure that is not real cannot test tolerance for being
questioned — which was the day's whole purpose. The ethics debate moves into this
slot, and Day 4 becomes the med terminology lecture. The cost of the deletion is
recorded in the section immediately above this one.

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

## Day 3 timeline

| Time | What |
|---|---|
| 0:00–1:00 | The debate |
| 1:00–1:50 | Ethics carried into practice — see below |
| 1:50–2:00 | Reflection |

**0:00–1:00 — the debate**, exactly as structured above.

**1:00–1:50 — ethics carried into practice.** The debate is one case argued from
assigned sides. This block is the students' own position, in their own voice, on a
case nobody assigned them. Two parts:

1. **A second case, argued freely** (`text_answer` then Discord, 30 min) — a
   different shape from the debate case, presented cold. No assigned sides this
   time. Students write where they stand and what it costs, then discuss in the
   same two rooms. The mentor's job is to keep asking "and what does that cost the
   other person?"

2. **The line you would not cross** (`text_answer`, 20 min) — the day's private
   deliverable. Not a hypothetical:
   - Of the two cases today, which decision would you find hardest to live with?
   - What would you need to believe to make the other choice?
   - Is there anything you are fairly sure you would refuse to do, even if a
     senior told you to? Why that one?

   *This is the closest the week comes to asking a student what kind of doctor
   they would be, and it is the piece worth reading before their 1:1.*

`reflection_prompts`:
- In the debate, what was the strongest point made by the side you were arguing
  against?
- Was there a moment today where you changed your mind? What changed it?
- Which was harder: arguing a side you disagreed with, or saying what you
  actually think?

---

# Day 4 — The Words and the Hands

**Point of the day:** two things the week has not given them yet. The vocabulary
that makes medicine legible, and the first time they put their hands on a person.

**Design change: this day was previously the ethics debate**, which has moved to
Day 3. The med terminology lecture is new and replaces the deleted Objection day.

`context_text`:
> You have spent three days talking to patients in ordinary words. Today you learn
> the words doctors use with each other, and then you use your hands.

## Med terminology — the lecture (45 min)

**General med school vocabulary, not the five conditions.** This is deliberately
broad: the foundational language students will meet in year 1, not a glossary
bolted onto this week's cases. It is the piece of the camp that most resembles
what students imagine "learning medicine" is, and that recognition is part of its
value.

**What it needs to cover** — your med student sets the actual list:

- **Word construction.** Prefixes, suffixes, roots. Once a student can take
  `hepat-` + `-itis` apart, they can decode hundreds of terms they were never
  taught. This is the highest-leverage 15 minutes of the block: teach the machine,
  not the output.
- **Anatomical direction and position.** Proximal/distal, superior/inferior,
  medial/lateral, anterior/posterior. Needed to read anything.
- **The vocabulary of describing a patient.** Acute vs chronic, onset, duration,
  bilateral, the difference between a symptom and a sign.
- **Common abbreviations** they will see on any chart or in any case write-up.

**Teaching rule: build, don't list.** A slide of 80 terms teaches nothing. Give
them the pieces and make them assemble words they have never seen. A student who
can construct `bradycardia` from parts has learned something transferable; a
student who memorised it has learned one word.

**Delivery:** live from the mentor with a handout students keep, or `short_video`
plus a `text` reference sheet on the platform. The handout matters more than the
lecture — it joins the toolkit page as something they physically keep.

**Optional closer (5 of the 45 min):** hand them a real case write-up or discharge
summary, dense with terminology, and have them decode it. It converts the lecture
from vocabulary into the experience of reading medicine and understanding it,
which is a different and better feeling.

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
| 0:00–0:45 | Med terminology lecture + decode exercise |
| 0:45–1:20 | The physical examination |
| 1:20–1:40 | What the years look like |
| 1:40–1:45 | The warning |
| 1:45–2:00 | Reflection |

**The toolkit moved to Day 5.** Day 4 is full, and the toolkit is more useful
written immediately before the new patient anyway.

**If it overruns**, cut the lecture's decode exercise (5 min) first, then "what
the years look like" to 12 minutes. Do not cut the examination — students only
touch a real person once all week, and the video has to reach the mentor tonight.

`reflection_prompts`:
- What did you hear today that you did not know before?
- Which piece of terminology did you find you could work out for yourself once you
  knew the parts?
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
the call — their Day 2 diagnosis and the reasoning behind it, their Day 3 "line
you would not cross," their exam video, and what they missed.

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
> them. When you are done, you will write up what you found.

**`metadata.system_prompt`:**
```
You are a patient in an online consultation with a student who is learning to
take a clinical history. You are not a teacher, you are a person.

WHO YOU ARE
[AUTHOR: fill in — name, age, occupation, who they live with, why they came in
today rather than last week.]

WHAT IS ACTUALLY WRONG
[AUTHOR: fill in the true underlying diagnosis. It must be one of the five taught
on Day 2, and NOT the one this student concluded on Day 2. NEVER state it
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

## The objector — deleted, and what survives it

**This section previously held a full `ai_chat` system prompt for a "senior
doctor" who pressed on the student's Day 2 diagnosis.** It has been removed along
with Day 3's Objection format. Nothing needs to be authored here.

**Why it went:** an AI objection carries no real social pressure. The day existed
to show students what being questioned feels like, and a simulated challenge
cannot deliver that — a student can close the tab, take as long as they like, and
nobody watches them be wrong. Pressure that is not real does not test tolerance
for pressure.

**What survives, and where it goes: the questions themselves were good.** They are
worth keeping as prompts for the mentor in the Friday 1:1, where the person asking
is real and the student answers out loud. Use one or two, not all of them — the
1:1 is ten minutes and encouragement matters more than interrogation.

- What specifically rules out your next most likely of the other four?
- What did your patient say, in their own words, that supports you?
- What would you expect to see if you were wrong?
- If it is "the most common one" — is common the same as likely in *this* patient?

*Tone note for the mentor: this is not a viva. Ask because you are curious about
their reasoning, not to find out whether they are right. If a student cannot
answer, that is a thing to be helped with in the moment, not a result to record.*

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

**What they physically keep:** their toolkit page (written Day 5), the
terminology handout from Day 4, their two transcripts, and their next step.
Nothing is shared with parents by default. If a student wants to show their
family, that is their choice to make.

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

3. **The two Day 3 ethics cases**, real and Thai, where both sides cost something.
   The debate case gets assigned sides; the second case does not. Now the whole
   centre of Day 3, so it carries more weight than in the earlier draft — one
   thin case will show.

4. **The Day 4 terminology list.** What actually gets taught in 45 minutes: which
   roots, prefixes and suffixes, which directional terms, which abbreviations,
   and the real case write-up used for the decode exercise. Keep it general med
   school vocabulary rather than a glossary for the five conditions.

5. **All `completion_criteria` wording**, tested before camp with deliberately
   weak answers.

6. **Day 4's honest account.** Nobody else can give it.

# Open engineering question

Surfacing `completion_percentage` per student to the mentor during the block.
The data is already stored on `path_activity_progress`; whether there is a live
view of it across 20 students needs checking. Without it, principle 2 — mentor
walks toward people — depends on the mentor guessing, which is where the quiet
students get lost.
