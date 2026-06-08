import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Increase body size limit for certificate file uploads (~200 PNGs)
export const dynamic = "force-dynamic";
export const maxDuration = 60;


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
 *  Strategy: team name is always after the LAST dash in the base filename.
 *  Underscores in the team segment are replaced with spaces.
 *
 *  Examples:
 *   TNDH_Participan-PersonName-TeamName.png       → "TeamName"
 *   TNDH_Participants_Certificate-TEst2.png       → "TEst2"
 *   TNDH_Participants_Certificate_TeamName.png    → "TeamName" (no dash → last underscore segment)
 */
function teamFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  const lastDash = base.lastIndexOf("-");
  if (lastDash !== -1) {
    return base.slice(lastDash + 1).replace(/_/g, " ").trim();
  }
  // No dash at all — take last underscore segment
  const parts = base.split("_");
  return parts[parts.length - 1].trim();
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const contentType = req.headers.get("content-type") ?? "";

  // ── Mode 1: resolve filenames → matched/unmatched preview (JSON, no files) ──
  if (contentType.includes("application/json")) {
    const body = await req.json();
    const { filenames }: { filenames: string[] } = body;
    if (!filenames?.length) {
      return NextResponse.json({ error: "No filenames provided" }, { status: 400 });
    }
    return resolveFilenames(filenames);
  }

  // ── Mode 2: send certificates (multipart/form-data with actual files) ──
  if (contentType.includes("multipart/form-data")) {
    return handleSend(req);
  }

  return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
}

async function resolveFilenames(filenames: string[]) {
  const serviceClient = getServiceClient();
  const { data: teams, error: tErr } = await serviceClient
    .from("hackathon_teams")
    .select(`id, name, hackathon_team_members(participant_id, hackathon_participants(id, name, email))`);

  if (tErr) {
    console.error("resolveFilenames DB error:", tErr);
    return NextResponse.json({ error: "Failed to fetch teams" }, { status: 500 });
  }

  const teamMap = new Map<string, { id: string; name: string; members: Array<{ id: string; name: string; email: string }> }>();
  for (const t of teams ?? []) {
    const members = (t.hackathon_team_members as any[])
      .map((m: any) => m.hackathon_participants)
      .filter(Boolean)
      .map((p: any) => ({ id: p.id, name: p.name, email: p.email }));
    teamMap.set(normalizeTeam(t.name), { id: t.id, name: t.name, members });
  }

  const filesByRawTeam = new Map<string, string[]>();
  for (const f of filenames) {
    const raw = teamFromFilename(f);
    const arr = filesByRawTeam.get(raw) ?? [];
    arr.push(f);
    filesByRawTeam.set(raw, arr);
  }

  const matched: Array<{ rawTeamName: string; dbTeamName: string; files: string[]; members: Array<{ id: string; name: string; email: string }> }> = [];
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

async function handleSend(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch (err) {
    console.error("handleSend formData parse error:", err);
    return NextResponse.json({ error: "Failed to parse form data" }, { status: 400 });
  }

  const metaRaw = formData.get("meta");
  if (!metaRaw || typeof metaRaw !== "string") {
    return NextResponse.json({ error: "Missing meta field" }, { status: 400 });
  }

  let meta: {
    subject: string;
    body: string;
    // per-participant: { participantId, to, name, teamName, fileNames[] }
    recipients: Array<{ participantId: string; to: string; name: string; teamName: string; fileNames: string[] }>;
  };
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    return NextResponse.json({ error: "Invalid meta JSON" }, { status: 400 });
  }

  // Build file buffer map: keys are f0, f1, f2... matching recipient[0].fileNames indices
  const fileMap = new Map<string, Buffer>();
  for (const [key, value] of formData.entries()) {
    if (/^f\d+$/.test(key) && typeof value !== "string") {
      const blob = value as Blob;
      // The actual filename is stored as the Blob's name (third arg to FormData.append)
      const fname = (value as File).name || key;
      const buf = Buffer.from(await blob.arrayBuffer());
      fileMap.set(fname, buf);
    }
  }

  const BATCH_SIZE = 5;
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < meta.recipients.length; i += BATCH_SIZE) {
    const chunk = meta.recipients.slice(i, i + BATCH_SIZE);

    const resendPayload = chunk.map((r) => {
      const subject = meta.subject.replace(/\{\{name\}\}/g, r.name).replace(/\{\{team_name\}\}/g, r.teamName);
      const bodyHtml = meta.body.replace(/\{\{name\}\}/g, r.name).replace(/\{\{team_name\}\}/g, r.teamName);
      return {
        from: `PassionSeed <${FROM_EMAIL}>`,
        to: [r.to],
        subject,
        html: `<!DOCTYPE html><html><body>${bodyHtml}</body></html>`,
        text: bodyHtml.replace(/<[^>]+>/g, ""),
        attachments: r.fileNames
          .filter((fn) => fileMap.has(fn))
          .map((fn) => ({ filename: fn, content: fileMap.get(fn)! })),
      };
    });

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
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ sent, failed, errors });
}
