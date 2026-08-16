import { createAdminClient } from "../utils/supabase/admin";

const UPDATES: {
  table: "map_nodes" | "node_content";
  id: string;
  field: "instructions" | "content_body";
  value: string;
}[] = [
  // ---------- Day 3: The Business Model ----------
  {
    table: "map_nodes",
    id: "00000000-0000-0000-0011-000000000003",
    field: "instructions",
    value:
      "Yesterday you mapped your customer: Fah's panic, Beam's idle notes, their jobs, pains, and gains. Today you answer the question every founder eventually faces: how does this thing actually make money?",
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000007",
    field: "content_body",
    value: `
          <p>Remember Fah, the M.4 student panicking at 11:30 PM before her physics midterm? And P'Beam, the M.6 senior with the 94% score and the summary notes sitting idle? Before anyone writes a single line of code, sit down at a cafeteria table with a pen and a napkin. How does money actually flow through SeniorPass?</p>
          <ul>
            <li>Fah pays <strong>59 baht</strong> for a 20-minute micro-tutoring session or a verified 4-page summary PDF.</li>
            <li>P'Beam receives <strong>45 baht</strong> straight to his PromptPay for sharing what he already knows.</li>
            <li>SeniorPass keeps <strong>14 baht</strong> per booking. That is a 24% platform margin: the slice the platform earns for making the match, with zero inventory cost.</li>
          </ul>
          <blockquote>If 50 students book sessions in Month 1, the platform generates 2,950 baht revenue and 700 baht net profit. That is simple, clean unit economics: the money you earn on each single sale, before anything else.</blockquote>
        `,
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000008",
    field: "content_body",
    value: `
          <p>Fah's panic is real. Beam's notes are real. But a real business needs a plan you can see at a glance. That is the <strong>Lean Canvas</strong>: a one-page business plan with 9 boxes, created by Ash Maurya, that forces you to explain your entire startup on a single sheet.</p>
          <p>Fill in all 9 boxes, pulling straight from the work you already did:</p>
          <ol>
            <li><strong>Problem:</strong> Top 3 pain points you hunted on Day 1.</li>
            <li><strong>Customer Segments:</strong> The persona and early adopters you mapped on Day 2. Early adopters are the first people desperate enough to try you.</li>
            <li><strong>Unique Value Proposition:</strong> One clear sentence promising the outcome. For SeniorPass: exam help from a senior who just aced it, in 20 minutes, for 59 baht.</li>
            <li><strong>Solution:</strong> Top 3 features that kill the pain.</li>
            <li><strong>Channels:</strong> How customers find you: class LINE groups, TikTok, school word-of-mouth.</li>
            <li><strong>Revenue Streams:</strong> How money comes in: per-session fee, digital download, subscription.</li>
            <li><strong>Cost Structure:</strong> What you spend: hosting, creator payouts, marketing.</li>
            <li><strong>Key Metrics:</strong> The numbers that tell you it is working: number of bookings, repeat rate.</li>
            <li><strong>Unfair Advantage:</strong> What cannot easily be bought or copied. For SeniorPass: an exclusive network of top seniors.</li>
          </ol>
        `,
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000009",
    field: "content_body",
    value: `
          <p>Draft your business blueprint:</p>
          <ul>
            <li><strong>Track A (Your Own Idea):</strong> Fill out all 9 boxes of the Lean Canvas for your startup, and do the napkin math: Price - Costs = Profit per unit, then profit x your Month 1 estimate.</li>
            <li><strong>Track B (SeniorPass Default):</strong> Complete the 9-box Lean Canvas for SeniorPass, and calculate Month 1 revenue and profit for 50 student bookings.</li>
          </ul>
        `,
  },
  // ---------- Day 4: Build Something Real ----------
  {
    table: "map_nodes",
    id: "00000000-0000-0000-0011-000000000004",
    field: "instructions",
    value:
      "Yesterday you built the business model: the napkin math, the 9-box Lean Canvas, the proof that 59 baht per booking adds up. Today you stop planning and start building. You will ship an MVP: the smallest thing you can build that proves someone will actually pay.",
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000010",
    field: "content_body",
    value: `
          <p>Fah and P'Beam did not hire developers. They did not spend 3 months learning to code. On one school night, they launched SeniorPass in 2 hours using three free tools: a Google Form for bookings, a shared Google Meet link for the sessions, and a PromptPay QR code for payments.</p>
          <p>At 8:00 PM, they dropped the form link into their class LINE group. By midnight, 8 classmates had booked physics sessions at 59 baht each. Beam delivered all 8 sessions by hand on his iPad.</p>
          <blockquote>That is a <strong>Concierge MVP</strong>: you deliver the service manually, by hand, behind the scenes, to prove customers actually pull out their wallets before you spend time building software.</blockquote>
        `,
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000011",
    field: "content_body",
    value: `
          <p>Fah and Beam proved demand with a Google Form. But a concierge service is only one way to test an idea. There are 5 classic MVP archetypes, the five standard shapes an MVP can take. Pick the simplest one that tests your core value proposition: the one-sentence promise you wrote in your Lean Canvas.</p>
          <ul>
            <li><strong>1. Concierge MVP:</strong> You provide the service manually by hand, like matching tutors and students yourself over LINE.</li>
            <li><strong>2. Wizard of Oz:</strong> The front looks automated, but humans secretly operate the back end behind the curtain. Named after the movie: a small man pretending to be a great wizard.</li>
            <li><strong>3. Smoke Screen (Landing Page):</strong> A 1-page website with a headline, your promise, and a "Book Now" or "Join Waitlist" button. You measure how many people click before anything exists.</li>
            <li><strong>4. Video Prototype:</strong> A 60-second video showing how the solution works. This is how Dropbox launched.</li>
            <li><strong>5. Paper / Clickable Wireframe:</strong> 4 to 6 screens drawn on paper or Figma that walk users through the flow.</li>
          </ul>
        `,
  },
  {
    table: "node_content",
    id: "00000000-0000-0000-0013-000000000012",
    field: "content_body",
    value: `
          <p>Create your prototype specification:</p>
          <ul>
            <li><strong>Track A (Your Own Idea):</strong> Pick 1 of the 5 MVP types, write the exact layout or form copy, and answer the 3 Mom Test sanity checks (honest questions about real behavior, not polite opinions): What is the first question users ask? What confuses them? What excites them?</li>
            <li><strong>Track B (SeniorPass Default):</strong> Design the 1-page Concierge MVP spec for SeniorPass (headline, 3 core subject offerings, booking fields, manual fulfillment process) and answer the same 3 Mom Test checks.</li>
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
