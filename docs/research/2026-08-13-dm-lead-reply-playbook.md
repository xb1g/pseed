# DM Reply Playbook — What to Sell, How to Say It, What to Build

**Date:** 2026-08-13. Companion to `2026-08-13-dm-lead-pathlab-review.md`.
**Scope:** the 326 DM threads and 861 IG comments in the inbox right now, the offer architecture behind them, and the three surfaces that make it scale.

---

## Part 1 — What we're selling

### 1.1 PathLab is the product. Everything else feeds it.

Nothing below replaces PathLab. Everything below exists to fill a seat, or to earn from leads PathLab can't serve yet.

Two facts constrain the whole plan:

**Fact A — PathLab covers a quarter of the demand.**
Seeds in production: web/full-stack, AI, data, cyber, gamedev, UX/UI, PM, business/econ, ชีวการแพทย์.
No seed for: แพทย์, ทันตะ, เภสัช, พยาบาล, นิติ, นิเทศ, อักษร, จิตวิทยา, สถาปัตย์, วิศวะโยธา/เครื่องกล/ไฟฟ้า.

| | field-mentions | students (approx) |
|---|---|---|
| Covered by a seed today | 26 | ~20 |
| Not covered | 70+ | ~45 |
| No field stated yet | — | 49 threads |

~1 in 4 qualified leads can buy PathLab today. The other 3 have urgency and money and nothing to buy.

**Fact B — PathLab as shaped is not finishable alone.** 35 enrollments, 17 users, **0 completions**, 28 stuck on day 1. Cohort format is a precondition for selling seats, not a nice-to-have.

### 1.2 One SKU, one price

Earlier drafts had a separate paid "portfolio plan." Kill that — two 299 products compete with each other and the plan reads as an ad for PathLab when sold separately.

**The plan is what PathLab includes, not a thing sold beside it.**

| Step | What they get | Price |
|---|---|---|
| In DM | **Poster** — their situation ranked, 3 next actions with น้ำหนัก scores, dated calendar, and "ขั้นแรก: PathLab สาย[X] รอบ [วันที่]" | free |
| They buy | **PathLab seat** — 5 days, real project, mentor day 1 + day 5, project page, certificate — **plus the full plan page**: 6-month sequence, competition calendar, deadlines, parent-facing | 299 solo / 1,000 group of 4 |

The plan stops being a SKU and becomes the reason 299 is worth paying. "Step 1 = do the PathLab" is credible when the plan came *with* PathLab; it's an ad when the plan was sold separately.

**Uncovered fields → pre-sell the seat, same price.**
> "สายแพทย์พี่กำลังทำอยู่ครับ จองรอบแรก 299 ได้เลย — ได้แผนพอร์ตเต็มไปก่อนวันนี้ แล้วค่ายเปิด [เดือน] น้องได้ที่แรก"

Takes money now, delivers value now, and **reveals which seed to build first by revealed demand instead of guessing.** Refund if the seed slips. A mentor-reviewed plan + call at 490 stays available as an upsell, but don't lead with it.

**Community (600–700/mo): do not sell.** Not built. The promise is already ahead of reality.

### 1.3 Why the plan is free at the top and gated below

Poster free, full page paid. Same knowledge, different form — and the form is what they actually asked for.

| | Poster (free) | Plan page (with purchase) |
|---|---|---|
| Form | image, IG-native, screenshot-able | web page, links live, updatable |
| Scope | ranks what they have, 3 next actions | full 6-month sequence |
| Deadlines | next 3 only | all, with links to apply |
| Parent-facing | it's the hook | it's the proof |
| Our cost | ~0 | ~0 after build |

The parent is the hidden second buyer: *"ถ้าแม่ผมขอหลักฐาน หรือ ความน่าเชื่อถือ พี่หาให้ได้ใช่ไหมครับ 🥲"*. A named, dated artifact survives contact with a parent. A chat message doesn't.

Principle: **give away judgment, sell artifacts.**

---

## Part 2 — The three surfaces

One dataset, three outputs, three different jobs. Don't conflate them — especially not for SEO.

| Surface | Job | Indexed |
|---|---|---|
| **Field pages** — `/พอร์ต/วิศวะ`, `/สอวน-2569` | Google traffic, converts the leads we never pitch | ✅ **the SEO asset** |
| **Plan page** — `/plan/[token]` | Conversion + parent proof | ❌ `noindex` (name, school, target คณะ = personal data) |
| **Poster PNG** | IG distribution | ❌ Google can't read images; IG links are nofollow |

### 2.1 Field pages are the SEO play

A personalized plan can never rank — it's unique, thin, and must be noindex. Search traffic lives on evergreen per-คณะ pages, fed by the same data.

Demand is high-intent, seasonal, barely contested:
- "สอวน 2569 สมัครเมื่อไหร่"
- "พอร์ต วิศวะ ต้องมีอะไรบ้าง"
- "ค่าย ม.4 คณะแพทย์"
- "open house ใส่พอร์ตได้ไหม" ← a lead asked this verbatim in DM

**The questions they type to us are the questions they type into Google.** Every ranked answer given by hand is a page. This is also the fix for *"เว็บไซต์ไม่มีรายละเอียดเลยครับ😔"* and the only way to serve the 87 engaged leads nobody has time to pitch.

### 2.2 Poster spec

1080×1350 (IG 4:5). Must read at thumbnail size. Dawn palette, per `docs/ui-design-system.md`.

```
แผนพอร์ต · [ชื่อ] · ม.4 · วิศวะโยธา
────────────────────────────
ตอนนี้น้องอยู่ตรงนี้        ▓▓░░░░░░  2/8
────────────────────────────
3 อย่างที่ต้องทำ (เรียงตามน้ำหนัก)
 1  โปรเจกต์ใช้งานได้จริง        ★★★★★
 2  สอวน. รอบ 1                  ★★★★☆
 3  ค่ายคณะโดยตรง                ★★★☆☆
    ─ open house                 ★☆☆☆☆  ข้ามได้
────────────────────────────
ปฏิทิน 6 เดือน
 ก.ย  สมัคร สอวน.      ปิด 30 ก.ย
 ต.ค  ค่าย วิศวะ มข.   ปิด 12 ต.ค
 พ.ย  NSC รอบเสนอ     ปิด 5 พ.ย
────────────────────────────
ขั้นแรกของน้อง
 PathLab วิศวะ · 5 วัน · เริ่ม 24 ส.ค · 299฿
────────────────────────────
passionseed.org · ทำให้ [ชื่อ] · 13 ส.ค 69
```

The น้ำหนัก stars and the dated calendar are the value — that's the thing 19% ask for by hand. Name + date make it feel made-for-them instead of a flyer.

### 2.3 Rendering

One HTML template, two outputs. Not two builds.

```
/plan/[token]           → HTML page (noindex), Dawn theme
/api/plan/[token]/png   → Playwright screenshot → PNG 1080×1350
```

**Use Playwright, not Satori/`@vercel/og`.** Satori's Thai shaping on combining vowels and tone marks (เ◌ื่, ◌ํ) is unreliable, and this artifact goes in front of a parent. Playwright renders Thai exactly as the browser does. Vercel Fluid allows 5GB packages, so it deploys fine.

### 2.4 Where each one goes

- **In DM: poster first, URL as a separate message.** The image renders inline in chat and gets looked at; a bare link is a grey rectangle nobody taps.
- **Link-in-bio → field pages**, so comment leads we can't DM still land somewhere (99 commenters currently have no DM thread because IG blocked it).
- **QR: skip for now.** Nobody scans a QR on the phone they're holding. It earns its place on printed things — school boards, open-house booths, flyers.

### 2.5 Generator lives in admin first

We run it, review it, paste it. No student-facing build, ships this week, quality controlled.

Accepted tradeoff: doesn't scale past our arms, captures no signup. Fine for 101 threads, not for 1,000. Self-serve later — same generator, different door. When it goes self-serve, gate it behind an account so `dm_conversations` → `path_enrollments` finally joins.

### 2.6 Competition data — hard rule

**Every date on a poster or plan comes from a curated table. Never from model recall.** The LLM will confidently invent สอวน. deadlines, NSC rounds, and ค่ายมหาลัย dates. A wrong deadline on a parent-facing artifact is the one mistake that can't be walked back. Same standard already held for Radar: never fake real-world facts.

```sql
-- competitions
name text                    -- สอวน. รอบ 1
field text[]                 -- ['วิศวกรรมศาสตร์','วิทยาการคอมพิวเตอร์']
grade_levels text[]          -- ['ม.4','ม.5','ม.6']
weight smallint              -- 1..5, the ★ score
application_opens date
deadline date
url text
source_checked_at timestamptz
verified_by text
```

Generator selects by field + grade + `deadline > now()`, then writes prose around the rows. **Anything not in the table does not appear in the output.** ~30 rows covers วิศวะ / แพทย์ / คอม / ธุรกิจ — a couple hours of research, reused across posters, plan pages, field pages, and Radar.

---

## Part 3 — How to talk to them

### 3.1 The one thing to change

Every thread is currently a free consultation that ends when we get tired. 66% of engaged threads end on the lead's message. 83% never see a link. 96% never hear a price.

**New rule: every thread reaches a yes/no on one priced thing, or an explicit "not now, ping me in X."**

### 3.2 The ladder — 4 moves, then stop

**1. Qualify** — one message, two questions max.
> "น้องอยู่ ม.ไหน แล้วสนใจคณะไหนอยู่ครับ บอกมาหมดเลยก็ได้"

**2. Pay first** — one *ranked* judgment. Not encouragement. A ranking with a reason.
> "ค่ายของคณะโดยตรง > open house เยอะมากครับ ส่วนโปรเจกต์ที่ใช้งานได้จริง > ค่าย อีกที เพราะกรรมการดูว่าเราทำงานยาวได้ไหม ไม่ใช่ว่าเราไปนั่งฟังมากี่ที่"

This move already works: *"ขอบคุณมากๆ ค่ะ โล่งขึ้นเยอะเลย"*.

**3. Mini-commit — ask, don't deliver.** Get them to say "อยากได้" before any price appears.
> "เดี๋ยวพี่ทำแผนพอร์ตให้เลยว่า 6 เดือนนี้ต้องทำอะไรบ้าง มีปฏิทินสมัครแข่งด้วย เอาไหมครับ"

Then send **the poster**. Not a wall of text — the poster is the free deliverable, and it ends on the CTA.

**4. Close — price + date, one message, both.** Then stop typing.
> Covered: "ขั้นแรกคือทำโปรเจกต์จริง 1 ชิ้น — PathLab สาย[X] 5 วัน 299 ครับ รอบหน้าเริ่ม [วันที่] รับ 4 คน แผนเต็มกับปฏิทินได้ไปด้วยเลย เอาไหมครับ"
> Uncovered: "สายนั้นพี่กำลังทำอยู่ครับ จองรอบแรก 299 ได้เลย ได้แผนเต็มไปก่อนวันนี้ ค่ายเปิด [เดือน] น้องได้ที่แรก"

Never state a price for something they haven't said they want.

### 3.3 Routing

```
stated field?
├─ no                 → qualify
├─ covered by a seed  → poster → PathLab cohort 299 / 1,000
└─ not covered        → poster → pre-sell seat 299 (plan delivered today)
```

**Never say "ยังไม่มีสายนั้น" and stop.** That produced *"โอเคคับ ;("* from a live lead.

### 3.4 Work order

| # | Bucket | n | Why |
|---|---|---|---|
| 1 | Hot — price already discussed | 5 | `phichyachumwngs`, `angpa0_a.m`, `puynoonpn_3`, `swj._few`, `pat1107_nni` |
| 2 | Waiting on us **and** qualified | 41 | Told us who they are; we went silent. Cheapest close in the data. |
| 3 | Waiting on us, not qualified | 34 | One question from bucket 2 |
| 4 | Link sent, never priced | 21 | Saw the page, never got asked to buy |
| 5 | Engaged, never pitched | 87 | Warm, zero offer. Poster + field page. |
| 6 | DM'd, no reply | 212 | One follow-up each, then drop |
| 7 | Commented, no DM thread | 99 | IG blocked our DM. Recover via comment reply. |

Buckets 1–4 = 101 threads, ~5 hours at 3 min each. **Do this before posting again.** Posting while 75 people wait burns the channel.

---

## Part 4 — Scripts

### 4.1 Hot (price already discussed)
> "เป็นไงบ้างครับ ถามที่บ้านได้ยัง 😆 พี่กันที่ไว้ให้แล้ว รอบนี้เริ่ม [วันที่] มี 4 คน ถ้าพร้อมทักมาได้เลยครับ"

Quiet after "จะถามแม่" — send the poster + parent one-pager:
> "เดี๋ยวพี่ส่งอันนี้ให้เอาไปให้แม่ดูนะครับ — มีแผน 6 เดือนของน้อง + ตัวอย่างผลงานรุ่นพี่ที่ติด [มหาลัย] ถ้าแม่มีคำถาม ให้แม่ทักมาถามพี่ตรงๆ ได้เลยครับ"

### 4.2 Qualified, we went silent
Continue — never apologise, never restart.
> "โทษที หายไปคุยกับน้องคนอื่นอยู่ 😅 กลับมาที่ของน้องนะ — ม.4 สาย[X] ที่ยังไม่มีผลงานเลย พี่เรียงให้ 3 อย่างตามน้ำหนักเลย: 1) [ของจริงเฉพาะสายนั้น] 2) [อันดับสอง] 3) [อันที่ไม่ต้องเสียเวลา]
> เดี๋ยวพี่ทำเป็นแผนให้เลย เอาไหมครับ"

### 4.3 Waiting, not qualified
> "ขอถาม 2 ข้อสั้นๆ นะครับ 1) ตอนนี้ ม.ไหน 2) มีคณะในใจกี่คณะ บอกมาหมดเลยก็ได้ เดี๋ยวพี่ดูให้ว่าอันไหนควรลุยก่อน"

### 4.4 Got the link, never got a price
> "ได้ดูในเว็บยังครับ ตรงไหนงงถามได้เลย — สรุปสั้นๆ 5 วันได้โปรเจกต์ 1 ชิ้นใส่พอร์ต มีเมนเทอร์เช็กให้ จบแล้วได้เกียรติบัตร + แผนพอร์ต 6 เดือน 299 ครับ รอบหน้าเริ่ม [วันที่] เหลือ [n] ที่ เอาไหมครับ"

### 4.5 Engaged, never pitched
Start at rung 2. Ranked answer → mini-commit → poster → close. Don't open with a link.

### 4.6 No reply yet (one shot only)
> "ทักมาถามได้ตลอดนะครับ ระหว่างนี้ลองอันนี้ดู รวมไว้แล้วว่าสายนี้ต้องเก็บผลงานอะไรบ้าง แข่งอะไรได้บ้าง ปิดรับเมื่อไหร่ [ลิงก์ field page]"

One follow-up. Silent after that → stop. Don't burn the account.

### 4.7 Commented, IG blocked our DM
Several said outright *"หนูไม่เห็น DM พี่เลยค่ะ"*. Reply **in the comment thread**:
> "@user IG ส่ง DM ไม่เข้าอ่ะครับ 😭 กดทักมาที่ไอจีพี่ก่อนอันนึง เดี๋ยวส่งแผนให้ทันที หรือดูอันนี้ก่อนก็ได้ [link in bio]"

### 4.8 Objections

| They say | Say back |
|---|---|
| "ขอรายละเอียดแบบฟรีก่อน" | Poster is the free thing. Then: "วันแรกของค่ายฟรีครับ ได้ลองของจริงเลย ถ้าชอบค่อยจ่ายต่อ" |
| "ต้องถามแม่ก่อน" | Send poster + parent one-pager immediately, offer to talk to the parent. Never leave a 16-year-old to sell it alone. |
| "แพงไหม" | Don't discount. "ค่ายข้างนอกสายนี้ 4–5 พันครับ อันนี้ 299 แล้วได้ผลงานจริงกลับไป" — a lead volunteered that comparison themselves. |
| "มี certificate ไหม" | "มีครับ จบแล้วได้เกียรติบัตร + หน้าโปรเจกต์" — 4 asked unprompted. Make sure it exists. |
| Field we don't cover | Poster → pre-sell. Never end on "ยังไม่มี". |
| "ไม่มีคอม" | "ใช้ไอแพด/มือถือได้ครับ" — answered well once; make it standard. |
| Silence after price | Nudge at 24h, again at 72h with a deadline ("รอบนี้ปิดรับ [วันที่]"). Then stop. |

---

## Part 5 — Build order

1. **`competitions` table + ~30 verified rows** (วิศวะ / แพทย์ / คอม / ธุรกิจ). Blocks everything else and is reusable everywhere.
2. **Cohort format for PathLab** — fixed start date, group of 4, mentor checkpoint day 1 and day 5. Precondition for selling seats at all; self-serve is 0/17.
3. **Admin plan generator** → `/plan/[token]` page + `/api/plan/[token]/png` poster. Playwright, Dawn theme, noindex on the page.
4. **Parent one-pager** — what 299 buys, alumni results, who the mentor is.
5. **Field pages** — per คณะ, fed by the same table. The SEO asset and the link-in-bio destination.
6. **วิศวะ + แพทย์ seeds.** 38 of 72 classified interests. Takes PathLab from ~25% to ~75% coverage — biggest single lever available. Order them by pre-sale count, not by guess.
7. **PathLab page above the fold:** what you make, how many days, who the mentor is, what the parent gets, price, next start date.
8. **Fix the first auto-DM** — asks three things at once, fired twice in several threads. Cut to one question, dedupe.
9. **Log comment replies.** 861 comments, `replied_at` = 0 on all; we can't tell who was reached.
10. **Track the join.** Unique signup link per DM so `dm_conversations` → `path_enrollments` is a query.

---

## Part 6 — Sequencing and scoreboard

**This week:** work buckets 1–4 by hand. Pre-sell the uncovered ~45. Run one cohort PathLab with the covered ~20 and measure completion.
**Next:** ship the two seeds with the most pre-sales, launch field pages, move the generator self-serve.
**Then:** PathLab is the SKU, field pages are the funnel, and Community only once ≥10 students are visibly shipping.

Three numbers on the wall, daily:

| Metric | Now | Target this week |
|---|---|---|
| Engaged threads that got an offer | 24% | 80% |
| Engaged threads where a price was stated | 4% | 80% |
| Threads ending on our message | 34% | 90% |

Only after those are green does a conversion rate mean anything. **If we make 80 priced offers and sell zero, that's a product signal — then we change the product.** Right now zero sales is a sales-activity signal, nothing more.

---

## Part 7 — From the TOFU reel to MOFU to BOFU

The tofu reel earns attention. It should not carry the whole sale. The next
content has to move the student from "this sounds like me" to "I can see the
work" and then to "I know exactly how to start".

### 7.1 MOFU: make the portfolio problem concrete

Run three pieces after each tofu reel, each with one CTA and one field-specific
example:

1. **Ranking carousel:** "พอร์ต [คณะ] อะไรมีน้ำหนักจริง". Show three actions
   ranked by evidence value, one thing to skip, and one verified deadline. CTA:
   comment `แผน` or DM the field name.
2. **Map/node demo:** show 20–30 seconds of the actual PathLab map. One node
   should show the student doing the first real task and the artifact they will
   finish with. CTA: "อยากลอง node แรก พิมพ์ [สาย]".
3. **Student proof:** show the before/after: blank portfolio anxiety, the work
   produced, mentor feedback, and the finished project page. Do not lead with
   a certificate or a generic testimonial.

MOFU success is not likes. Measure saves, field-page visits, qualified DM
replies, and starts of the first map node. The job of MOFU is to earn a reply
and make PathLab feel like the obvious first step.

### 7.2 BOFU: remove the last three reasons not to buy

BOFU should be field-specific and cohort-specific:

1. **Offer post or live demo:** "PathLab [สาย] รอบ [วันที่], 5 วัน, ทำงานจริง
   1 ชิ้น, mentor เช็กวันแรกและวันสุดท้าย, 299 บาท, รับ 4 คน". Show the exact
   deliverable and the first node, not a feature list.
2. **Parent proof:** a forwardable one-pager with what the 299 บาท buys, the
   mentor identity, the schedule, the project page, and the refund rule if a
   pre-sold uncovered field slips. The parent is usually the real approver.
3. **Deadline and close:** send the poster first, then the price and start date
   in one message. Use a tracked signup link per DM. Follow up once at 24 hours
   and once at 72 hours, then stop.

For uncovered fields such as medicine or law, sell the first-seat pre-sale with
the full plan delivered now and a clear launch month. Use demand to choose the
next map to build. Never send a bare link, and never end with "we do not have
that field".

### 7.3 The DM handoff

The sequence is:

```
TOFU reel
  → MOFU ranking or real map node
  → one qualifying question
  → personalized poster
  → parent proof when needed
  → BOFU cohort seat: price + date + tracked link
```

The operating metric is not reel reach. It is the number of engaged threads
that receive a priced, field-matched offer and then start the first node. The
current campaign can measure reply rate by A/B arm; it still needs DM-to-
enrollment attribution before reporting revenue conversion.

---

## Addendum 2026-08-14 — Lessons from reading the top-12 threads end to end

Every hot/warm thread (starred, pay-ready, wants_pathlab, active this week) was read in full. These five findings change how we reply; the playbook above stands unless contradicted here.

### A. Bare link drops kill warm threads

Three threads (`pat1107_nni`, `phuwxdx.n`, `peaceful22_8`) ended with a polite "ขอบคุณค่ะ💗" immediately after we sent a naked PathLab link with no personalization. The link isn't a reply — it's homework.

**Rule: every link rides on one concrete first step written for that kid.** "ขั้นแรกของน้องคือ X" then the link. Never the link alone. This is now the enforcement of §4.5's "don't open with a link" for *mid-thread* drops too.

### B. Group-of-4 pricing is a structural blocker, not a discount lever

"ไม่มีเพื่อนสายเดียวกัน" stalled at least 3 threads. `gampun_inwza007` died exactly here: told group = 1,000฿/4, he had 2 people — "มีกันแค่ 2 คนจบเลย". A kid who can't find teammates can't use our pricing table.

**Rule: default to quoting the 299 solo seat.** Mention the group rate only when they volunteer friends. (The loneliness is also a product signal — these kids want Community, and the classifier keeps missing it.)

### C. The parent is the close — arm the kid, don't re-pitch them

Hottest lead (`phichyachumwngs`, ~70 messages, accepted 299฿) is blocked on exactly one thing: "ยังเลยครับ หาโอกาสอยู่" — hasn't asked mom. Re-pitching him does nothing.

**Move: send one forwardable message** — what PathLab is, 299฿, the waiver we promised, credibility proof (bizseed post, IG handle) — literally framed "ส่งให้คุณแม่ดูได้เลย". This operationalizes §4.8's parent row into a single artifact per lead.

### D. Med/health is the biggest live demand cluster — and it ships this week

4+ of the 12 active hot/warm leads are แพทย์/ทันตะ/สัตวะ/พยาบาล (`puynoonpn_3`, `peaceful22_8`, `potato_sweetheart8`, `studygimpi`). Med PathLab ships this week.

**Rule: hold med leads with a dated promise, never "ยังไม่มีสายนั้น".** "สายแพทย์เปิดรอบแรกสัปดาห์นี้ครับ ฝากไว้ได้ที่แรก" — then actually follow up on launch day. We already owe `peaceful22_8` a build ("เดี๋ยวพี่จะสร้างให้") — follow-through is the trust asset.

### E. Trust threads, not flags

The auto-classifier produced confident garbage on this set:

- `angpa0_a.m` flagged pay-ready because a message contained our own pasted sales playbook — that account is **our founder**. Now tagged `internal` and excluded from inbox/metrics (see `scripts/tag-internal-lead.ts`).
- `studygimpi`, `peaceful22_8` classified `job_seeking` — they're ม.4–ม.5 building portfolios, years from jobs.
- `wants_community: false` on kids whose literal stated pain is "ไม่มีเพื่อนสายเดียวกันเลย".
- `last_message_direction` stale on at least one thread (said outbound; lead had replied twice).

**Rule: before any close, read the last 10 messages.** Flags route, threads decide.

### Ops notes

- Duplicate auto-DM openers confirmed live (identical message 30 min apart on `potato_sweetheart8`, doubled greeting on `pat1107_nni`) — build-order item 8 is costing trust now, not later.
- The private-account recovery path in §4.7 is now a button: `/admin/ig-comments` surfaces "missed by DM" comments (no conversation exists = our DM never landed) with a bulk public-reply action. Public comment replies have no 7-day Meta window — only private replies do — so the recovery net runs on a 30-day lookback.
