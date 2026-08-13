# DM Lead Analysis — What They Want, Is It PathLab, Is It Converting

**Date:** 2026-08-13
**Data:** `dm_conversations` (326), `dm_messages` (1,213), `ig_comments` (861) — pulled from production via service role.
**Window:** the whole campaign is ~48 hours old (first real message 2026-08-12 10:44, last 2026-08-13 14:56). 1,162 of 1,213 messages and 829 of 861 comments are from this window. Treat conversion numbers as *early*, but treat the funnel shape as real.

---

## 1. Headline

The demand is real and the intent is sharp. The product being offered is not the thing they asked for, and almost nobody is being asked to buy.

- 408 unique people commented "Port" in ~2 days. 326 DM threads opened.
- 114 threads got a reply from the lead (35% of threads, 28% of commenters).
- **19 of 114 engaged leads (17%) ever received the PathLab link.**
- **5 of 114 (4%) ever discussed price at all.**
- **0 PathLab enrollments in August 2026.** Zero. Total lifetime `path_enrollments` = 35 rows / 17 distinct users, all Feb–Jul 2026, **0 completions**, 28 of 35 stuck on day 1.
- 75 of 114 engaged threads (66%) end with the *lead* speaking last — i.e. PassionSeed left them hanging.
- 44 of 114 engaged threads (39%) never got pitched anything at all.

So the honest answer to "is PathLab converting": **it is not being sold, so it cannot be said to be converting.** The 0% is not primarily a PathLab-quality signal — it is a funnel-execution signal. The one real quality signal we do have is damning in a different way: of 17 humans who ever enrolled in PathLab over six months, **not one finished a 5-day path**, and 80% never got past day 1.

---

## 2. Who these leads are

| Grade | Count (classified) |
|---|---|
| ม.4 | 53 |
| ม.5 | 27 |
| ม.6 | 9 |
| ม.3 | 5 |
| unknown | 232 |

Skew is overwhelmingly **ม.4** — 2 years out from admission, maximum time, maximum anxiety, zero portfolio.

Declared interests (of the 72 classified): วิศวกรรมศาสตร์ 21, แพทยศาสตร์ 17, บริหารธุรกิจ 10, นิติศาสตร์ 8, วิทยาการคอมพิวเตอร์ 7, พยาบาล 6, นิเทศ 6, จิตวิทยา 5, เภสัช 5. Long tail: อักษร, สถาปัตย์, สัตวแพทย์, การบิน, ดนตรี, การแสดง/ไอดอล, ปวช.ก่อสร้าง.

**Only ~2 of the top 9 declared fields are ones PathLab can currently serve well** (tech, business). The single largest demand blocks — engineering and medicine — have no PathLab. One lead literally got told this to their face: *"ตอนนี้พี่ยังไม่ได้ทำสายนิติเลยน่ะ"* → *"โอเคคับ ;("*. An admin message in another thread says the quiet part: *"ตอนนี้ต้องการ pathlab สายแพทย์มากครับ มีใครมาทำอะไรแนะนำเด็กๆ ได้ไหม"*.

---

## 3. What they actually asked for

Counted over the 114 engaged threads, on inbound text only:

| Signal | Threads | % |
|---|---|---|
| Asked for a method/technique/"what should I do next" | 20 | 18% |
| Mentioned สอวน. / competitions | 22 | 19% |
| Asked about พอร์ต directly | 22 | 19% |
| Said they have nothing yet ("ยังเลย", "ยังไม่มี", "ไม่เคย") | 19–36 | 17–32% |
| Confused / can't find themselves / ลังเล | 7–15 | 6–13% |
| Asked "does this count / does it have น้ำหนัก?" | 5 | 4% |
| Asked about price or free | 4 | 4% |
| Family pressure or family finances | 4 | 4% |
| Asked for a certificate | 4 | 4% |

**They did not ask for a career-exploration lab. They asked for a portfolio that gets them admitted.** The literal opening request, over and over: *"อยากรู้วิธีการเก็บพอร์ตครับ ควรเริ่มตรงไหน"*.

Verbatims that define the segment:

- *"ยังครับ ยังไม่รู้จะเริ่มตรงไหนเลย😞"* — ม.4 วิศวะโยธา
- *"หนูสับสนมากกก หนูไม่รู้จะไปทางไหน มันตันไปหมดเลย"* — ม.4, torn between นิเทศ/นิติ/IT
- *"ผมทำอะไรได้หลายอย่างแต่ไม่เก่งซักอย่าง เหมือนแบบเป็นคนที่อยู่คาบเส้นครับ"* — ม.4
- *"ค่ายที่เล็งไว้มีค่าค่าย 4-5 พัน... แต่คนรอบตัวหนูบอกน้ำหนักมันไม่เยอะถ้าใส่ในพอร์ต"* — ม.4 แพทย์/นิติ
- *"อยากเข้าหมอให้ได้จริงๆ ผมอยากช่วยที่บ้านให้ได้มากที่สุด... พ่อจะเกษียณแล้ว แม่ทำขนมขายแบบเดิมไม่ค่อยได้แล้ว"* — ม.5
- *"ทั้งตระกูลผมเป็นสายสุขภาพหมดเลยครับ… แม่บอกให้สอบแพทย์ให้ติดก่อน แล้วค่อยทำอะไรก็ทำ"* — ม.5 who actually wants to build web/art
- *"ค่ายส่วนใหญ่เป็นวิทย์คณิตไปเลย หรือไม่ก็ศิลปะเลย เลยยังไม่ตอบโจทย์คนที่สนใจด้านภาษาแบบหนู"* — ม.4 ภาษา/นิติ
- *"เว็บไซต์ไม่มีรายละเอียดเลยครับ😔"* — after being sent the PathLab link

---

## 4. The underlying need — the frightening situation

They are not afraid of "not finding their passion." That is our framing, not theirs.

**The fear is: TCAS รอบ 1 is a scored competition against peers who started earlier, and I have nothing to submit and no idea what counts.** Three fears stacked:

1. **Evidence panic** — "I have nothing in the folder and the deadline is fixed."
2. **Legitimacy panic** — "I don't know what has น้ำหนัก. Open house? ค่าย? จิตอาสา? Everyone tells me something different." Repeatedly they ask us to *rank* activities, and our own answers are the highest-value thing in these transcripts (ค่าย > open house, โปรเจกต์ใช้งานจริง > ค่าย, สอวน./รีเสิร์ช for แพทย์, CPIRD as an under-contested round).
3. **Sunk-cost panic** — "If I bet on the wrong คณะ I lose 2 years and 4–5k baht per camp."

Their willingness to pay is attached to **admission probability**, not to self-discovery. Self-discovery is what they'll accept *as a means* to a portfolio. This is why "ลองว่าสายนี้ใช่ไหม" lands weakly and "ทำโปรเจกต์ที่ใส่พอร์ตได้จริง" lands hard.

Second buyer in the room, never addressed: **the parent.** *"เดี๋ยวลองไปกราบเท้าขอแม่ดูครับ😆"*, *"ถ้าแม่ผมขอหลักฐาน หรือ ความน่าเชื่อถือ พี่หาให้ได้ใช่ไหมครับ 🥲"*. We currently have no artifact to hand a parent.

---

## 5. Red flags

1. **Zero completion, ever.** 17 users, 35 enrollments, 0 completions, 80% dead at day 1. A 5-day self-serve path is not a product students finish alone. Selling it harder makes the churn worse, not better.
2. **Zero PathLab enrollments during a 300-thread traffic spike.** The biggest attention event this product has had produced no signups.
3. **The pitch is not being made.** 39% of engaged threads get no offer; 83% never see the link; 96% never hear a price. Any conversion measurement is currently measuring sales activity, not product-market fit.
4. **66% of engaged threads end with the lead talking.** Manual DM is already at capacity at ~100 conversations. This does not survive a second post.
5. **Supply/demand inversion.** Demand is วิศวะ + แพทย์ + นิติ. Supply is tech + business. We are turning down qualified demand by hand.
6. **The landing page fails at the moment of maximum intent.** A lead who asked for detail replied *"เว็บไซต์ไม่มีรายละเอียดเลยครับ😔"*. The link is the drop point.
7. **Price improvised in-thread.** 299 solo / 1,000 group-of-4 / "600–700 per month" for community, plus a free-forever waiver given away to the single hottest lead in the dataset. No price is being tested; a discount is being negotiated.
8. **Product promised ≠ product built.** In-thread the pitch is 5-day project + mentor call + Discord community. Admin: *"ตอนนี้กำลังสร้าง Community ครับ"*. We're selling a room that isn't furnished.
9. **861 IG comments, `replied_at` = 0.** Comment→DM handoff is leaking; several people comment *"หนูไม่เห็น DM พี่เลยค่ะ"* — IG is silently blocking the outbound DM for non-followers.

## 6. Green flags

1. **Cheap, repeatable top of funnel.** One post → 408 commenters → 326 DMs, essentially free. This is a real acquisition channel, not a fluke.
2. **35% reply rate to a cold outbound DM.** Very high. The "Port" hook works.
3. **Depth of engagement.** Median 3, mean 4.8 inbound messages per engaged lead; the top thread runs 80+ turns and ends with a ม.4 asking his mother for 299 baht at midnight. That is buying behavior.
4. **Advice is the actual product and it's good.** Every high-value moment in the transcripts is a ranked, specific judgment call: what counts, what doesn't, which round is under-contested, what to focus on this month. Leads visibly relax: *"ขอบคุณมากๆ ค่ะ โล่งขึ้นเยอะเลย"*.
5. **Price is not the objection.** *"299 ก็โอนะครับ ถ้าเทียบกับสิ่งที่จะได้กลับมา"*. 299 is under-priced for what's being described, and there's no evidence anyone balked at it.
6. **Radar already got unsolicited praise.** *"พี่บอก detail อะไรเยอะเลย แล้วมันก็ไม่ต้องไปหาที่ไหนแล้ว ประมาณว่าครบจบที่นี่"* — and she requested a new career, we added it, she came back. Radar is a working retention loop today.
7. **They recruit each other.** Group pricing came up unprompted; friends tagged friends in comments.

---

## 7. What to sell — the hair-on-fire fix

The burning problem is **"I have nothing in my portfolio and I don't know what counts."** Not "I don't know myself."

**Sell the portfolio plan first, the project second, the community third.**

### SKU 1 — Portfolio Audit / Plan (the wedge). ~299–490฿, delivered in 48h.
A named, dated, ranked plan for one student: their คณะ target, what they already have and what it's worth, the 3–5 specific things to do in the next 6 months (with which สอวน./แข่ง/รอบ, which deadlines), and what to skip. Delivered as a PDF the student can show a parent.
Why this and not PathLab: it's exactly what 100% of them asked for, we already produce it for free in DMs, it has no completion risk (we deliver, not them), and it produces the parent-facing artifact that's currently blocking the 299฿ sale.

### SKU 2 — PathLab, repositioned and re-shaped.
Keep it, but stop selling it as "test if this career fits you." Sell it as **"your first portfolio piece, finished in 5 days, with a mentor who signs off."** Two mandatory changes given the 0% completion rate:
- **Cohort, not self-serve.** Fixed start date, group of 4, live mentor checkpoints on day 1 and day 5. Solo async is empirically 0/17.
- **Deliverable = a portfolio page + certificate**, not a completion status. Four leads asked for a certificate unprompted.

### SKU 3 — Community (600–700฿/mo). Do not sell yet.
It doesn't exist and the promise is already outrunning the build. Sell it only after there are ≥10 students visibly shipping in Discord. Until then it's the retention story, not a line item.

### What to build in content, not product
The ranked "what counts in a พอร์ต" answers we're typing by hand belong on the site, per คณะ, with น้ำหนัก scores. That page converts the 83% of leads we never pitch — and it's the fix for *"เว็บไซต์ไม่มีรายละเอียดเลย"*.

---

## 8. Do this in the next 7 days

1. **Stop the leak before the next post.** 75 threads are sitting waiting on us. Reply to those first; they cost nothing.
2. **Make the ask, every thread.** Target: link + price in ≥80% of engaged threads. Right now it's 17% and 4%. Until that's fixed, no conversion number is interpretable.
3. **Fix the PathLab landing page** to answer, above the fold: what you make, how many days, who the mentor is, what the parent gets, what it costs.
4. **Sell 10 Portfolio Audits at 299฿** to the ม.4 วิศวะ/แพทย์ leads we currently have to turn away. That tests the wedge with zero new engineering.
5. **Run one cohort PathLab** (4 students, fixed dates, mentor on both ends) and measure completion. That's the only number that tells us whether PathLab is a product or a landing page.
6. **Ship วิศวะ and แพทย์ PathLabs** — 38 of 72 classified interests, and both are currently unserved.
7. **Instrument the join.** Nothing today links a `dm_conversations` row to a `path_enrollments` row. Give every DM a tracked signup link so this analysis is a query next month, not a script.

---

## 9. Caveats

- 48-hour window. Enrollment conversion could still land late; re-run before treating 0% as final.
- Stage/tag classification is thin: 213 of 326 threads are `stage = 'unknown'`, `wants_community` is 0 for all 326 (the tag is unused, not the demand). Tag counts are floors, not measurements.
- 212 of 326 threads have no inbound message stored. Some are genuine non-responses; some may be backfill gaps. The 35% reply rate is a floor.
- Intent percentages come from Thai keyword matching over inbound text, not human coding. Ranges given where the regex is loose.

**Repro:** `pnpm exec dotenv -e .env.local -o -- tsx scripts/dm-lead-dump.ts` (dump), then the analysis scripts in the session scratchpad.
