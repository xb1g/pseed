import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { renderCustomEmail } from "@/lib/hackathon/email-templates";
import { type EmailTemplateVars } from "@/lib/hackathon/email";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "hi@noreply.passionseed.org";

function getServiceClient() {
  return createServiceClient(
    process.env.HACKATHON_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.HACKATHON_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: roles } = await supabase
    .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
  return roles?.length ? user : null;
}

/** Normalize team name for fuzzy matching:
 *  - lowercase
 *  - collapse all whitespace (including zero-width spaces) to single space
 *  - trim
 *  This handles "Lizard 🦎" vs "Lizard🦎" vs "lizard 🦎"
 */
function normalizeTeam(name: string) {
  return name
    .toLowerCase()
    .replace(/[\s\u00a0\u200b]+/g, " ")
    .trim();
}

/** Extract team name from certificate filename.
 *  Format: TNDH_Participan-PersonName-TeamName.png
 *  Team name is the last dash-separated segment before the extension,
 *  with underscores replaced by spaces.
 */
function teamFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, ""); // strip extension
  const parts = base.split("-");
  if (parts.length < 3) return base.replace(/_/g, " ");
  // Everything after the second dash is the team name (handles team names with dashes)
  return parts.slice(2).join("-").replace(/_/g, " ");
}

// GET — resolve filenames against DB teams
// Body: { filenames: string[] }
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const contentType = req.headers.get("content-type") ?? "";

  // ── Mode 1: resolve filenames → matched/unmatched preview ──
  if (contentType.includes("application/json")) {
    const body = await req.json();

    // Sub-mode: send certificates
    if (body.action === "send") {
      return handleSend(body);
    }

    // Sub-mode: resolve
    const { filenames }: { filenames: string[] } = body;
    if (!filenames?.length) {
      return NextResponse.json({ error: "No filenames provided" }, { status: 400 });
    }

    const serviceClient = getServiceClient();

    // Fetch all teams with their members
    const { data: teams, error: tErr } = await serviceClient
      .from("hackathon_teams")
      .select(`id, name, hackathon_team_members(participant_id, hackathon_participants(id, name, email))`);

    if (tErr) return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });

    // Build normalized lookup: normalizedName → { id, name, members[] }
    const teamMap = new Map<string, { id: string; name: string; members: Array<{ id: string; name: string; email: string }> }>();
    for (const t of teams ?? []) {
      const members = (t.hackathon_team_members as any[])
        .map((m: any) => m.hackathon_participants)
        .filter(Boolean)
        .map((p: any) => ({ id: p.id, name: p.name, email: p.email }));
      teamMap.set(normalizeTeam(t.name), { id: t.id, name: t.name, members });
    }

    // Group filenames by extracted team name
    const filesByRawTeam = new Map<string, string[]>();
    for (const f of filenames) {
      const raw = teamFromFilename(f);
      const arr = filesByRawTeam.get(raw) ?? [];
      arr.push(f);
      filesByRawTeam.set(raw, arr);
    }

    const matched: Array<{
      rawTeamName: string;
      dbTeamName: string;
      files: string[];
      members: Array<{ id: string; name: string; email: string }>;
    }> = [];
    const unmatched: Array<{ rawTeamName: string; files: string[] }> = [];

    for (const [raw, files] of filesByRawTeam.entries()) {
      const dbTeam = teamMap.get(normalizeTeam(raw));
      if (dbTeam) {
        matched.push({ rawTeamName: raw, dbTeamName: dbTeam.name, files, members: dbTeam.members });
      } else {
        unmatched.push({ rawTeamName: raw, files });
      }
    }

    return NextResponse.json({ matched, unmatched });
  }

  return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
}

async function handleSend(body: {
  action: "send";
  // Each entry: participantId, their email, the filenames to attach, rendered subject/html/text
  emails: Array<{
    participantId: string;
    to: string;
    subject: string;
    html: string;
    text: string;
    attachments: Array<{ filename: string; contentBase64: string }>;
  }>;
}) {
  const { emails } = body;
  if (!emails?.length) return NextResponse.json({ error: "No emails to send" }, { status: 400 });

  const BATCH_SIZE = 10; // smaller batches due to attachments
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);

    const resendPayload = chunk.map((e) => ({
      from: `PassionSeed <${FROM_EMAIL}>`,
      to: [e.to],
      subject: e.subject,
      html: e.html,
      text: e.text,
      attachments: e.attachments.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.contentBase64, "base64"),
      })),
    }));

    try {
      const { error } = await resend.batch.send(resendPayload);
      if (error) {
        failed += chunk.length;
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error.message}`);
      } else {
        sent += chunk.length;
      }
    } catch (err) {
      failed += chunk.length;
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return NextResponse.json({ sent, failed, errors });
}
