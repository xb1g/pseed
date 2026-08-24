# Backup — orphaned nodes removed from "LaunchPad: Startup Sprint"

- **Map:** `00000000-0000-0000-0000-000000000020`
- **Taken:** 2026-08-24T12:46:40.159Z

These three English nodes were superseded by the Thai rewrite and had
**no edges** (in-degree 0 and out-degree 0), so the student trail forced
them onto depth 0 alongside `วันที่ 1`, causing the visual pile-up.

The live chain does NOT include them:

```
วันที่ 1 → วันที่ 2 → Day 3 [36b0458b] → Day 4 → Day 5 → Day 6
```

> Note: `Day 3: The Business Model [36b0458b…]` is the ACTIVE node and was
> kept. The removed Day 3 is the old seeded `…0011-000000000003`.

## Removed nodes

| id | title | had progress | had submissions |
|---|---|---|---|
| `00000000-0000-0000-0011-000000000001` | Day 1: Spot the Problem | 3 | 1 |
| `00000000-0000-0000-0011-000000000002` | Day 2: Who is Your Customer? | 0 | 0 |
| `00000000-0000-0000-0011-000000000003` | Day 3: The Business Model | 1 | 0 |

## Restore

Re-insert in this order (parents before children):
`map_nodes` → `node_content` → `node_assessments` → `quiz_questions`
→ `assessment_submissions` → `student_node_progress` → `node_paths`.

Every row below is a verbatim copy including its original primary key, so
re-inserting restores the same ids and all references line back up.

## map_nodes  (3 rows)

```json
[
  {
    "id": "00000000-0000-0000-0011-000000000001",
    "map_id": "00000000-0000-0000-0000-000000000020",
    "title": "Day 1: Spot the Problem",
    "instructions": "The best businesses do not sell products: they kill pain points. Today you become a Problem Hunter, and the hunt starts with one M.4 student panicking at 11:30 PM. That panic is the reason SeniorPass will exist.",
    "difficulty": 1,
    "sprite_url": "/islands/launchpad/day1.png",
    "metadata": {
      "day": 1,
      "theme": "Great startups do not start with ideas; they start with severe friction.",
      "careers": "Product Manager, UX Researcher",
      "position": {
        "x": 580,
        "y": 120
      }
    },
    "created_at": "2026-08-11T04:45:32.875094+00:00",
    "updated_at": "2026-08-15T17:19:15.685+00:00",
    "node_type": "learning",
    "version": 1,
    "last_modified_by": null
  },
  {
    "id": "00000000-0000-0000-0011-000000000002",
    "map_id": "00000000-0000-0000-0000-000000000020",
    "title": "Day 2: Who is Your Customer?",
    "instructions": "Yesterday you hunted pain points and picked a problem worth solving. Today you answer the harder question: who exactly feels that pain? If your answer is 'everyone', you have no customer. Today you find your ONE person.",
    "difficulty": 1,
    "sprite_url": "",
    "metadata": {
      "day": 2,
      "theme": "If you build for everyone, you build for no one. Find your exact person.",
      "careers": "UX Researcher, Data Analyst",
      "position": {
        "x": 580,
        "y": 580
      }
    },
    "created_at": "2026-08-11T04:45:32.875094+00:00",
    "updated_at": "2026-08-11T04:45:32.875094+00:00",
    "node_type": "learning",
    "version": 1,
    "last_modified_by": null
  },
  {
    "id": "00000000-0000-0000-0011-000000000003",
    "map_id": "00000000-0000-0000-0000-000000000020",
    "title": "Day 3: The Business Model",
    "instructions": "Yesterday you mapped your customer: Fah's panic, Beam's idle notes, their jobs, pains, and gains. Today you answer the question every founder eventually faces: how does this thing actually make money?",
    "difficulty": 2,
    "sprite_url": "/islands/launchpad/day2.png",
    "metadata": {
      "day": 3,
      "theme": "A cool app that loses money on every user is an expensive hobby, not a business.",
      "careers": "Business Analyst, Strategy Consultant",
      "position": {
        "x": 200,
        "y": 1040
      }
    },
    "created_at": "2026-08-11T04:45:32.875094+00:00",
    "updated_at": "2026-08-11T04:45:32.875094+00:00",
    "node_type": "learning",
    "version": 1,
    "last_modified_by": null
  }
]
```

## node_content  (19 rows)

```json
[
  {
    "id": "f8a1d2c4-60b5-492b-b79f-2f4c5482ec9c",
    "node_id": "00000000-0000-0000-0011-000000000002",
    "content_type": "image",
    "content_url": "https://pseed-dev.s3.us-east-005.backblazeb2.com/submissions/47fcee20-8515-42ed-bffb-efc4f56f559d/00000000-0000-0000-0011-000000000002/1786815133906_1we7bymlax4.png",
    "content_body": null,
    "created_at": "2026-08-15T17:32:19.417215+00:00",
    "content_title": null,
    "display_order": 3
  },
  {
    "id": "323842c5-e8de-488b-8871-0ab76976b236",
    "node_id": "00000000-0000-0000-0011-000000000003",
    "content_type": "image",
    "content_url": "https://pseed-dev.s3.us-east-005.backblazeb2.com/submissions/47fcee20-8515-42ed-bffb-efc4f56f559d/00000000-0000-0000-0011-000000000003/1786815287438_6ap754kwro8.png",
    "content_body": null,
    "created_at": "2026-08-15T17:35:10.581121+00:00",
    "content_title": null,
    "display_order": 1
  },
  {
    "id": "886eae54-5d98-42c6-bda7-7c70158e718b",
    "node_id": "00000000-0000-0000-0011-000000000001",
    "content_type": "image",
    "content_url": "https://pseed-dev.s3.us-east-005.backblazeb2.com/submissions/47fcee20-8515-42ed-bffb-efc4f56f559d/00000000-0000-0000-0011-000000000001/1787322697280_h2gdw2f5jgq.png",
    "content_body": null,
    "created_at": "2026-08-21T14:22:39.35197+00:00",
    "content_title": "Track A",
    "display_order": 7
  },
  {
    "id": "00000000-0000-0000-0013-000000000005",
    "node_id": "00000000-0000-0000-0011-000000000002",
    "content_type": "text",
    "content_url": null,
    "content_body": "\n<p>To understand a customer deeply, founders use the <strong>Value Proposition Canvas</strong>: a one-page map that lines up what your customer is trying to do with what your product offers. It starts with the <strong>Customer Profile</strong>, which has three parts:</p>\n<ul>\n<li><strong>Customer Jobs:</strong> What are they trying to get done? (e.g. Pass Thursday's physics midterm with a B+ without pulling an all-nighter.)</li>\n<li><strong>Pains:</strong> What frustrates or blocks them? (e.g. Tutoring at Siam is 800 THB/hr, the teacher's slides are 150 pages of dense theory, online videos take 3 hours.)</li>\n<li><strong>Gains:</strong> What would delight them? (e.g. A concise 4-page formula cheat-sheet, instant answers to 3 tricky homework questions.)</li>\n</ul>\n<p>A profile is a hypothesis. To check if it is real, you interview people. But interviews have a trap, and <strong>The Mom Test</strong> is the fix: a technique from Rob Fitzpatrick's book, named because even your mom will lie to protect your feelings. Never ask <em>\"Would you use my app?\"</em> Everyone says yes to be polite. Instead, ask about <strong>past behavior</strong>, because what people actually did beats what they say they would do:</p>\n<ol>\n<li><em>\"How did you prepare for your last physics quiz?\"</em></li>\n<li><em>\"What was the most frustrating part of that process?\"</em></li>\n<li><em>\"How much time or money did you spend trying to fix it?\"</em></li>\n</ol>\n",
    "created_at": "2026-08-11T04:45:33.142658+00:00",
    "content_title": "Value Proposition Canvas & The Mom Test",
    "display_order": 2
  },
  {
    "id": "00000000-0000-0000-0013-000000000004",
    "node_id": "00000000-0000-0000-0011-000000000002",
    "content_type": "text",
    "content_url": null,
    "content_body": "\n<p>Remember Fah, frozen over her physics slides at 11:30 PM? Yesterday you named her pain. Today you meet the other half of the story.</p>\n<p><strong>Fah</strong> is an M.4 science student. She wants to score 85+ on physics so her GPA stays above 3.5, but she keeps getting stuck on the hard problem sets. She does not want a 50-hour video course. She wants 20 minutes with someone who actually survived this exact exam.</p>\n<p><strong>P'Beam</strong> is an M.6 senior. He scored 94% on that exact physics exam last year, and his handwritten 4-page summary sheets are sitting idle in his GoodNotes, helping nobody.</p>\n<p>One person has a desperate need. The other has the exact fix, gathering dust. This is a <strong>marketplace</strong>: a business that connects two sides, buyers and sellers, who cannot easily find each other. SeniorPass is a two-sided marketplace. Fah is one side. Beam is the other. Your job is to design for both of them, not for \"all students\".</p>\n<blockquote>When you design for everyone, your product fits no one. When you design specifically for Fah and Beam, real students see themselves in it and tell their friends. Specific beats generic, every time.</blockquote>\n",
    "created_at": "2026-08-11T04:45:33.142658+00:00",
    "content_title": "The Senior with the A+ Notes",
    "display_order": 0
  },
  {
    "id": "00000000-0000-0000-0013-000000000006",
    "node_id": "00000000-0000-0000-0011-000000000002",
    "content_type": "text",
    "content_url": null,
    "content_body": "\n<p>Time to map your customer. Same tracks as yesterday: Track A is your own idea, Track B is the SeniorPass default story. (And yes, you can still switch.)</p>\n<p><strong>Today's deliverable:</strong></p>\n<ul>\n<li><strong>Track A (Your Own Idea):</strong> Create a Customer Profile (Jobs, Pains, Gains) for your specific target user, and write 3 open-ended Mom Test interview questions about their past behavior.</li>\n<li><strong>Track B (SeniorPass Default Story):</strong> Complete Fah's Customer Profile (Jobs, Pains, Gains), and write 3 validation questions to test whether M.4 students would actually pay for 20-minute senior micro-sessions.</li>\n</ul>\n",
    "created_at": "2026-08-11T04:45:33.142658+00:00",
    "content_title": "Today's Mission: Map Your Customer",
    "display_order": 4
  },
  {
    "id": "00000000-0000-0000-0013-000000000009",
    "node_id": "00000000-0000-0000-0011-000000000003",
    "content_type": "text",
    "content_url": null,
    "content_body": "\n          <p>Draft your business blueprint:</p>\n          <ul>\n            <li><strong>Track A (Your Own Idea):</strong> Fill out all 9 boxes of the Lean Canvas for your startup, and do the napkin math: Price - Costs = Profit per unit, then profit x your Month 1 estimate.</li>\n            <li><strong>Track B (SeniorPass Default):</strong> Complete the 9-box Lean Canvas for SeniorPass, and calculate Month 1 revenue and profit for 50 student bookings.</li>\n          </ul>\n        ",
    "created_at": "2026-08-15T15:43:33.750961+00:00",
    "content_title": "Today's Mission: Build the Model",
    "display_order": 4
  },
  {
    "id": "e9ac5c5a-5651-422e-b1f8-d4502915d4af",
    "node_id": "00000000-0000-0000-0011-000000000003",
    "content_type": "image",
    "content_url": "https://pseed-dev.s3.us-east-005.backblazeb2.com/submissions/47fcee20-8515-42ed-bffb-efc4f56f559d/00000000-0000-0000-0011-000000000003/1786815419021_rbpyb613kjp.png",
    "content_body": null,
    "created_at": "2026-08-15T17:37:08.48999+00:00",
    "content_title": null,
    "display_order": 3
  },
  {
    "id": "5bb31caa-523e-45bb-a0a8-08f194e25595",
    "node_id": "00000000-0000-0000-0011-000000000001",
    "content_type": "image",
    "content_url": "https://pseed-dev.s3.us-east-005.backblazeb2.com/submissions/47fcee20-8515-42ed-bffb-efc4f56f559d/00000000-0000-0000-0011-000000000001/1787322358044_fjpncyg03i.png",
    "content_body": null,
    "created_at": "2026-08-21T14:16:19.455108+00:00",
    "content_title": null,
    "display_order": 5
  },
  {
    "id": "5dba6db4-0a2a-4da5-a16e-94ecc981e9db",
    "node_id": "00000000-0000-0000-0011-000000000001",
    "content_type": "text",
    "content_url": null,
    "content_body": "Fah's problem sits squarely in the sweet spot: exams come around every few weeks, and every single one hurts. That is the kind of problem a startup is born from.\n\nOnce you find a sweet-spot problem, write it down in one sentence using the Problem Statement Formula:",
    "created_at": "2026-08-21T14:27:25.187836+00:00",
    "content_title": null,
    "display_order": 4
  },
  {
    "id": "ae6aa741-d455-4969-9efc-5ee9dd9350ec",
    "node_id": "00000000-0000-0000-0011-000000000001",
    "content_type": "image",
    "content_url": "https://pseed-dev.s3.us-east-005.backblazeb2.com/submissions/47fcee20-8515-42ed-bffb-efc4f56f559d/00000000-0000-0000-0011-000000000001/1786814067943_7iizymit4m.png",
    "content_body": null,
    "created_at": "2026-08-15T17:14:40.107661+00:00",
    "content_title": null,
    "display_order": 1
  },
  {
    "id": "00000000-0000-0000-0013-000000000001",
    "node_id": "00000000-0000-0000-0011-000000000001",
    "content_type": "text",
    "content_url": null,
    "content_body": "\n<p>It is 11:30 PM on a Tuesday, exactly 48 hours before midterms. <strong>Fah</strong>, an M.4 science student, is staring at 150 dense lecture slides. Her physics teacher's explanations make zero sense, and the private tutoring centers at Siam cost 800 baht an hour and are already fully booked.</p>\n<p>Her stomach is in a knot. She is frantically texting her class LINE groups: <em>\"ใครมีสรุปบทนี้บ้างงงง\"</em></p>\n<blockquote>That helpless urgency is what startup founders call a <strong>\"Hair on Fire\" problem</strong>: a pain so urgent that people grab the first fix they can find. When your hair is on fire, you do not ask what color the bucket of water is. You just want the fire out. If your startup idea does not solve a moment like this, nobody will care.</blockquote>\n<p>Remember Fah's panic. It is not just an example. Over the next 6 days you will watch this exact 11:30 PM meltdown turn into <strong>SeniorPass</strong>, a startup built to make sure it never happens again. Every founder story starts with a moment of pain. This is ours.</p>\n",
    "created_at": "2026-08-11T04:45:33.142658+00:00",
    "content_title": "The 11:30 PM Midterm Panic",
    "display_order": 0
  },
  {
    "id": "00000000-0000-0000-0013-000000000002",
    "node_id": "00000000-0000-0000-0011-000000000001",
    "content_type": "text",
    "content_url": null,
    "content_body": "Fah's panic was intense. But intensity alone does not make a business. Founders judge every problem on two dimensions before they build anything. Together they form the **Pain vs. Frequency Matrix**: a simple 2x2 grid for deciding if a problem is worth solving.\n\n- **Low Pain, Low Frequency:** Buying a new pencil case once a year. (Ignore it: nobody pays for this.)\n- **Low Pain, High Frequency:** Untied shoelaces. (Annoying, but not painful enough to build an app for.)\n- **High Pain, Low Frequency:** The university TCAS portfolio deadline. (High stakes, but it happens once in your whole high school life.)\n- **High Pain, High Frequency (The Sweet Spot):** Exam cramming panic, rushing for school lunch, splitting class project costs. (Happens every week, and students are desperate for a fix.)",
    "created_at": "2026-08-11T04:45:33.142658+00:00",
    "content_title": "The Pain vs. Frequency Matrix",
    "display_order": 2
  },
  {
    "id": "e37b9dc4-f1d8-4678-98a1-33d132f085ee",
    "node_id": "00000000-0000-0000-0011-000000000001",
    "content_type": "image",
    "content_url": "https://pseed-dev.s3.us-east-005.backblazeb2.com/submissions/47fcee20-8515-42ed-bffb-efc4f56f559d/00000000-0000-0000-0011-000000000001/1787322588998_ybh8zrej3ff.png",
    "content_body": null,
    "created_at": "2026-08-15T17:30:33.498868+00:00",
    "content_title": "Pain vs. Frequency Matrix",
    "display_order": 3
  },
  {
    "id": "bd331863-265c-4930-8b05-3a1ff8203a9b",
    "node_id": "00000000-0000-0000-0011-000000000001",
    "content_type": "image",
    "content_url": "https://pseed-dev.s3.us-east-005.backblazeb2.com/submissions/47fcee20-8515-42ed-bffb-efc4f56f559d/00000000-0000-0000-0011-000000000001/1787322707872_433w57t8gig.png",
    "content_body": null,
    "created_at": "2026-08-21T14:31:49.893077+00:00",
    "content_title": "Track B",
    "display_order": 8
  },
  {
    "id": "6131d38e-a3fc-4a36-ad70-f585ef33b8d4",
    "node_id": "00000000-0000-0000-0011-000000000002",
    "content_type": "image",
    "content_url": "https://pseed-dev.s3.us-east-005.backblazeb2.com/submissions/47fcee20-8515-42ed-bffb-efc4f56f559d/00000000-0000-0000-0011-000000000002/1786815101453_yoox14zztj.png",
    "content_body": null,
    "created_at": "2026-08-15T17:31:52.671146+00:00",
    "content_title": null,
    "display_order": 1
  },
  {
    "id": "00000000-0000-0000-0013-000000000008",
    "node_id": "00000000-0000-0000-0011-000000000003",
    "content_type": "text",
    "content_url": null,
    "content_body": "\n          <p>Fah's panic is real. Beam's notes are real. But a real business needs a plan you can see at a glance. That is the <strong>Lean Canvas</strong>: a one-page business plan with 9 boxes, created by Ash Maurya, that forces you to explain your entire startup on a single sheet.</p>\n          <p>Fill in all 9 boxes, pulling straight from the work you already did:</p>\n          <ol>\n            <li><strong>Problem:</strong> Top 3 pain points you hunted on Day 1.</li>\n            <li><strong>Customer Segments:</strong> The persona and early adopters you mapped on Day 2. Early adopters are the first people desperate enough to try you.</li>\n            <li><strong>Unique Value Proposition:</strong> One clear sentence promising the outcome. For SeniorPass: exam help from a senior who just aced it, in 20 minutes, for 59 baht.</li>\n            <li><strong>Solution:</strong> Top 3 features that kill the pain.</li>\n            <li><strong>Channels:</strong> How customers find you: class LINE groups, TikTok, school word-of-mouth.</li>\n            <li><strong>Revenue Streams:</strong> How money comes in: per-session fee, digital download, subscription.</li>\n            <li><strong>Cost Structure:</strong> What you spend: hosting, creator payouts, marketing.</li>\n            <li><strong>Key Metrics:</strong> The numbers that tell you it is working: number of bookings, repeat rate.</li>\n            <li><strong>Unfair Advantage:</strong> What cannot easily be bought or copied. For SeniorPass: an exclusive network of top seniors.</li>\n          </ol>\n        ",
    "created_at": "2026-08-15T15:43:33.750961+00:00",
    "content_title": "The 9-Box Lean Canvas",
    "display_order": 2
  },
  {
    "id": "00000000-0000-0000-0013-000000000003",
    "node_id": "00000000-0000-0000-0011-000000000001",
    "content_type": "text",
    "content_url": null,
    "content_body": "Time to hunt your own pain. First, choose your track for this 6-day sprint. There are two, and both go through the exact same missions:\n\n- **Track A: Your Own Idea.** You bring a real problem from your own life and build a startup around it across all 6 days.\n- **Track B: The SeniorPass Default Story.** No idea yet? No problem. You follow Fah's story and help build SeniorPass, the platform that connects panicking students with top seniors for 20-minute micro-tutoring sessions and verified summary notes. We will unpack the whole business day by day.\n\nYou can switch tracks any day. Nothing is locked in. Just keep doing the missions.",
    "created_at": "2026-08-11T04:45:33.142658+00:00",
    "content_title": "Today's Mission: Hunt the Pain",
    "display_order": 6
  },
  {
    "id": "00000000-0000-0000-0013-000000000007",
    "node_id": "00000000-0000-0000-0011-000000000003",
    "content_type": "text",
    "content_url": null,
    "content_body": "```\n      <p>Remember Fah, the M.4 student panicking at 11:30 PM before her physics midterm? And P'Beam, the M.6 senior with the 94% score and the summary notes sitting idle? \n<br/>\nBefore anyone writes a single line of code, sit down at a cafeteria table with a pen and a napkin. How does money actually flow through SeniorPass?</p>\n      <ul>\n        <li>Fah pays <strong>59 baht</strong> for a 20-minute micro-tutoring session or a verified 4-page summary PDF.</li>\n        <li>P'Beam receives <strong>45 baht</strong> straight to his PromptPay for sharing what he already knows.</li>\n        <li>SeniorPass keeps <strong>14 baht</strong> per booking. That is a 24% platform margin: the slice the platform earns for making the match, with zero inventory cost.</li>\n      </ul>\n      <blockquote>If 50 students book sessions in Month 1, the platform generates 2,950 baht revenue and 700 baht net profit. That is simple, clean unit economics: the money you earn on each single sale, before anything else.</blockquote>\n```",
    "created_at": "2026-08-15T15:43:33.750961+00:00",
    "content_title": "The Cafeteria Napkin Math",
    "display_order": 0
  }
]
```

## node_assessments  (3 rows)

```json
[
  {
    "id": "00000000-0000-0000-0014-000000000001",
    "node_id": "00000000-0000-0000-0011-000000000001",
    "assessment_type": "text_answer",
    "metadata": {
      "prompt": "Hand in your Day 1 deliverables:\n• 5 problems rated on Pain (1 to 5) and Frequency (1 to 5), or your SeniorPass problem analysis\n• Your chosen #1 problem written as a 1-sentence Problem Statement",
      "question": "Today's deliverable:\n\nTrack A (Your Own Idea): List 5 real problems you or your friends experienced at school this week. Rate each on Pain (1 to 5) and Frequency (1 to 5). Pick your #1 problem and write its Problem Statement using the formula above.\n\nTrack B (SeniorPass Default Story): Analyze why M.4 to M.5 exam prep is a high-pain, high-frequency problem. Then write the official Problem Statement for SeniorPass.",
      "max_attempts": 3,
      "allow_multiple_attempts": true
    },
    "points_possible": 2,
    "is_graded": false,
    "is_group_assessment": false,
    "group_formation_method": "manual",
    "target_group_size": 3,
    "allow_uneven_groups": true,
    "groups_config": {},
    "group_submission_mode": "all_members"
  },
  {
    "id": "00000000-0000-0000-0014-000000000002",
    "node_id": "00000000-0000-0000-0011-000000000002",
    "assessment_type": "text_answer",
    "metadata": {
      "prompt": "Hand in your Day 2 deliverables:\n• Customer Profile card: Customer Jobs, Pains, and Gains\n• 3 open-ended Mom Test validation questions (focused on past behavior)",
      "max_attempts": 3,
      "allow_multiple_attempts": true
    },
    "points_possible": 2,
    "is_graded": false,
    "is_group_assessment": false,
    "group_formation_method": "manual",
    "target_group_size": 3,
    "allow_uneven_groups": true,
    "groups_config": {},
    "group_submission_mode": "all_members"
  },
  {
    "id": "00000000-0000-0000-0014-000000000003",
    "node_id": "00000000-0000-0000-0011-000000000003",
    "assessment_type": "text_answer",
    "metadata": {
      "prompt": "Hand in your Day 3 deliverables:\n• Completed 9-Box Lean Canvas\n• Unit economics napkin math: Price per unit, direct costs, margin, and Month 1 projection",
      "max_attempts": 3,
      "allow_multiple_attempts": true
    },
    "points_possible": 2,
    "is_graded": false,
    "is_group_assessment": false,
    "group_formation_method": "manual",
    "target_group_size": 3,
    "allow_uneven_groups": true,
    "groups_config": {},
    "group_submission_mode": "all_members"
  }
]
```

## quiz_questions  (0 rows)

```json
[]
```

## assessment_submissions  (1 row)

```json
[
  {
    "id": "6b0f92a9-a880-4ae9-870d-2165b88cdde3",
    "progress_id": "67d7a663-4588-4218-8337-6307b0143bb5",
    "assessment_id": "00000000-0000-0000-0014-000000000001",
    "text_answer": "B\nBecause exam preparation Very important and very difficult they only have two chances to take the exam and They have to compete against the whole country To score more points And the exams are directly related to university admission or various opportunities, such as receiving scholarships.",
    "image_url": null,
    "quiz_answers": null,
    "submitted_at": "2026-08-16T13:02:26.687516+00:00",
    "file_urls": [],
    "metadata": null,
    "assessment_group_id": null,
    "submitted_for_group": false
  }
]
```

## student_node_progress  (4 rows)

```json
[
  {
    "id": "ed86bb6f-98e8-4e28-bdee-4dffd882a7d2",
    "user_id": "1828febc-a65f-40f8-9229-873107888590",
    "node_id": "00000000-0000-0000-0011-000000000001",
    "status": "in_progress",
    "arrived_at": "2026-08-16T12:43:26.807+00:00",
    "started_at": "2026-08-16T12:43:26.807+00:00",
    "submitted_at": null
  },
  {
    "id": "67d7a663-4588-4218-8337-6307b0143bb5",
    "user_id": "533bb087-5aa1-47fc-95a5-1aee8602deb0",
    "node_id": "00000000-0000-0000-0011-000000000001",
    "status": "failed",
    "arrived_at": "2026-08-16T13:05:24.591+00:00",
    "started_at": "2026-08-16T13:05:24.632+00:00",
    "submitted_at": "2026-08-16T13:02:28.936+00:00"
  },
  {
    "id": "f62f5da2-78eb-4c58-884b-ce17a3cf915f",
    "user_id": "7269f57c-b768-460e-a7c2-bea989cce4cc",
    "node_id": "00000000-0000-0000-0011-000000000001",
    "status": "in_progress",
    "arrived_at": "2026-08-24T12:34:45.322+00:00",
    "started_at": "2026-08-24T12:34:45.324+00:00",
    "submitted_at": null
  },
  {
    "id": "db9b14df-8d23-4315-9ec3-2fe6ff011538",
    "user_id": "7269f57c-b768-460e-a7c2-bea989cce4cc",
    "node_id": "00000000-0000-0000-0011-000000000003",
    "status": "in_progress",
    "arrived_at": "2026-08-24T12:41:16.303+00:00",
    "started_at": "2026-08-24T12:41:16.303+00:00",
    "submitted_at": null
  }
]
```

## node_paths (edges touching these nodes)  (0 rows)

```json
[]
```
