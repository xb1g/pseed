/**
 * DM Copilot token helpers.
 *
 * Each admin user mints one or more tokens from /admin/dm-leads/copilot. The
 * raw token is shown once at mint time and never persisted; what we store is
 * sha256(raw). A leaked hash cannot be replayed.
 *
 * Token format: `psdmlp_` + 32 url-safe base64 bytes. The prefix lets us
 * recognise the bearer in middleware and reject early.
 *
 * Pure crypto + DB I/O. No React, no admin-client shenanigans: callers pass
 * the Supabase client they want the call to run against.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const COPILOT_TOKEN_PREFIX = "psdmlp_";
export const COPILOT_TOKEN_BYTES = 32;
export const DEFAULT_TOKEN_TTL_DAYS = 90;

export interface CopilotTokenRow {
  id: string;
  user_id: string;
  name: string;
  token_hash: string;
  last_used_at: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

export interface MintedToken {
  /** Raw bearer. Shown to the operator exactly once. Never stored. */
  raw: string;
  row: CopilotTokenRow;
}

/**
 * Generates a fresh bearer. Format is fixed so a future migration can rotate
 * the prefix without breaking older clients — keep the prefix length
 * (7 chars) stable.
 */
export function generateCopilotToken(): string {
  const body = randomBytes(COPILOT_TOKEN_BYTES).toString("base64url");
  return `${COPILOT_TOKEN_PREFIX}${body}`;
}

export function hashCopilotToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** Strip the prefix so the verifier sees only the secret bytes. */
export function stripCopilotPrefix(raw: string): string {
  return raw.startsWith(COPILOT_TOKEN_PREFIX) ? raw.slice(COPILOT_TOKEN_PREFIX.length) : raw;
}

/**
 * Pulls the bearer out of an `Authorization: Bearer psdmlp_...` header, or
 * returns null if the header is missing or malformed.
 */
export function extractBearerFromHeader(header: string | null | undefined): string | null {
  if (!header) return null;
  const [scheme, value] = header.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !value) return null;
  if (!value.startsWith(COPILOT_TOKEN_PREFIX)) return null;
  return value;
}

/**
 * Constant-time comparison of two hex digests of equal length. Returns false
 * on any length mismatch so we never feed `timingSafeEqual` unequal buffers.
 */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const aBuf = Buffer.from(a, "hex");
  const bBuf = Buffer.from(b, "hex");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export interface VerifiedToken {
  id: string;
  user_id: string;
}

export type VerifyResult =
  | { ok: true; token: VerifiedToken }
  | { ok: false; reason: "missing" | "malformed" | "unknown" | "expired" | "revoked" };

/**
 * Looks up the bearer, validates hash + expiry + revocation, and returns the
 * owning admin's id. Pure server-side: callers are API routes that pass the
 * service-role client so we can read the row without RLS involvement.
 */
export async function verifyCopilotToken(params: {
  supabase: SupabaseLookupClient;
  raw: string;
  now?: number;
}): Promise<VerifyResult> {
  const { supabase, now = Date.now() } = params;
  const raw = params.raw?.trim();
  if (!raw) return { ok: false, reason: "missing" };
  if (!raw.startsWith(COPILOT_TOKEN_PREFIX)) return { ok: false, reason: "malformed" };

  const hash = hashCopilotToken(raw);
  const { data, error } = await supabase
    .from("dm_copilot_tokens")
    .select("id, user_id, token_hash, expires_at, revoked_at")
    .eq("token_hash", hash)
    .maybeSingle();

  if (error) {
    console.error("[dm-copilot-tokens] lookup failed:", error);
    return { ok: false, reason: "unknown" };
  }
  if (!data) return { ok: false, reason: "unknown" };
  // Defence in depth: even if the row comes back, refuse if the hash doesn't
  // match what we computed locally. Catches a corrupted row before we trust it.
  if (!safeEqualHex(data.token_hash, hash)) return { ok: false, reason: "unknown" };
  if (data.revoked_at) return { ok: false, reason: "revoked" };
  if (Date.parse(data.expires_at) <= now) return { ok: false, reason: "expired" };

  return { ok: true, token: { id: data.id, user_id: data.user_id } };
}

/**
 * Touches `last_used_at`. Best-effort: failure to write the timestamp must not
 * block the API call, but we still log so the audit table picks up the
 * request via the calling route.
 */
export async function touchCopilotToken(params: {
  supabase: SupabaseUpdateClient;
  tokenId: string;
}): Promise<void> {
  const { supabase, tokenId } = params;
  const { error } = await supabase
    .from("dm_copilot_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", tokenId);
  if (error) {
    console.warn("[dm-copilot-tokens] failed to touch last_used_at:", error);
  }
}

/** Minimum Supabase surface needed by `verifyCopilotToken`. */
export type SupabaseLookupClient = {
  from(table: "dm_copilot_tokens"): {
    select(cols: string): {
      eq(col: string, value: string): {
        maybeSingle(): Promise<{ data: CopilotTokenRow | null; error: unknown | null }>;
      };
    };
  };
};

/** Minimum Supabase surface needed by `touchCopilotToken`. */
export type SupabaseUpdateClient = {
  from(table: "dm_copilot_tokens"): {
    update(patch: { last_used_at: string }): {
      eq(col: string, value: string): Promise<{ error: unknown | null }>;
    };
  };
};
