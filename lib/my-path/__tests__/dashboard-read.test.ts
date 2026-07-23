import assert from "node:assert/strict";

import { loadMyPathDashboardSource } from "../dashboard-read";

type QueryResult = { data: unknown[] | null; error: { message: string } | null };

interface QueryCall {
  table: string;
  select?: string;
  filters: Array<{ method: "eq" | "in"; column: string; value: unknown }>;
}

function mockReadClient(results: Record<string, QueryResult>) {
  const calls: QueryCall[] = [];
  const rpcCalls: string[] = [];
  return {
    calls,
    rpcCalls,
    client: {
      rpc(name: string) {
        rpcCalls.push(name);
        return Promise.resolve(
          results[name] ?? { data: [], error: null }
        );
      },
      from(table: string) {
        const call: QueryCall = { table, filters: [] };
        calls.push(call);
        return {
          select(columns: string) {
            call.select = columns;
            return {
              eq(column: string, value: unknown) {
                call.filters.push({ method: "eq", column, value });
                return Promise.resolve(results[table]);
              },
              in(column: string, value: unknown[]) {
                call.filters.push({ method: "in", column, value });
                return Promise.resolve(results[table]);
              },
            };
          },
        };
      },
    },
  };
}

test("the dashboard reader loads only the signed-in student's PathLab and trial sources", async () => {
  const { client, calls, rpcCalls } = mockReadClient({
    path_enrollments: {
      data: [
        {
          id: "enrollment-a",
          path_id: "path-a",
          current_day: 2,
          status: "active",
          enrolled_at: "2026-07-10T00:00:00.000Z",
          completed_at: null,
          path: {
            id: "path-a",
            seed_id: "seed-a",
            seed: { id: "seed-a", title: "AI Builder" },
          },
          path_end_reflections: [],
        },
      ],
      error: null,
    },
    get_my_path_report_evidence: {
      data: [
        {
          id: "report-a",
          enrollment_id: "enrollment-a",
          created_at: "2026-07-20T00:00:00.000Z",
        },
      ],
      error: null,
    },
    trial_accesses: {
      data: [
        {
          id: "trial-a",
          seed_id: "seed-a",
          status: "active",
          pay_token: "pay-a",
          payment_deadline: "2026-07-23T00:00:00.000Z",
          paid_at: null,
        },
      ],
      error: null,
    },
    path_activity_progress: {
      data: [
        {
          enrollment_id: "enrollment-a",
          status: "completed",
          updated_at: "2026-07-20T00:00:00.000Z",
          completed_at: "2026-07-20T00:00:00.000Z",
        },
      ],
      error: null,
    },
  });

  const source = await loadMyPathDashboardSource(client, "user-a");

  assert.deepEqual(source.enrollments[0], {
    id: "enrollment-a",
    pathId: "path-a",
    seedId: "seed-a",
    seedTitle: "AI Builder",
    status: "active",
    currentDay: 2,
    enrolledAt: "2026-07-10T00:00:00.000Z",
    completedAt: null,
    endReflection: null,
    report: {
      id: "report-a",
      createdAt: "2026-07-20T00:00:00.000Z",
    },
  });
  assert.equal(source.trials[0].payToken, "pay-a");
  assert.equal(source.progress[0].status, "completed");

  const enrollmentCall = calls.find((call) => call.table === "path_enrollments");
  assert.ok(enrollmentCall?.select?.includes("path:paths!inner"));
  assert.ok(enrollmentCall?.select?.includes("seed:seeds!inner"));
  assert.doesNotMatch(
    enrollmentCall?.select ?? "",
    /path_reports|report_data|report_text|share_token/i
  );
  assert.deepEqual(enrollmentCall?.filters, [
    { method: "eq", column: "user_id", value: "user-a" },
  ]);

  const trialCall = calls.find((call) => call.table === "trial_accesses");
  assert.deepEqual(trialCall?.filters, [
    { method: "eq", column: "user_id", value: "user-a" },
  ]);

  const progressCall = calls.find(
    (call) => call.table === "path_activity_progress"
  );
  assert.deepEqual(progressCall?.filters, [
    {
      method: "in",
      column: "enrollment_id",
      value: ["enrollment-a"],
    },
  ]);
  assert.match(progressCall?.select ?? "", /status/);
  assert.doesNotMatch(
    progressCall?.select ?? "",
    /response|answer|reflection|content|metadata/i
  );
  assert.deepEqual(rpcCalls, ["get_my_path_report_evidence"]);
});

test("non-critical enrollment and trial errors degrade independently to empty arrays", async () => {
  const { client } = mockReadClient({
    path_enrollments: {
      data: null,
      error: { message: "enrollments unavailable" },
    },
    trial_accesses: {
      data: null,
      error: { message: "trials unavailable" },
    },
    path_activity_progress: { data: [], error: null },
  });
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

  const source = await loadMyPathDashboardSource(client, "user-a");

  assert.deepEqual(source, { enrollments: [], trials: [], progress: [] });
  assert.equal(errorSpy.mock.calls.length, 2);
  assert.match(String(errorSpy.mock.calls[0][0]), /My Path dashboard/);
  errorSpy.mockRestore();
});

test("a progress query failure preserves enrollments without inventing activity results", async () => {
  const { client } = mockReadClient({
    path_enrollments: {
      data: [
        {
          id: "enrollment-a",
          path_id: "path-a",
          current_day: 1,
          status: "paused",
          enrolled_at: "2026-07-10T00:00:00.000Z",
          completed_at: null,
          path: {
            id: "path-a",
            seed_id: "seed-a",
            seed: { id: "seed-a", title: "AI Builder" },
          },
          path_end_reflections: [
            {
              id: "end-a",
              fit_level: 4,
              would_explore_deeper: "yes",
              created_at: "2026-07-21T00:00:00.000Z",
            },
          ],
        },
      ],
      error: null,
    },
    trial_accesses: { data: [], error: null },
    path_activity_progress: {
      data: null,
      error: { message: "progress unavailable" },
    },
  });
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

  const source = await loadMyPathDashboardSource(client, "user-a");

  assert.equal(source.enrollments[0].endReflection?.fitLevel, 4);
  assert.deepEqual(source.progress, []);
  assert.equal(errorSpy.mock.calls.length, 1);
  errorSpy.mockRestore();
});

test("a safe report projection failure preserves the rest of the dashboard", async () => {
  const { client } = mockReadClient({
    path_enrollments: {
      data: [
        {
          id: "enrollment-a",
          path_id: "path-a",
          current_day: 1,
          status: "explored",
          enrolled_at: "2026-07-10T00:00:00.000Z",
          completed_at: "2026-07-21T00:00:00.000Z",
          path: {
            id: "path-a",
            seed_id: "seed-a",
            seed: { id: "seed-a", title: "AI Builder" },
          },
          path_end_reflections: [],
        },
      ],
      error: null,
    },
    trial_accesses: { data: [], error: null },
    path_activity_progress: { data: [], error: null },
    get_my_path_report_evidence: {
      data: null,
      error: { message: "report projection unavailable" },
    },
  });
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

  const source = await loadMyPathDashboardSource(client, "user-a");

  assert.equal(source.enrollments.length, 1);
  assert.equal(source.enrollments[0].report, null);
  assert.equal(errorSpy.mock.calls.length, 1);
  errorSpy.mockRestore();
});

test("a missing report projection function degrades without console errors", async () => {
  const { client } = mockReadClient({
    path_enrollments: {
      data: [
        {
          id: "enrollment-a",
          path_id: "path-a",
          current_day: 1,
          status: "active",
          enrolled_at: "2026-07-10T00:00:00.000Z",
          completed_at: null,
          path: {
            id: "path-a",
            seed_id: "seed-a",
            seed: { id: "seed-a", title: "AI Builder" },
          },
          path_end_reflections: [],
        },
      ],
      error: null,
    },
    trial_accesses: { data: [], error: null },
    path_activity_progress: { data: [], error: null },
    get_my_path_report_evidence: {
      data: null,
      error: {
        message:
          "Could not find the function public.get_my_path_report_evidence without parameters in the schema cache",
      },
    },
  });
  const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

  const source = await loadMyPathDashboardSource(client, "user-a");

  assert.equal(source.enrollments.length, 1);
  assert.equal(source.enrollments[0].report, null);
  assert.equal(errorSpy.mock.calls.length, 0);
  errorSpy.mockRestore();
});
