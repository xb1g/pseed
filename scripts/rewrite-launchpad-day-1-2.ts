import { createAdminClient } from "../utils/supabase/admin";

const DAY1_NODE = "00000000-0000-0000-0011-000000000001";
const DAY2_NODE = "00000000-0000-0000-0011-000000000002";

const UPDATES: {
  table: "map_nodes" | "node_content";
  id: string;
  field: "instructions" | "content_body";
  value: string;
}[] = [
  // ============================
  // DAY 1: Spot the Problem
  // ============================
  {
    table: "map_nodes",
    id: DAY1_NODE,
    field: "instructions",
    value:
      "The best businesses do not sell products: they kill pain points. Today you become a Problem Hunter, and the hunt starts with one M.4 student panicking at 11:30 PM. That panic is the reason SeniorPass will exist.",
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000001",
    field: "content_body",
    value: `
<p>It is 11:30 PM on a Tuesday, exactly 48 hours before midterms. <strong>Fah</strong>, an M.4 science student, is staring at 150 dense lecture slides. Her physics teacher's explanations make zero sense, and the private tutoring centers at Siam cost 800 baht an hour and are already fully booked.</p>
<p>Her stomach is in a knot. She is frantically texting her class LINE groups: <em>"ใครมีสรุปบทนี้บ้างงงง"</em></p>
<blockquote>That helpless urgency is what startup founders call a <strong>"Hair on Fire" problem</strong>: a pain so urgent that people grab the first fix they can find. When your hair is on fire, you do not ask what color the bucket of water is. You just want the fire out. If your startup idea does not solve a moment like this, nobody will care.</blockquote>
<p>Remember Fah's panic. It is not just an example. Over the next 6 days you will watch this exact 11:30 PM meltdown turn into <strong>SeniorPass</strong>, a startup built to make sure it never happens again. Every founder story starts with a moment of pain. This is ours.</p>
`,
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000002",
    field: "content_body",
    value: `
<p>Fah's panic was intense. But intensity alone does not make a business. Founders judge every problem on two dimensions before they build anything. Together they form the <strong>Pain vs. Frequency Matrix</strong>: a simple 2x2 grid for deciding if a problem is worth solving.</p>
<ul>
<li><strong>Low Pain, Low Frequency:</strong> Buying a new pencil case once a year. (Ignore it: nobody pays for this.)</li>
<li><strong>Low Pain, High Frequency:</strong> Untied shoelaces. (Annoying, but not painful enough to build an app for.)</li>
<li><strong>High Pain, Low Frequency:</strong> The university TCAS portfolio deadline. (High stakes, but it happens once in your whole high school life.)</li>
<li><strong>High Pain, High Frequency (The Sweet Spot):</strong> Exam cramming panic, rushing for school lunch, splitting class project costs. (Happens every week, and students are desperate for a fix.)</li>
</ul>
<p>Fah's problem sits squarely in the sweet spot: exams come around every few weeks, and every single one hurts. That is the kind of problem a startup is born from.</p>
<p>Once you find a sweet-spot problem, write it down in one sentence using the <strong>Problem Statement Formula</strong>:</p>
<pre><code>[Target Group] struggles with [Specific Friction] because [Root Cause], which causes [Painful Consequence].</code></pre>
`,
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000003",
    field: "content_body",
    value: `
<p>Time to hunt your own pain. First, choose your track for this 6-day sprint. There are two, and both go through the exact same missions:</p>
<ul>
<li><strong>Track A: Your Own Idea.</strong> You bring a real problem from your own life and build a startup around it across all 6 days.</li>
<li><strong>Track B: The SeniorPass Default Story.</strong> No idea yet? No problem. You follow Fah's story and help build SeniorPass, the platform that connects panicking students with top seniors for 20-minute micro-tutoring sessions and verified summary notes. We will unpack the whole business day by day.</li>
</ul>
<p>You can switch tracks any day. Nothing is locked in. Just keep doing the missions.</p>
<p><strong>Today's deliverable:</strong></p>
<ul>
<li><strong>Track A (Your Own Idea):</strong> List 5 real problems you or your friends experienced at school this week. Rate each on Pain (1 to 5) and Frequency (1 to 5). Pick your #1 problem and write its Problem Statement using the formula above.</li>
<li><strong>Track B (SeniorPass Default Story):</strong> Analyze why M.4 to M.5 exam prep is a high-pain, high-frequency problem. Then write the official Problem Statement for <strong>SeniorPass</strong>.</li>
</ul>
`,
  },
  // ============================
  // DAY 2: Who is Your Customer?
  // ============================
  {
    table: "map_nodes",
    id: DAY2_NODE,
    field: "instructions",
    value:
      "Yesterday you hunted pain points and picked a problem worth solving. Today you answer the harder question: who exactly feels that pain? If your answer is 'everyone', you have no customer. Today you find your ONE person.",
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000004",
    field: "content_body",
    value: `
<p>Remember Fah, frozen over her physics slides at 11:30 PM? Yesterday you named her pain. Today you meet the other half of the story.</p>
<p><strong>Fah</strong> is an M.4 science student. She wants to score 85+ on physics so her GPA stays above 3.5, but she keeps getting stuck on the hard problem sets. She does not want a 50-hour video course. She wants 20 minutes with someone who actually survived this exact exam.</p>
<p><strong>P'Beam</strong> is an M.6 senior. He scored 94% on that exact physics exam last year, and his handwritten 4-page summary sheets are sitting idle in his GoodNotes, helping nobody.</p>
<p>One person has a desperate need. The other has the exact fix, gathering dust. This is a <strong>marketplace</strong>: a business that connects two sides, buyers and sellers, who cannot easily find each other. SeniorPass is a two-sided marketplace. Fah is one side. Beam is the other. Your job is to design for both of them, not for "all students".</p>
<blockquote>When you design for everyone, your product fits no one. When you design specifically for Fah and Beam, real students see themselves in it and tell their friends. Specific beats generic, every time.</blockquote>
`,
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000005",
    field: "content_body",
    value: `
<p>To understand a customer deeply, founders use the <strong>Value Proposition Canvas</strong>: a one-page map that lines up what your customer is trying to do with what your product offers. It starts with the <strong>Customer Profile</strong>, which has three parts:</p>
<ul>
<li><strong>Customer Jobs:</strong> What are they trying to get done? (e.g. Pass Thursday's physics midterm with a B+ without pulling an all-nighter.)</li>
<li><strong>Pains:</strong> What frustrates or blocks them? (e.g. Tutoring at Siam is 800 THB/hr, the teacher's slides are 150 pages of dense theory, online videos take 3 hours.)</li>
<li><strong>Gains:</strong> What would delight them? (e.g. A concise 4-page formula cheat-sheet, instant answers to 3 tricky homework questions.)</li>
</ul>
<p>A profile is a hypothesis. To check if it is real, you interview people. But interviews have a trap, and <strong>The Mom Test</strong> is the fix: a technique from Rob Fitzpatrick's book, named because even your mom will lie to protect your feelings. Never ask <em>"Would you use my app?"</em> Everyone says yes to be polite. Instead, ask about <strong>past behavior</strong>, because what people actually did beats what they say they would do:</p>
<ol>
<li><em>"How did you prepare for your last physics quiz?"</em></li>
<li><em>"What was the most frustrating part of that process?"</em></li>
<li><em>"How much time or money did you spend trying to fix it?"</em></li>
</ol>
`,
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000006",
    field: "content_body",
    value: `
<p>Time to map your customer. Same tracks as yesterday: Track A is your own idea, Track B is the SeniorPass default story. (And yes, you can still switch.)</p>
<p><strong>Today's deliverable:</strong></p>
<ul>
<li><strong>Track A (Your Own Idea):</strong> Create a Customer Profile (Jobs, Pains, Gains) for your specific target user, and write 3 open-ended Mom Test interview questions about their past behavior.</li>
<li><strong>Track B (SeniorPass Default Story):</strong> Complete Fah's Customer Profile (Jobs, Pains, Gains), and write 3 validation questions to test whether M.4 students would actually pay for 20-minute senior micro-sessions.</li>
</ul>
`,
  },
];

async function main() {
  const supabase = createAdminClient();
  for (const u of UPDATES) {
    const { error } = await supabase
      .from(u.table)
      .update({ [u.field]: u.value })
      .eq("id", u.id);
    if (error) throw error;
    console.log("updated", u.table, u.id);
  }
}

main();
