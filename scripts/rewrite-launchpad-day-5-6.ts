import { createAdminClient } from "../utils/supabase/admin";

const UPDATES: {
  table: "map_nodes" | "node_content";
  id: string;
  field: "instructions" | "content_body";
  value: string;
}[] = [
  // ---------------- DAY 5: Get Your First Users ----------------
  {
    table: "map_nodes",
    id: "00000000-0000-0000-0011-000000000005",
    field: "instructions",
    value:
      "Yesterday you shipped your MVP and watched real students book it. Today you learn how to turn those first few users into 50, with 0 baht of ad money, a LINE account, and the courage to do things that don't scale.",
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000013",
    field: "content_body",
    value: `<p>Last night, SeniorPass went live as a Google Form and a LINE group, and 8 students booked before midnight. Amazing. But those 8 were Fah's friends and P'Beam's juniors. How do you reach the 42 strangers who get you to 50 users, with 0 baht to spend?</p>
<p>Startup legend Paul Graham has the answer: <strong>"Do Things That Don't Scale"</strong>, which means win your first users by hand, one at a time, instead of waiting for ads or algorithms to find them. Here is what that looks like for a Thai student founder:</p>
<ul>
<li>Drop genuine value in class LINE groups (e.g. <em>"สรุป 5 สูตรฟิสิกส์ ม.4 ที่ออกสอบชัวร์ แจกฟรีในโพสต์นี้"</em>). Help first, mention SeniorPass second.</li>
<li>Share short, high-yield study hacks on TikTok and X (Twitter), with P'Beam's notes as the proof.</li>
<li>Offer a referral incentive: <em>"ชวนเพื่อนมาติวด้วยกัน รับฟรีสรุปเคมี 1 บท"</em>. Every happy user becomes your marketing team.</li>
</ul>
<p>Posting a link on your personal Instagram story with no context gets you 3 likes from family members. Attention is earned, not given.</p>`,
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000014",
    field: "content_body",
    value: `<p>SeniorPass has 8 users. But are they becoming regulars, or was it one panic-driven night? To find out, founders track every user through the <strong>AARRR Funnel</strong>: the 5 stages every user moves through, from first hearing about you to telling their friends. It is nicknamed the Pirate Funnel because A-A-R-R-R sounds like a pirate.</p>
<ul>
<li><strong>Acquisition:</strong> How do students discover you? (Class LINE groups, TikTok formula reels.)</li>
<li><strong>Activation:</strong> Do they have a great first experience? (A smooth 20-minute session or an instant PDF download.)</li>
<li><strong>Retention:</strong> Do they come back for the next exam? (Repeat bookings next month.)</li>
<li><strong>Revenue:</strong> Do they pay without friction? (PromptPay QR code.)</li>
<li><strong>Referral:</strong> Do they tell their classmates? (Word-of-mouth recommendations.)</li>
</ul>
<p>Wherever users drop off is the leak you fix first. Now turn that into a plan. <strong>The 3-Phase 50-User Growth Plan:</strong></p>
<ul>
<li><strong>Phase 1 (0 to 10 Users):</strong> Direct personal outreach to 10 classmates (0 baht).</li>
<li><strong>Phase 2 (10 to 30 Users):</strong> Free high-value content teasers in school communities (0 baht).</li>
<li><strong>Phase 3 (30 to 50 Users):</strong> Peer referral rewards and club partnerships (max 500 baht budget).</li>
</ul>`,
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000015",
    field: "content_body",
    value: `<p>Time to build your growth engine:</p>
<ul>
<li><strong>Track A (Your Own Idea):</strong> Plan your 3-phase growth roadmap to reach 50 users, and write 1 authentic social media hook post.</li>
<li><strong>Track B (SeniorPass Default):</strong> Design the 3-phase growth plan for SeniorPass, and draft 1 viral TikTok/Instagram formula teaser post.</li>
</ul>
<p><strong>🎮 Decision Scenario:</strong> It is Week 2 of SeniorPass. You have 38 users, but growth is slowing down. Your friend says: <em>"Just spend 1,500 baht on Instagram ads."</em> You have 2,000 baht left in your budget. What do you do?</p>
<ul>
<li><strong>A)</strong> Spend 1,500 baht on Instagram ads.</li>
<li><strong>B)</strong> Spend 0 baht: DM 15 current users to ask what helped them most, improve the offering, and ask each for 1 classmate intro.</li>
<li><strong>C)</strong> Spend 500 baht sponsoring a popular school study-gram account to review your summary notes.</li>
<li><strong>D)</strong> Your own strategy.</li>
</ul>`,
  },
  // ---------------- DAY 6: Pitch Day ----------------
  {
    table: "map_nodes",
    id: "00000000-0000-0000-0011-000000000006",
    field: "instructions",
    value:
      "Six days ago you met Fah, panicking at 11:30 PM before her physics midterm. Today you tell her story to the room. You have 60 seconds to make the judges feel the panic and believe in the fix. Every startup lives or dies by its pitch.",
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000016",
    field: "content_body",
    value: `<p>Remember Fah from Day 1? It is 11:30 PM, her physics midterm is tomorrow, tutoring costs 800 baht an hour, and every tutor is booked out. That moment of panic is why SeniorPass exists. Today, it is also the opening line of your pitch.</p>
<p>Judges and investors do not invest in lengthy 50-page business plans. They invest in founders who understand their users deeply and execute with speed. You have 60 seconds to tell one compelling story: the burning pain, the simple solution, the real users you served this week, and where this business goes next.</p>
<blockquote>Storytelling beats statistics. Make the listener feel the 11:30 PM midterm panic before you show them the solution.</blockquote>`,
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000017",
    field: "content_body",
    value: `<p>Fah and P'Beam have real bookings and a working service. Now they need to compress the whole week into 7 slides. <strong>YC (Y Combinator)</strong> is the world's most famous startup accelerator, the program behind Airbnb and Stripe, and its pitch blueprint is the gold standard. Structure your deck the same way:</p>
<ol>
<li><strong>1. Title:</strong> Startup name, memorable tagline, founder names.</li>
<li><strong>2. Problem:</strong> The burning pain point (use your Day 1 insight).</li>
<li><strong>3. Solution:</strong> What you built (showcase your Day 4 MVP).</li>
<li><strong>4. How It Works:</strong> 3 clear, simple steps.</li>
<li><strong>5. Traction & Learnings:</strong> Traction means proof that real people use your product: users, bookings, or feedback from Day 5.</li>
<li><strong>6. Business Model:</strong> How you make money per session (your Day 3 unit economics).</li>
<li><strong>7. The Ask:</strong> What you need next (users, feedback, mentors).</li>
</ol>
<p><strong>The 60-Second Elevator Pitch Timer:</strong> an elevator pitch is your entire startup explained in the time of one elevator ride. Budget your 60 seconds like this:</p>
<ul>
<li>00 to 10s: Hook (Fah's 11:30 PM midterm panic).</li>
<li>10 to 20s: Problem (800 baht an hour, every tutor booked out).</li>
<li>20 to 35s: Solution & Demo (How it works in 3 steps).</li>
<li>35 to 45s: Traction (What happened when you tested it).</li>
<li>45 to 55s: Business Model & Vision.</li>
<li>55 to 60s: The Ask.</li>
</ul>`,
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000018",
    field: "content_body",
    value: `<p>Deliver your final sprint artifacts:</p>
<ul>
<li><strong>Track A (Your Own Idea):</strong> Outline your 7-slide pitch deck, write your 60-second pitch script, and complete the Founder Self-Reflection.</li>
<li><strong>Track B (SeniorPass Default):</strong> Outline the 7 slides for SeniorPass, write the 60-second pitch script, and complete the Founder Self-Reflection.</li>
</ul>
<p>Then look back at the founder you were on Day 1. <strong>📊 Founder Self-Reflection Questions:</strong></p>
<ol>
<li>What was the most surprising lesson from this 6-day sprint?</li>
<li>Which part felt hardest: problem finding, business modeling, MVP, or growth?</li>
<li>Which business role excited you most (Product Manager, Designer, Marketer, or CEO)?</li>
<li>On a scale of 1 to 10, how interested are you in entrepreneurship now?</li>
</ol>
<p><em>From 11:30 PM panic to a 60-second pitch in six days. That is what founders do.</em></p>`,
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
