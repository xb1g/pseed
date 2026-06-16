import { NextRequest, NextResponse } from "next/server";
import { extractHackathonToken, getCorsHeaders } from "@/lib/hackathon/auth";
import { getSessionParticipant, getParticipantTeam } from "@/lib/hackathon/db";
import { getMyGalleryProduct } from "@/lib/hackathon/gallery";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  // TODO: re-enable auth checks before production
  // const token = extractHackathonToken(req);
  // if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  // const participant = await getSessionParticipant(token);
  // if (!participant) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
  // const team = await getParticipantTeam(participant.id);
  // if (!team) return NextResponse.json({ product: null }, { headers: corsHeaders });

  const product = await getMyGalleryProduct("00000000-0000-0000-0000-000000000002");
  return NextResponse.json({ product }, { headers: corsHeaders });
}
