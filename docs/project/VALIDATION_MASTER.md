# PassionSeed Validation Master

**Date:** 2026-06-26  
**Status:** Working master doc  
**Purpose:** Centralize validation evidence before writing the Business Model Canvas.

This doc collects what we currently know, what is still a hypothesis, and what needs to be tested next. It should be updated after every poll, interview, concierge test, landing page test, and pricing conversation.

---

## 1. Current Validation Snapshot

### Strongest Signal

Students are not mainly asking for another personality quiz or social community. The clearest pain is **future ROI uncertainty**:

- "Which jobs will still have a future?"
- "If I study this, will it be worth it?"
- "What if I commit years and realize it is not me?"

The strongest solution pull is **easy-to-understand job market data**, but the first Radar tester also showed that data must feel credible, contextual, and grounded. Big salary numbers attract attention but can quickly break trust if students cannot see what level, experience, skill, and proof sit behind the number.

### Current Product Thesis

PassionSeed helps Thai students make high-stakes study and career decisions with more confidence by combining:

1. **Career reality data** through Radar: what the world needs, what pays, where roles are going.
2. **Human context** through mentors/seniors: what the path actually feels like.
3. **Hands-on trials** through PathLab/quests: a low-risk way to test fit before committing years.

### Confidence Level

| Area | Current Confidence | Why |
|---|---:|---|
| Student problem exists | Medium-high | Polls show clear anxiety around future ROI and wrong-path risk. Earlier interview work supports the same "planning in the dark" frame. |
| Radar wedge is attractive | Medium | Poll demand for job market data is strong; first tester found Radar interesting and well organized. |
| Trust bar for salary/job data | High | Tester explicitly flagged salary framing as exaggerated without requirements and experience context. |
| Peer community as core wedge | Low | Only 3% chose peer community as desired feature in the poll. |
| Willingness to pay | Low | Not validated yet. Need parent and student pricing tests. |
| Retention behavior | Low | Current evidence is interest/feedback, not repeat usage. |

---

## 2. Evidence Ledger

### Evidence A: Instagram Story Polls

**Source:** Instagram story polls  
**Audience:** Existing reachable student/social audience  
**Limitations:** Small sample, likely biased toward followers, not segmented by grade/school/parent income, polls force one answer.

#### Poll 1: Core Stressors About Future/Major

**Question:** What stresses you out the most about your future/major?  
**Total votes:** 41

| Option | Translation / Pain Point | Votes | Share |
|---|---|---:|---:|
| ไม่รู้งานไหนมีอนาคต | Not knowing which jobs have a future | 17 | 41% |
| กลัวเรียนไปแล้วไม่ใช่ | Fear of studying something and realizing it is not a fit | 14 | 34% |
| ไม่รู้เลือกคณะอะไรดี | Not knowing what major to choose | 5 | 12% |
| ไม่มีเพื่อนที่สนใจเหมือนกัน | Lacking peers with shared interests | 5 | 12% |

**Interpretation:** The top two answers are both risk questions:

- Future market risk: "Will this job still matter?"
- Personal fit risk: "Will this path be wrong for me?"

Together, these represent 75% of votes.

#### Poll 2: Current Information-Seeking Behavior

**Question:** How do you currently look up majors/careers?  
**Total votes:** 40

| Option | Translation / Channel | Votes | Share |
|---|---|---:|---:|
| ดู Tiktok/Youtube | Watching TikTok / YouTube | 13 | 32% |
| อ่านเว็บรีวิว | Reading review websites such as Dek-D/Pantip | 13 | 32% |
| ถามรุ่นพี่ | Asking seniors | 11 | 28% |
| ยังไม่รู้ | Do not know yet / have not looked | 3 | 8% |

**Interpretation:** Students already research, but mostly through passive and fragmented sources. They use channels that are accessible, not necessarily trusted or structured.

#### Poll 3: Desired Features / Solutions

**Question:** If you had a tool to help you choose, what do you want most?  
**Total votes:** 30

| Option | Translation / Feature Demand | Votes | Share |
|---|---|---:|---:|
| ข้อมูลตลาดงานแบบเข้าใจง่าย | Easy-to-understand job market data | 16 | 53% |
| คุยกับ mentor/รุ่นพี่ | Chatting with mentors/seniors | 7 | 23% |
| ไกด์ลองลงมือทำจริง | Practical hands-on try-it-out guides | 6 | 20% |
| กลุ่มเพื่อนที่สนใจเหมือนกัน | Community of peers with shared interests | 1 | 3% |

**Interpretation:** The strongest requested feature maps directly to the strongest stressor. Students want the market reality made legible.

### Evidence B: Career Radar Tester Feedback

**Source:** One student tester  
**Product tested:** `app/radar`, specifically "สายงานกลยุทธ์และผลิตภัณฑ์ AI" / AI strategy and product career path  
**Limitations:** One qualitative data point, not representative yet.

#### Verbatim Feedback

> ผมได้ลองดูแค่ สายงานกลยุทธ์และผลิตภัณฑ์ AI นะครับ  
> ขึ้นต้นด้วยเงินเดือน 100k - 200k เนี้ย ดึงดูดแน่ๆครับ แต่ผมว่า เวอร์ไปในมุมมองของเด็ก อย่างผมนะครับ  
> ถ้าระดับนั้น น่าจะต้องมีแบบระบุว่า ต้องเก่งขนาด ....... มีประสาบการณ์ ......... ระดับไหน เลยฮะ  
> ถ้าอย่างผมแค่ จบ AI ไปแล้วได่ แสนกว่าเนี้ยผมนอนอ้วนแน่นอนครับ ใช้เอไอทำ แหม๋ สบายบรื๋อ  
> แต่ผมว่าม้นน่าจะมีมากแบบมากว่านั้นอีกเยอะเลย  
> แต่โดยรวมหาข้อมูลมาได้น่าสนใจ มีข้อมูลรองรับด้วยนิดหน่อย แล้วก็จัดเรียงเนื้อหาได้ดีเลยครับ

#### English Summary

The tester only tried the AI strategy/product career path. The 100k-200k salary headline was attractive, but felt exaggerated from a student's perspective. If the role can reach that level, the product should specify how good someone must be, what experience is required, and what level the salary refers to. Otherwise, a student could misread it as "I just graduate in AI and get 100k+ easily." Overall, the information was interesting, had some supporting evidence, and was well organized.

#### Product Learning

Radar's job is not to maximize excitement. Radar must create **earned trust**:

- Salary ranges should be labeled by level: entry, early career, experienced, senior.
- Every big number needs a "what it takes" explanation.
- Claims need source/date context.
- The story should show progression, not instant outcome.
- Students notice exaggeration quickly; hype weakens credibility.

This aligns with [`CAREER_RADAR_EDITORIAL_SPINE.md`](../CAREER_RADAR_EDITORIAL_SPINE.md): Radar should be an honest external-reality map, not a salary-flex listicle.

---

## 3. Core Validated Learnings

### Learning 1: The ROI Crisis Is Real

The top stressor was "not knowing which jobs have a future" at 41%, and the top requested feature was "easy-to-understand job market data" at 53%.

**Implication:** Career Radar is a strong wedge. It should answer market uncertainty before asking students to do heavier self-discovery or projects.

### Learning 2: Wrong-Path Fear Is Nearly As Strong

34% said they fear studying something and realizing later that it is not a fit.

**Implication:** Radar alone is insufficient. Market data answers "is this path valuable?" but not "is this path mine?" PassionSeed needs hands-on trials and reflection to close the loop.

### Learning 3: Students Currently Rely on Fragmented Sources

64% currently use TikTok/YouTube or review websites. Another 28% ask seniors.

**Implication:** The product should not fight existing behavior at first. It should package what students already seek into a clearer, more trustworthy format:

- Short, scannable career cards.
- Social-video style hooks, but with real evidence.
- Senior/mentor context embedded next to data.
- Shareable summaries students can send to parents or friends.

### Learning 4: Community Is Not the Initial Wedge

Only 3% selected peer community as their most desired feature.

**Implication:** Community may support retention later, but it should not be the primary promise. "Find friends like you" is weaker than "understand your future before you choose."

### Learning 5: Trust Is the Product

The Radar tester liked the organization and evidence, but objected to salary framing. This is a high-quality objection because it shows the student is engaged, not dismissive.

**Implication:** The product voice must be ambitious but sober. If PassionSeed helps students make life decisions, the content standard must feel closer to guidance than entertainment.

---

## 4. Current Hypotheses

| ID | Hypothesis | Current Status | Evidence | Next Test |
|---|---|---|---|---|
| H1 | Students feel meaningful anxiety about future job stability and ROI. | Supported | Poll 1: 41% chose future job uncertainty. | Repeat with 100+ segmented students. |
| H2 | Students fear wasting years on a wrong-fit major. | Supported | Poll 1: 34% chose wrong-fit fear. | Interview students who recently chose track/faculty. |
| H3 | Easy job market data is the strongest entry feature. | Supported | Poll 3: 53% chose job market data. | Test Radar completion and save/share behavior. |
| H4 | Mentor/senior access matters, but is secondary to data. | Partially supported | Poll 3: 23%; Poll 2: 28% already ask seniors. | Test mentor quote cards vs live mentor chat. |
| H5 | Hands-on career trials are needed to solve fit risk. | Plausible | Poll 3: 20%; prior product thesis. | Run 7-day PathLab concierge with 10 students. |
| H6 | Peer community is not a strong standalone selling point. | Supported for now | Poll 3: 3%. | Re-test as a retention layer, not acquisition hook. |
| H7 | Parents will pay for trusted guidance that reduces wrong-path risk. | Unvalidated | Existing business model assumption. | Parent interview + price anchor test. |
| H8 | Schools will pay for scalable guidance/reporting. | Unvalidated | Existing B2B possibility. | Interview counselors/admins after student proof. |
| H9 | Salary/job data increases activation if framed credibly. | Partially supported | Tester said salary attracts but can feel exaggerated. | A/B test salary-first vs mission-first Radar cards. |
| H10 | Students will return after first career exploration. | Unvalidated | No retention data yet. | Track D1/D7 return and saved paths. |

---

## 5. Target Customer Segments

### Primary User: Thai Secondary Students

Most relevant near-term segments:

| Segment | Situation | Main Pain | Best Initial Hook |
|---|---|---|---|
| M3 deciding track | Choosing Science/Arts/Vocational soon | Too early, too high-stakes | "See which futures each track keeps open." |
| M4-M6 choosing faculty | TCAS/faculty pressure | Major/job uncertainty | "Know what each major can actually become." |
| High-achieving but anxious | Many options, little clarity | Fear of choosing suboptimally | "Compare futures with real data." |
| Creative/AI-curious students | Interested in modern careers | No roadmap parents recognize | "Turn interest into a credible path." |

### Economic Buyer: Parents

Likely parent pains:

- Fear their child chooses the wrong faculty.
- Fear "passion" is impractical.
- Need credible evidence before supporting a nontraditional path.
- Want confidence that the child has a real plan.

Parent-facing value prop:

> Reduce the risk of wasting years and tuition on the wrong path by giving your child a structured, evidence-backed exploration report.

### Institutional Buyer: Schools / Counselors

Likely school pains:

- Too many students per counselor.
- Need structured career guidance activities.
- Need reports that can be shown to parents/admins.
- Need modern career content that stays updated.

School-facing value prop:

> Scalable career guidance that gives every student structured exploration, modern labor-market context, and decision-readiness reports.

---

## 6. Jobs To Be Done

### Student JTBD

When I am forced to choose a track, major, or future direction, I want to understand which options are actually worth pursuing and what they feel like in real life, so I can choose with confidence instead of guessing from TikTok, parents, or random seniors.

### Parent JTBD

When my child is choosing a path that affects university and career outcomes, I want credible evidence that the path is practical and suitable, so I can support them without feeling like I am risking their future.

### School JTBD

When students need guidance but counselor capacity is limited, I want a structured system that helps students explore paths and produces useful outputs, so guidance becomes scalable and measurable.

---

## 7. Product Implications

### Radar Must Become the Trust Wedge

Radar should be the first product surface for "what the world needs + what it pays." It should:

- Lead with the role's purpose and future direction.
- Show salary as progression, not a headline promise.
- Separate entry-level, early-career, experienced, and senior ranges.
- Add "what it takes" for each level.
- Show source/date and uncertainty.
- Include real senior/mentor trajectories where available.

### PathLab Must Solve Fit Risk

PathLab/quests should answer:

- "Do I enjoy the actual work?"
- "Am I good at the kind of thinking this path requires?"
- "What part was energizing or draining?"
- "What should I try next?"

### Mentor/Senior Input Should Be Embedded Before It Is Live

Live mentor chat is operationally heavy. Early versions can test demand with:

- Senior quote cards.
- Short interview clips.
- "Ask this senior one question" forms.
- Office-hour waitlists.
- Concierge mentor matching.

### Community Should Be a Later Layer

Community should support motivation, accountability, and identity after a student has chosen a path to explore. It should not be the homepage promise until stronger evidence says otherwise.

---

## 8. Business Model Canvas Inputs

These are not the final Business Model Canvas yet. They are the evidence-backed inputs to use when writing it.

### Customer Segments

- Thai secondary students choosing track/faculty/career direction.
- Parents of these students.
- Schools/counselors needing scalable guidance.
- Later: mentors/professionals and employers.

### Value Propositions

For students:

- Understand future careers with clear, credible data.
- Test paths before committing years.
- Talk to or learn from people already on the path.
- Build confidence and language to discuss choices with parents.

For parents:

- Reduce wrong-major/wrong-track risk.
- See evidence, not vague passion claims.
- Get a structured roadmap/report for the child's next steps.

For schools:

- Modern career guidance at scale.
- Student exploration reports.
- Better parent communication and counselor leverage.

### Channels

Currently evidenced:

- Instagram/TikTok-style content.
- Student referrals.
- Review/search behavior.
- Seniors/mentors as trust channels.

Potential:

- LINE OA for parent sharing and conversion.
- School workshops.
- University prep communities.
- Influencer/creator collaborations around TCAS/career decisions.

### Customer Relationships

- Student self-serve exploration.
- Guided reports and roadmaps.
- Mentor/senior touchpoints.
- Parent-facing summaries.
- School dashboards if B2B path is validated.

### Revenue Hypotheses

| Model | Buyer | Why It Might Work | Riskiest Assumption |
|---|---|---|---|
| Parent-paid roadmap/report | Parent | Clear link to avoiding wrong path and tuition waste. | Parents trust the report enough to pay. |
| Premium student subscription | Student/parent | Ongoing TCAS/career planning utility. | Students return often enough to justify subscription. |
| Paid workshops/camps | Parent/school | Easier to sell as event-based guidance. | Operationally scalable without becoming a service business. |
| School license | School | Counselor leverage and measurable guidance. | Long sales cycles and procurement friction. |
| Mentor marketplace | Student/parent | Human guidance is desired. | Enough supply quality and transaction frequency. |
| Employer talent access | Employer | Long-term talent pipeline. | Requires large, verified student supply first. |

### Key Activities

- Career data research and content production.
- Expert/senior interview collection.
- Radar and PathLab product development.
- Student validation loops.
- Parent pricing validation.
- Trust/source QA for all career claims.

### Key Resources

- Career data/content database.
- Mentor/senior network.
- Student audience and feedback loops.
- AI-assisted content generation pipeline.
- Product analytics and validation dataset.

### Key Partners

- Schools and counselors.
- University students/seniors.
- Professionals and mentors.
- TCAS/admissions content partners.
- Parent communities.

### Cost Structure

- Product development.
- Content research and verification.
- Mentor/interview sourcing.
- AI/API costs.
- Marketing/content production.
- School/parent sales effort.

---

## 9. What Must Be Validated Before Committing to a Business Model

### Must Validate First

1. **Activation:** Do students complete a Radar path when it is credible and not overhyped?
2. **Trust:** Do source labels, level labels, and "what it takes" cards increase perceived credibility?
3. **Action:** After Radar, do students save, share, ask for next steps, or start a PathLab?
4. **Buyer:** Will parents pay after seeing a student report/roadmap?
5. **Price:** What price feels acceptable for parent-paid guidance: 199, 499, 999, 1,990, or higher THB?
6. **Retention:** Is this a one-time decision tool, a periodic planning tool, or a program?

### Do Not Overbuild Yet

- Full peer community.
- Full mentor marketplace.
- School dashboard.
- Employer marketplace.
- Complex gamification.

These may be valuable later, but current evidence supports Radar + report + PathLab as the next validation path.

---

## 10. Next Validation Plan

### Round 1: Sharpen Student Demand

**Goal:** Confirm poll patterns across a larger and more segmented student sample.  
**Target:** 100+ students.

Questions to capture:

- Grade level.
- Current decision: track, faculty, career, no decision yet.
- Biggest stressor.
- Current research channels.
- Most wanted help.
- Confidence level from 1-10.
- Whether they would share a result with parents.

Success criteria:

- Job/future uncertainty remains top-two.
- Wrong-fit fear remains top-two.
- Job market data remains strongest or second-strongest desired feature.

### Round 2: Radar Concierge Test

**Goal:** Test whether Radar creates trust and action.  
**Target:** 10-15 students, 3-5 career fields.

Flow:

1. Student picks one career field.
2. Student reads Radar deck.
3. Ask them to highlight what felt useful, suspicious, missing, and share-worthy.
4. Ask what next step they want: mentor, hands-on trial, report, parent summary, another career.

Metrics:

- Completion rate.
- Trust rating.
- "I learned something new" rating.
- "I would share this" rating.
- Next-step choice.
- Qualitative objections.

### Round 3: Parent Report + Pricing Test

**Goal:** Validate buyer and price.  
**Target:** 15-25 parents.

Artifact:

- One-page student career exploration report.
- Includes Radar findings, fit reflection, risks, recommended next steps.

Price anchors to test:

- 199 THB: impulse purchase.
- 499 THB: affordable report.
- 999 THB: serious guidance product.
- 1,990+ THB: premium roadmap/session.

Key question:

> Would you pay today for this report or roadmap if it were based on your child's actual exploration?

Do not only ask "would you pay?" Ask for a concrete action:

- PromptPay deposit.
- Waitlist with phone number.
- Book a paid pilot.
- Referral to another parent.

### Round 4: PathLab Fit Test

**Goal:** Validate whether hands-on trials reduce wrong-path anxiety.  
**Target:** 10 students across 2 career paths.

Flow:

- 3-7 day lightweight challenge.
- Before/after confidence score.
- Before/after fit score.
- Reflection on what felt energizing/draining.
- Parent-shareable summary.

Success criteria:

- Students report clearer fit/non-fit.
- Students ask for another path or deeper roadmap.
- Parents understand the output.

---

## 11. Interview Guide

### Student Interview Questions

1. What future/major decision are you thinking about right now?
2. What makes that decision stressful?
3. Where do you currently look for information?
4. What source do you trust most? Why?
5. What source feels unreliable or confusing?
6. What job or major are you considering?
7. Describe one real workday in that job, morning to evening.
8. What salary or future do you expect from it?
9. What would make you believe the information is real?
10. If you saw a report about your fit and the career market, who would you show?
11. What would you want after reading Radar: talk to someone, try a project, compare another path, or show parents?

### Parent Interview Questions

1. What path is your child considering?
2. What worries you about that path?
3. What evidence would make you more comfortable supporting it?
4. Have you paid for tutoring, counseling, camps, or admissions help before?
5. What did you pay, and what made it worth it?
6. Would a career exploration report be valuable?
7. What price feels too cheap to trust, reasonable, expensive but possible, and too expensive?
8. What would you need before paying?

### Mentor/Senior Interview Questions

1. What did you misunderstand about this path before entering it?
2. What does the actual work look like day to day?
3. What skills separate entry-level from high-paying levels?
4. What should a high school student try before choosing this path?
5. What is changing because of AI or market shifts?
6. What would you warn students not to believe?

---

## 12. Decision Rules

### Double Down on Radar If

- Students complete the deck.
- Trust rating is high after source/level improvements.
- Students ask to compare more careers.
- Students share with friends or parents.
- Parents say the report makes the decision clearer.

### Double Down on PathLab If

- Students say hands-on trials changed their confidence.
- Wrong-fit anxiety drops after the challenge.
- Students want another challenge.
- Parents understand the value of "try before commit."

### Reconsider Business Model If

- Students like browsing but do not take next actions.
- Parents praise the mission but refuse even low-price tests.
- Schools show interest but sales cycles are too slow for the next stage.
- Mentors are hard to source or quality is inconsistent.

---

## 13. Open Questions

- Which student segment has the strongest urgency: M3 track choice, M4-M6 faculty choice, or university wrong-path students?
- Is the buyer parent, school, or student-led parent approval?
- Does Radar work better as free acquisition or paid report preview?
- Is the best first paid product a report, roadmap, workshop, or mentor session?
- How much proof do parents need before paying?
- Can PassionSeed keep career data updated cheaply enough to maintain trust?
- What is the smallest PathLab experience that changes student confidence?

---

## 14. Business Model Canvas Readiness

Ready to draft now:

- Problem.
- Customer segments.
- Initial value propositions.
- Current channels.
- Key activities/resources.
- Core risks.

Needs more validation:

- Revenue streams.
- Pricing.
- Customer relationships.
- School vs parent go-to-market.
- Retention model.
- Unit economics of mentor/hands-on components.

Recommended next step: write the first Business Model Canvas as **Version 0.1**, clearly separating evidence-backed blocks from assumption-backed blocks.

---

## 15. Links

- Problem context: [`2026-05-28-problem-context.md`](../2026-05-28-problem-context.md)
- Sister validation plan: [`2026-05-28-validation-plan-sister.md`](../2026-05-28-validation-plan-sister.md)
- Career Radar editorial spine: [`CAREER_RADAR_EDITORIAL_SPINE.md`](../CAREER_RADAR_EDITORIAL_SPINE.md)
- Revenue and business models sprint: [`fi/05-revenue-business-models.md`](../fi/05-revenue-business-models.md)

