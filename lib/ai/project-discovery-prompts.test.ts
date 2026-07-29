import {
  buildProjectDiscoveryGreeting,
  buildProjectDiscoverySystemPrompt,
  MENTAL_HEALTH_HOTLINE_TH,
  SAMARITANS_TH,
  type GradeLevel,
} from "@/lib/ai/project-discovery-prompts";

const ALL_GRADES: GradeLevel[] = ["M4", "M5", "M6"];

describe("buildProjectDiscoverySystemPrompt", () => {
  // The program exists to oppose bought and fabricated portfolio projects. An
  // assistant that supplies the idea reproduces that failure, so this rule is
  // asserted for every grade rather than spot-checked.
  it.each(ALL_GRADES)(
    "forbids proposing a project idea for %s",
    (gradeLevel) => {
      const prompt = buildProjectDiscoverySystemPrompt({ gradeLevel });

      expect(prompt).toContain("NEVER propose a project idea");
      expect(prompt).toContain("NEVER write their content for them");
      expect(prompt).toContain("NEVER do their user research");
    }
  );

  it.each(ALL_GRADES)(
    "carries the safeguarding escalation path for %s",
    (gradeLevel) => {
      const prompt = buildProjectDiscoverySystemPrompt({ gradeLevel });

      expect(prompt).toContain("STOP COACHING IMMEDIATELY");
      expect(prompt).toContain(MENTAL_HEALTH_HOTLINE_TH);
      expect(prompt).toContain(SAMARITANS_TH);
      // Emergency services number must survive any future prompt edit.
      expect(prompt).toContain("1669");
    }
  );

  it.each(ALL_GRADES)("blocks collection of identifiers for %s", (gradeLevel) => {
    const prompt = buildProjectDiscoverySystemPrompt({ gradeLevel });

    expect(prompt).toContain("full legal name");
    expect(prompt).toContain("Never suggest meeting anyone the student does not already know");
  });

  it("frames M6 around the live TCAS deadline without rewarding scope", () => {
    const prompt = buildProjectDiscoverySystemPrompt({ gradeLevel: "M6" });

    expect(prompt).toContain("TCAS Round 1 portfolio deadline is live");
    expect(prompt).toContain("Never imply that a bigger project scores better");
  });

  it("frames M4 around genuine interest rather than time pressure", () => {
    const prompt = buildProjectDiscoverySystemPrompt({ gradeLevel: "M4" });

    expect(prompt).toContain("roughly two years");
    expect(prompt).toContain("if nobody were watching");
    expect(prompt).not.toContain("deadline is live");
  });

  it("asks for the nickname when none is supplied", () => {
    const prompt = buildProjectDiscoverySystemPrompt({ gradeLevel: "M5" });

    expect(prompt).toContain("You do not know the student's nickname");
  });

  it("uses the nickname when supplied", () => {
    const prompt = buildProjectDiscoverySystemPrompt({
      gradeLevel: "M5",
      nickname: "ฟ้า",
    });

    expect(prompt).toContain('nickname is "ฟ้า"');
    expect(prompt).not.toContain("You do not know the student's nickname");
  });

  it("resumes mid-arc instead of restarting when prior notes exist", () => {
    const prompt = buildProjectDiscoverySystemPrompt({
      gradeLevel: "M6",
      priorNotes: "Named ป้าที่ขายข้าว as the user. Stuck on why-now.",
    });

    expect(prompt).toContain("CONTINUING A PREVIOUS SESSION");
    expect(prompt).toContain("ป้าที่ขายข้าว");
    expect(prompt).toContain("Do not restart the arc from Phase 1");
  });

  it("omits the continuation block on a first session", () => {
    const prompt = buildProjectDiscoverySystemPrompt({ gradeLevel: "M6" });

    expect(prompt).not.toContain("CONTINUING A PREVIOUS SESSION");
  });

  it("requires both why-you and why-now", () => {
    const prompt = buildProjectDiscoverySystemPrompt({ gradeLevel: "M6" });

    expect(prompt).toContain("WHY YOU");
    expect(prompt).toContain("WHY NOW");
    // "I need a portfolio" explains why they need a project, not why this one.
    expect(prompt).toContain("It does not explain why THIS project");
  });

  it("refuses to invent the idea while still ending with something actionable", () => {
    const prompt = buildProjectDiscoverySystemPrompt({ gradeLevel: "M4" });

    // These two rules pull against each other and the prompt must hold both:
    // never manufacture a project, never leave the student empty-handed.
    expect(prompt).toContain("that is a valid outcome");
    expect(prompt).toContain("This is not permission to\n   end empty-handed");
    expect(prompt).toContain(
      "There is no ending where the student\nleaves with nothing"
    );
  });

  it.each(ALL_GRADES)("commits to a project before interrogating it for %s", (gradeLevel) => {
    const prompt = buildProjectDiscoverySystemPrompt({ gradeLevel });

    expect(prompt).toContain("pick a project early, then pressure-test it, then act");
    expect(prompt).toContain("Do not leave Act 1 without a pick");
    // Picking must be framed as reversible or students freeze on the choice.
    expect(prompt).toContain("ไม่ใช่แต่งงาน");
  });

  it.each(ALL_GRADES)("carries anti-drag momentum rules for %s", (gradeLevel) => {
    const prompt = buildProjectDiscoverySystemPrompt({ gradeLevel });

    expect(prompt).toContain("MOMENTUM — do not let this drag");
    expect(prompt).toContain("Never ask the same question twice in different words");
    expect(prompt).toContain("Two \"ยังไม่รู้\" in a row means stop asking that thread");
    expect(prompt).toContain("Never end a message with the student having nothing to do");
    // Stopping on request is not negotiable.
    expect(prompt).toContain("stop immediately");
  });

  it.each(ALL_GRADES)("names the red flags to reject early for %s", (gradeLevel) => {
    const prompt = buildProjectDiscoverySystemPrompt({ gradeLevel });

    expect(prompt).toContain("RED FLAGS");
    // The ones students actually reach for.
    expect(prompt).toContain("save-the-world project");
    expect(prompt).toContain("survey project");
    expect(prompt).toContain("awareness campaign");
    expect(prompt).toContain("the app that needs an app");
    expect(prompt).toContain("unreachable user");
    expect(prompt).toContain("bought, outsourced, or copied");
    expect(prompt).toContain("the parent's project");
    expect(prompt).toContain("trophy project");
    // Green flags exist so the feedback is not purely negative.
    expect(prompt).toContain("GREEN FLAGS");
  });

  it("ends on one dated action, not a plan", () => {
    const prompt = buildProjectDiscoverySystemPrompt({ gradeLevel: "M6" });

    expect(prompt).toContain("The action line is the most important line");
    expect(prompt).toContain("One action, one named person, one day");
    // Unused candidates are retained so a wrong pick is cheap to abandon.
    expect(prompt).toContain("Always keep the unused candidates");
  });
});

describe("buildProjectDiscoveryGreeting", () => {
  it("sets the no-free-ideas expectation before the student can ask", () => {
    const greeting = buildProjectDiscoveryGreeting({});

    expect(greeting).toContain("เราจะไม่คิดโปรเจกต์ให้");
  });

  it("tells the student up front how long it takes and what they walk away with", () => {
    const greeting = buildProjectDiscoveryGreeting({});

    expect(greeting).toContain("20 นาที");
    expect(greeting).toContain("สิ่งที่ต้องทำภายในสัปดาห์นี้");
    expect(greeting).toContain("ไม่ใช่แต่งงาน");
  });

  it("greets by nickname when known", () => {
    expect(buildProjectDiscoveryGreeting({ nickname: "ฟ้า" })).toContain("สวัสดี ฟ้า");
  });

  it("asks what to call the student when the nickname is unknown", () => {
    expect(buildProjectDiscoveryGreeting({})).toContain("เรียกเธอว่าอะไรดี");
  });
});
