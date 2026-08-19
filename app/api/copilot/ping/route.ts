/**
 * GET /api/copilot/ping
 *
 * Cheap bearer check for the extension's "Test connection" button. It runs
 * the same `verifyCopilotToken` gate as /advise and /log but touches no
 * playbook, no Qwen, and no conversation lookup, so the operator can tell a
 * bad token apart from a bad API base without opening a DM thread.
 *
 * On success it echoes back the non-secret metadata of the row: which token
 * this is and when it dies. Never the hash.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import {
  extractBearerFromHeader,
  verifyCopilotToken,
  type SupabaseLookupClient,
} from "@/lib/supabase/dm-copilot-tokens";

export async function GET(request: NextRequest) {
  const bearer = extractBearerFromHeader(request.headers.get("authorization"));
  if (!bearer) {
    console.warn("[copilot ping] rejected: missing_bearer");
    return NextResponse.json({ ok: false, reason: "missing_bearer" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const verified = await verifyCopilotToken({
    supabase: supabase as unknown as SupabaseLookupClient,
    raw: bearer,
  });
  if (!verified.ok) {
    console.warn(`[copilot ping] rejected: ${verified.reason}`);
    return NextResponse.json({ ok: false, reason: verified.reason }, { status: 401 });
  }

  const { data } = await supabase
    .from("dm_copilot_tokens")
    .select("name, expires_at")
    .eq("id", verified.token.id)
    .maybeSingle();

  return NextResponse.json({
    ok: true,
    name: data?.name ?? null,
    expiresAt: data?.expires_at ?? null,
  });
}
