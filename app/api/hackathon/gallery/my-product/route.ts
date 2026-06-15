import { NextRequest, NextResponse } from "next/server";
import { extractHackathonToken, getCorsHeaders } from "@/lib/hackathon/auth";
import { getSessionParticipant, getParticipantTeam } from "@/lib/hackathon/db";
import { getMyGalleryProduct } from "@/lib/hackathon/gallery";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const token = extractHackathonToken(req);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const participant = await getSessionParticipant(token);
  if (!participant) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });

  const team = await getParticipantTeam(participant.id);
  if (!team) return NextResponse.json({ product: null }, { headers: corsHeaders });

  const product = await getMyGalleryProduct(team.id);
  return NextResponse.json({ product }, { headers: corsHeaders });
}
