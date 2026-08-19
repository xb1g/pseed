/**
 * Pure helpers around DM Copilot bearer tokens. These run in Node, no DOM, no
 * Supabase client — the Supabase-touching functions are exercised separately
 * against a mock.
 */

import {
  COPILOT_TOKEN_PREFIX,
  extractBearerFromHeader,
  generateCopilotToken,
  hashCopilotToken,
  safeEqualHex,
  stripCopilotPrefix,
  verifyCopilotToken,
  type VerifyResult,
} from "../dm-copilot-tokens";

describe("dm-copilot-tokens helpers", () => {
  test("generateCopilotToken uses the prefix and produces base64url-shaped bytes", () => {
    const token = generateCopilotToken();
    expect(token.startsWith(COPILOT_TOKEN_PREFIX)).toBe(true);
    const body = token.slice(COPILOT_TOKEN_PREFIX.length);
    expect(body).toMatch(/^[A-Za-z0-9_-]+$/);
    // 32 bytes -> 43 base64url chars without padding.
    expect(body.length).toBeGreaterThanOrEqual(42);
    expect(body.length).toBeLessThanOrEqual(44);
  });

  test("generateCopilotToken yields unique values", () => {
    const set = new Set<string>();
    for (let i = 0; i < 64; i += 1) set.add(generateCopilotToken());
    expect(set.size).toBe(64);
  });

  test("hashCopilotToken is deterministic and 64 hex chars", () => {
    const token = `${COPILOT_TOKEN_PREFIX}abc`;
    expect(hashCopilotToken(token)).toBe(hashCopilotToken(token));
    expect(hashCopilotToken(token)).toMatch(/^[0-9a-f]{64}$/);
  });

  test("stripCopilotPrefix strips only when the prefix matches", () => {
    expect(stripCopilotPrefix(`${COPILOT_TOKEN_PREFIX}xyz`)).toBe("xyz");
    expect(stripCopilotPrefix("nope_xyz")).toBe("nope_xyz");
  });

  test("safeEqualHex returns true on identical input, false on length mismatch", () => {
    const a = "a".repeat(64);
    const b = "a".repeat(64);
    expect(safeEqualHex(a, b)).toBe(true);
    expect(safeEqualHex(a, a.slice(1))).toBe(false);
    expect(safeEqualHex(a, "f".repeat(64))).toBe(false);
  });

  test("extractBearerFromHeader recognises the prefix and rejects other shapes", () => {
    expect(extractBearerFromHeader(`Bearer ${COPILOT_TOKEN_PREFIX}abc`)).toBe(
      `${COPILOT_TOKEN_PREFIX}abc`
    );
    expect(extractBearerFromHeader(`bearer ${COPILOT_TOKEN_PREFIX}abc`)).toBe(
      `${COPILOT_TOKEN_PREFIX}abc`
    );
    expect(extractBearerFromHeader(`Basic ${COPILOT_TOKEN_PREFIX}abc`)).toBeNull();
    expect(extractBearerFromHeader(`Bearer wrongprefix_abc`)).toBeNull();
    expect(extractBearerFromHeader(null)).toBeNull();
    expect(extractBearerFromHeader("")).toBeNull();
  });
});

describe("verifyCopilotToken", () => {
  interface TokenRow {
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: string;
    revoked_at: string | null;
  }

  function makeSupabase(rows: TokenRow[]) {
    return {
      from(_table: string) {
        const eq = (column: string, value: string) => ({
          maybeSingle: async () => {
            const row = rows.find((r) => (r as unknown as Record<string, string>)[column] === value) ?? null;
            return { data: row, error: null };
          },
        });
        return { select: () => ({ eq }) };
      },
    };
  }

  const userId = "11111111-1111-1111-1111-111111111111";
  const tokenId = "22222222-2222-2222-2222-222222222222";
  const raw = `${COPILOT_TOKEN_PREFIX}abcdef0123`;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-08-19T05:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("returns ok with token when hash matches and not expired", async () => {
    const hash = hashCopilotToken(raw);
    const supabase = makeSupabase([
      {
        id: tokenId,
        user_id: userId,
        token_hash: hash,
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        revoked_at: null,
      },
    ]);
    const result = (await verifyCopilotToken({ supabase: supabase as never, raw })) as VerifyResult;
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.token.id).toBe(tokenId);
      expect(result.token.user_id).toBe(userId);
    }
  });

  test("returns 'unknown' when no row matches", async () => {
    const supabase = makeSupabase([]);
    const result = await verifyCopilotToken({ supabase: supabase as never, raw });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("unknown");
  });

  test("returns 'expired' once expires_at has passed", async () => {
    const hash = hashCopilotToken(raw);
    const supabase = makeSupabase([
      {
        id: tokenId,
        user_id: userId,
        token_hash: hash,
        expires_at: new Date(Date.now() - 1000).toISOString(),
        revoked_at: null,
      },
    ]);
    const result = await verifyCopilotToken({ supabase: supabase as never, raw });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("expired");
  });

  test("returns 'revoked' when revoked_at is set", async () => {
    const hash = hashCopilotToken(raw);
    const supabase = makeSupabase([
      {
        id: tokenId,
        user_id: userId,
        token_hash: hash,
        expires_at: new Date(Date.now() + 60_000).toISOString(),
        revoked_at: new Date().toISOString(),
      },
    ]);
    const result = await verifyCopilotToken({ supabase: supabase as never, raw });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("revoked");
  });

  test("rejects malformed bearer early", async () => {
    const result = await verifyCopilotToken({ supabase: makeSupabase([]) as never, raw: "wrongprefix_x" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("malformed");
  });

  test("rejects empty bearer", async () => {
    const result = await verifyCopilotToken({ supabase: makeSupabase([]) as never, raw: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("missing");
  });
});
