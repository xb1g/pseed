# Career Radar — Grade 11 Student Review

**Reviewed:** 2026-07-24 · localhost:3000 · mobile 390×844 and desktop 1280×800
**Scope:** all four live radars — `cybersecurity`, `ai-engineer`, `data-scientist`, `software-engineer`
**Method:** read every card end to end as a Thai ม.5 student choosing a faculty in ~12 months. No console errors; only Next.js image warnings.

The audience test used throughout: *a 16-year-old who has never held a job, is picking a university faculty next year, and will decide in under 5 minutes whether this page is worth their time.*

---

## Verdict in one line

The four radars are four different products. `software-engineer` and `data-scientist` read as researched and honest. `ai-engineer` reads as well-written but internally inconsistent. `cybersecurity` reads as generated — placeholder sources, conflicting numbers, and the most optimistic scores of the set with the weakest evidence behind them. Fix cybersecurity first, then normalize the four into one shape.

---

## P0 — Trust breaks

These are the items where a student who checks one number stops believing the whole page.

### 1. Cybersecurity has three different entry salaries
| Where | Number |
|---|---|
| Hero card | `35k–70k+` |
| Salary card, Junior/Entry | `30k–55k` |
| Outlook card, เงินเดือนเริ่มต้น | `25,000฿/mo` |

Pick one canonical entry figure and derive the rest from it. This is the single most damaging defect on the page — salary is the first thing read and the easiest thing to cross-check.

### 2. Cybersecurity ships placeholder sources
- `[6] Penetration Tester Market Trends — Industry Report (Internal)`
- `[10] Career Path: Information Security Manager — Example Company Career Page`
- `[11] Inside the Hunt: A Day in the Life of a Threat Hunter — Cybersecurity Blog`

Three of thirteen sources are unverifiable, and `[6]` is cited inline on the Day-to-day card. The other three radars cite TDRI, BLS, O*NET, JobsDB, Stack Overflow, Levels.fyi. Replace or remove.

### 3. AI Engineer salary ceiling contradicts its own ladder
Salary card tops out at `AI Architect / Head of AI Platform — 150k+`. The Outlook card says เงินเดือนสูงสุด `250,000฿/mo`. Either the ladder is missing a rung or the outlook figure is unsourced.

### 4. Fresh-graduate hiring rate contradicts the competition narrative on three of four radars

| Radar | Outlook: อัตราการจ้างจบใหม่ | Competition card says |
|---|---|---|
| cybersecurity | 88%, ความอิ่มตัว 3/10 "การแข่งขันค่อนข้างต่ำ" | ด่านทักษะแรกเข้า 7/10, "ด่านแรกของเด็กจบใหม่ยังสูง" |
| ai-engineer | 82% | ด่านทักษะแรกเข้า 8/10, "ประตูเข้าค่อนข้างแคบสำหรับมือใหม่" |
| data-scientist | 67% | 8,242 CS graduates vs 376 no-experience postings |
| software-engineer | 50% | "placement rate เฉลี่ยอยู่ที่ 71-79%" |

Two problems. First, `อัตราการจ้างจบใหม่` is never defined — a student cannot tell whether it means "% of graduates who get hired" or "% of postings open to graduates," and the two readings point opposite directions. Second, on `software-engineer` the two numbers are simply different (50% vs 71–79%) with no reconciliation. Define the metric in a tooltip and make the two cards agree.

### 5. Data freshness labels are inconsistent and partly stale
| Radar | Label on nav | Newest source cited |
|---|---|---|
| cybersecurity | ประเมิน 21 ก.ค. 2569 | JobsDB **2023** |
| ai-engineer | ก.ค. **2026** (CE) | JobsDB Jul 2026 |
| data-scientist | ไตรมาส 2/**2568** (2025) | JobsDB Jul 2026 |
| software-engineer | กลางปี **2569** | JobsDB 2024 |

Buddhist and Common Era are mixed across radars, sometimes inside the same page. Cybersecurity claims a July-2026 assessment on 2023 salary data. Standardise on one era, and surface *source* date separately from *review* date.

---

## P1 — Comprehension

### 6. Jargon has zero affordance, and it is heaviest on the best card
Day-to-day is the card students actually read to the end — it is concrete and it answers "would I like this?" It is also where the terminology density peaks, with no way to look anything up:

- cybersecurity: SIEM, Splunk, Sentinel, false positive, Metasploit, Burp Suite, Nmap, exploit, CVE, NVD, CVSS, SLA, contain/eradicate/recover, post-mortem, ISO 27001, PDPA, Autopsy, Volatility
- ai-engineer: Grafana, Datadog, latency, token cost, chunking, embedding, RAG, fine-tune, offline eval, baseline, FastAPI, Lambda, guardrail, structured logging, model card
- data-scientist: EDA, Jupyter, null values, outlier, XGBoost, Optuna, MLflow, precision/recall/AUC, cohort analysis, Airflow DAG, dbt
- software-engineer: Jira, PR, Sentry, Datadog, CI/CD, regression, CloudWatch

Tap-to-define on first occurrence is the highest-ROI change on the entire product. A student who does not know what SIEM is cannot tell whether they want to do it all day.

### 7. Metric polarity is mixed inside a single card
The Competition card shows `ความต้องการจ้าง 8/10` (high = good) beside `การแข่งขัน 4/10` and `ด่านทักษะแรกเข้า 7/10` (high = bad, marked only by small grey caption text). Same visual treatment, opposite meaning. Colour-code direction or invert the bad metrics so all bars read "longer is better."

### 8. Cybersecurity copy addresses the student in the third person
> "นักศึกษาไทยวัย 15-18 ปีที่สนใจด้านเทคโนโลยี การแก้ปัญหา และการเรียนรู้อย่างต่อเนื่อง อาจพบว่าเส้นทางอาชีพนี้..."

The reader *is* the 15–18-year-old. Written this way it reads as a brochure adults wrote about students, not for them. Compare the software-engineer hero, which speaks plainly and is half the length. Rewrite in second person, three lines maximum.

### 9. Register is inconsistent within a page
Cybersecurity nav uses the informal `เธอ` ("AI จะแทนเธอไหม") while its body copy is formal academic Thai. Pick one voice per the radar editorial spine and apply it to nav labels, hero, and card bodies alike.

### 10. The AI Impact answer buries the lede
The card a student most wants is "will AI take this job." Cybersecurity opens with "AI ช่วยเพิ่มประสิทธิภาพและขยายขีดความสามารถ..." — a paragraph that never states a verdict, and it is the one radar with **no AI-impact score at all**. The other three lead with a number and a label (`5/10 งานบางส่วนกำลังเปลี่ยน`, `3/10 ได้รับผลกระทบน้อย`, `7/10 ได้รับผลกระทบสูง`), which is the right pattern. Add the score to cybersecurity; lead every AI card with verdict-then-explanation.

---

## P2 — Action and structure

### 11. There is no small first step, only one large one
Every radar ends with the same two buttons: `นัดคุยกับรุ่นพี่` and `ไม่สนใจลอง`. Booking a call with an adult stranger is a high-commitment act for a 16-year-old three minutes into a page — unpriced, unscheduled, unexplained (is it free? how long? do parents need to know?). And `ไม่สนใจลอง` is a dead end that offers nothing.

Meanwhile the content already names the right zero-commitment step and leaves it as plain text: TryHackMe and HackTheBox on cybersecurity, Coursera and bootcamps on data-scientist. Make them real links. Add a short self-check ("ใช่เราไหม") so a student can convert curiosity into a private answer before being asked to talk to a human.

### 12. Study Path is card 9 of 12–13 for an audience whose whole reason for visiting is choosing a faculty
It is also the thinnest card relative to its importance. It names programmes (วิศวกรรมคอมพิวเตอร์, CS, IT, สถิติ) but never says *which Thai universities offer them*, what TCAS round, what scores, or what a ม.5 student can do **this month**. Promote it, and add: Thai university examples, TCAS timing, and a "ตอนนี้ทำอะไรได้" block.

### 13. Trade-offs promises a fit test and never delivers one
The cybersecurity card is headed `ข้อเสีย + ใครไม่เหมาะ` and then lists four risks with no anti-fit content. Every radar has the same gap: risks are present, "who should not do this" is missing. This is the section a student uses to rule themselves in or out.

### 14. The four radars are not the same product
| | cybersecurity | ai-engineer | data-scientist | software-engineer |
|---|---|---|---|---|
| Cards | 12 | 12 | 13 | 13 |
| Hero metric | salary range | job-posting count (187) | global growth % (34%) | growth % + junior decline |
| AI Impact score | **missing** | 5/10 | 3/10 | 7/10 |
| Real Paths card | **missing** | **missing** | present | present |
| Currency toggle | no | no | **yes** (USD/THB) | no |
| Nav label language | Thai | Thai + English mix | Thai + English mix | Thai + English mix |

Four different hero metrics means a student cannot compare two careers, which is the entire premise of a *radar*. Pick one hero metric shape and one card set. Backfill AI Impact and Real Paths on the two radars missing them.

Related: `data-scientist` leads with a US BLS figure (34% growth, 2024–34) for a Thai student. Lead with the Thai number and keep the global one as context.

### 15. Card 1's section list is visible but not tappable
The numbered index (1–12/13) renders on the hero card but does not jump. On cybersecurity, "AI จะแทนเธอไหม" is the single most clickable-looking label on the screen and it is four swipes away. Let the index navigate.

### 16. No human imagery
Twelve to thirteen text cards, no faces, no workplaces, no clips. `data-scientist` and `software-engineer` have a Real Paths card describing a real person's route — that is the strongest content on either page and it has no photo. Career decisions are made partly by picturing yourself in the room.

---

## Nits

- `next/image` quality warnings on every radar: `/images/radar/cybersec.webp` and `/images/radar/jojo-full-body-blue.png` use quality 72 but `images.qualities` is `[75]`. Add 72 to the config or change the call sites.
- `/hackathon/HackLogo.png` is the LCP element and lacks `loading="eager"`.
- `Difficulty: Average/easy` and `Confidence: Medium` render in English on otherwise-Thai cards, and `Confidence: Medium` is meaningless to a student. Translate or hide.
- ai-engineer shows `การแข่งขัน 4/10` on the Competition card and `ความอิ่มตัว 4/10 "การแข่งขันปานกลาง"` on Outlook — two near-identical metrics on two cards inviting the reader to wonder which is real.

---

## Not a defect

Desktop mouse-wheel navigation works. Automated `window.scrollBy` does nothing because the deck scrolls inside a `.radar-deck` container rather than the window; wheel and touch events over the deck behave correctly.

---

## Suggested order

1. Cybersecurity data pass — reconcile the three salary numbers, replace the three placeholder sources, add the missing AI Impact score, fix the 2023-source/2026-label mismatch.
2. Cross-radar consistency pass — one era for dates, one hero-metric shape, one card set, define `อัตราการจ้างจบใหม่` and make it agree with the Competition card.
3. Jargon tooltips on Day-to-day, then Skills.
4. Metric polarity colour-coding.
5. Next Step ladder — real links to free hands-on resources, plus a self-check before the mentor call.
6. Promote and deepen Study Path with Thai universities, TCAS, and a "what to do in ม.5" block.
