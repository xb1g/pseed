import {
  recordAuthenticatedRadarMyPathEvent,
  type MyPathRpcClient,
} from "@/lib/my-path/server-mutation";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const supabase = await createClient();
  const result = await recordAuthenticatedRadarMyPathEvent(
    supabase as unknown as MyPathRpcClient,
    input
  );
  return Response.json(result.body, { status: result.status });
}
