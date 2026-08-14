import { runMetaBackfill } from "./scheduler.ts";

function assertEquals(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Expected ${JSON.stringify(expected)}, received ${
        JSON.stringify(actual)
      }`,
    );
  }
}

Deno.test("sends the cron secret and returns safe batch counts", async () => {
  let authorization: string | null = null;
  const fetcher: typeof fetch = (_input, init) => {
    authorization = new Headers(init?.headers).get("authorization");
    return Promise.resolve(Response.json({
      dm: { processed: 3, remaining: 4, stoppedReason: "deadline" },
      comments: { processed: 2, remaining: 0, stoppedReason: "done" },
    }));
  };

  const result = await runMetaBackfill({
    endpoint: "https://example.com/backfill",
    secret: "test-secret",
    fetcher,
  });

  assertEquals(authorization, "Bearer test-secret");
  assertEquals(result, {
    dm: { processed: 3, remaining: 4, stoppedReason: "deadline" },
    comments: { processed: 2, remaining: 0, stoppedReason: "done" },
  });
});

Deno.test("throws on endpoint failures without exposing the response body", async () => {
  const fetcher: typeof fetch = () =>
    Promise.resolve(
      new Response("sensitive provider details", { status: 500 }),
    );

  let message = "";
  try {
    await runMetaBackfill({
      endpoint: "https://example.com",
      secret: "test",
      fetcher,
    });
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }

  assertEquals(message, "Meta backfill endpoint returned 500");
});

Deno.test("turns reported batch errors into cron failures for retry", async () => {
  const fetcher: typeof fetch = () =>
    Promise.resolve(Response.json({
      dm: { processed: 0, remaining: -1, stoppedReason: "error" },
      comments: { processed: 0, remaining: 0, stoppedReason: "done" },
    }));

  let failed = false;
  try {
    await runMetaBackfill({
      endpoint: "https://example.com",
      secret: "test",
      fetcher,
    });
  } catch {
    failed = true;
  }
  assertEquals(failed, true);
});

Deno.test("requires the shared cron secret", async () => {
  let message = "";
  try {
    await runMetaBackfill({ endpoint: "https://example.com", secret: "" });
  } catch (error) {
    message = error instanceof Error ? error.message : String(error);
  }
  assertEquals(message, "Missing CRON_SECRET");
});
