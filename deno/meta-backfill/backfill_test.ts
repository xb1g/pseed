import { classifyConversation } from "./classification.ts";
import { contesterUrl, devpostDates } from "./competition-sync.ts";
import { listConversations, MetaRequestError } from "./meta-client.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${
        JSON.stringify(actual)
      }`,
    );
  }
}

Deno.test("classifies a PathLab-ready high-school conversation", () => {
  const result = classifyConversation([
    "อยู่ ม.5 อยากเริ่มทำโปรเจกต์คอมพิวเตอร์ สมัคร PathLab ราคาเท่าไหร่",
  ]);
  assertEquals(result.gradeLevel, "ม.5");
  assertEquals(result.stage, "building");
  assertEquals(result.wantsPathlab, true);
  assertEquals(result.pathlabPayReady, true);
  assertEquals(result.interests.includes("วิทยาการคอมพิวเตอร์"), true);
});

Deno.test("follows Meta pagination", async () => {
  let calls = 0;
  const fetcher: typeof fetch = () => {
    calls++;
    return Promise.resolve(
      Response.json(
        calls === 1
          ? {
            data: [{ id: "first" }],
            paging: { next: "https://graph.instagram.com/next" },
          }
          : { data: [{ id: "second" }] },
      ),
    );
  };
  const rows = await listConversations(
    { accessToken: "secret-token", instagramAccountId: "account" },
    Date.now() + 5_000,
    fetcher,
  );
  assertEquals(rows.map((row) => row.id), ["first", "second"]);
});

Deno.test("turns Meta HTTP errors into safe codes", async () => {
  const fetcher: typeof fetch = () =>
    Promise.resolve(Response.json({ error: { code: 4 } }, { status: 429 }));
  let result: unknown;
  try {
    await listConversations(
      { accessToken: "secret-token", instagramAccountId: "account" },
      Date.now() + 5_000,
      fetcher,
    );
  } catch (error) {
    result = error;
  }
  assertEquals(result instanceof MetaRequestError, true);
  assertEquals((result as MetaRequestError).message, "meta_rate_limited");
});

Deno.test("builds the public Contester page request without session data", () => {
  const url = new URL(contesterUrl(2));
  assertEquals(url.searchParams.get("page"), "2");
  assertEquals(url.searchParams.get("approvalStatus"), "APPROVED");
  assertEquals(url.searchParams.get("showOnlyActive"), "false");
  assertEquals(url.searchParams.has("cookie"), false);
});

Deno.test("normalizes Devpost submission windows", () => {
  const dates = devpostDates("Aug 01 - Sep 12, 2026");
  assertEquals(dates.opensAt?.slice(0, 10), "2026-08-01");
  assertEquals(dates.deadline?.slice(0, 10), "2026-09-12");
});
