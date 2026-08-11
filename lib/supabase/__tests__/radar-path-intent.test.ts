import { shouldSkipRadarAnalytics } from "@/lib/radar/analytics-host";
import { recordRadarPathIntent } from "@/lib/supabase/radar";
import { createClient } from "@/utils/supabase/client";

jest.mock("@/lib/radar/analytics-host", () => ({
  shouldSkipRadarAnalytics: jest.fn(),
}));
jest.mock("@/utils/supabase/client", () => ({
  createClient: jest.fn(),
}));

const intent = {
  fieldSlug: "sales",
  fieldId: "field-1",
  pathSlug: "territory:business:interested",
  buttonLabel: "อยากรู้เพิ่ม",
};

function mockRadarIntentInsert(error: { message: string } | null) {
  const insert = jest.fn().mockResolvedValue({ error });
  jest.mocked(createClient).mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
    },
    from: jest.fn().mockReturnValue({ insert }),
  } as never);
  return insert;
}

beforeEach(() => {
  jest.mocked(shouldSkipRadarAnalytics).mockReturnValue(false);
  window.localStorage.clear();
});

test("reports a failed Radar intent insert", async () => {
  const writeError = { message: "insert failed" };
  mockRadarIntentInsert(writeError);
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

  await expect(recordRadarPathIntent(intent)).resolves.toBe("failed");
  expect(consoleError).toHaveBeenCalledWith(
    "Error recording radar path intent:",
    writeError
  );
});

test("reports a successful Radar intent insert", async () => {
  const insert = mockRadarIntentInsert(null);

  await expect(recordRadarPathIntent(intent)).resolves.toBe("recorded");
  expect(insert).toHaveBeenCalledWith({
    user_id: null,
    session_id: expect.any(String),
    field_id: "field-1",
    field_slug: "sales",
    path_slug: "territory:business:interested",
    button_label: "อยากรู้เพิ่ม",
  });
});

test("preserves intentional analytics suppression as a skipped write", async () => {
  jest.mocked(shouldSkipRadarAnalytics).mockReturnValue(true);

  await expect(recordRadarPathIntent(intent)).resolves.toBe("skipped");
  expect(createClient).not.toHaveBeenCalled();
});
