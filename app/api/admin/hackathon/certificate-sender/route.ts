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
 *  Primary strategy: team name is after the LAST dash in the base filename.
 *  Underscores in the team segment are replaced with spaces.
 *
 *  Returns all candidate extractions (last-dash, second-to-last, etc.) so the
 *  caller can try each one against the DB.
 */
function teamCandidatesFromFilename(filename: string): string[] {
  const base = filename.replace(/\.[^.]+$/, "");
  const candidates: string[] = [];
  // Walk backwards through dash positions, collecting progressively longer suffixes
  let pos = base.length;
  while (true) {
    const dash = base.lastIndexOf("-", pos - 1);
    if (dash === -1) break;
    candidates.push(base.slice(dash + 1).replace(/_/g, " ").trim());
    pos = dash;
  }
  // No dash at all — take last underscore segment
  if (candidates.length === 0) {
    const parts = base.split("_");
    candidates.push(parts[parts.length - 1].trim());
  }
  return candidates;
}

function teamFromFilename(filename: string): string {
  return teamCandidatesFromFilename(filename)[0];
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

  // Group files by their best-matching team candidate
  // Each file may have multiple candidate team names; pick the first one that matches the DB
  const filesByDbTeam = new Map<string, { dbTeam: { id: string; name: string; members: Array<{ id: string; name: string; email: string }> }; rawTeamName: string; files: string[] }>();
  const unmatchedFiles = new Map<string, string[]>(); // rawTeamName → files

  for (const f of filenames) {
    const candidates = teamCandidatesFromFilename(f);
    let found = false;
    for (const raw of candidates) {
      const dbTeam = teamMap.get(normalizeTeam(raw));
      if (dbTeam) {
        const key = dbTeam.name;
        const entry = filesByDbTeam.get(key) ?? { dbTeam, rawTeamName: raw, files: [] };
        entry.files.push(f);
        filesByDbTeam.set(key, entry);
        found = true;
        break;
      }
    }
    if (!found) {
      const raw = candidates[0];
      const arr = unmatchedFiles.get(raw) ?? [];
      arr.push(f);
      unmatchedFiles.set(raw, arr);
    }
  }

  const matched: Array<{ rawTeamName: string; dbTeamName: string; files: string[]; members: Array<{ id: string; name: string; email: string }> }> = [];
  const unmatched: Array<{ rawTeamName: string; files: string[] }> = [];

  for (const { dbTeam, rawTeamName, files } of filesByDbTeam.values()) {
    matched.push({ rawTeamName, dbTeamName: dbTeam.name, files, members: dbTeam.members });
  }
  for (const [rawTeamName, files] of unmatchedFiles.entries()) {
    unmatched.push({ rawTeamName, files });
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

  // Build file buffer map keyed by filename.
  // We send one recipient at a time, so meta.recipients[0].fileNames[i] == file at key f{i}.
  // We use the numeric index from the key to look up the original filename — this avoids
  // relying on File.name which may not be preserved through Next.js FormData parsing.
  const recipient0FileNames = meta.recipients[0]?.fileNames ?? [];
  const fileMap = new Map<string, Buffer>();
  const debugFiles: Array<{ key: string; filenameFromFile: string; filenameResolved: string; size: number }> = [];
  for (const [key, value] of formData.entries()) {
    const match = key.match(/^f(\d+)$/);
    if (match && typeof value !== "string") {
      const idx = parseInt(match[1], 10);
      const blob = value as Blob;
      const filenameFromFile = (value as File).name || key;
      // Prefer index-based lookup; fall back to File.name
      const fname = recipient0FileNames[idx] ?? filenameFromFile;
      const buf = Buffer.from(await blob.arrayBuffer());
      fileMap.set(fname, buf);
      debugFiles.push({ key, filenameFromFile, filenameResolved: fname, size: buf.length });
    }
  }
  console.log("[cert-sender] fileMap keys:", [...fileMap.keys()]);
  console.log("[cert-sender] recipient fileNames:", recipient0FileNames);
  console.log("[cert-sender] debugFiles:", debugFiles);

  const BATCH_SIZE = 5;
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < meta.recipients.length; i += BATCH_SIZE) {
    const chunk = meta.recipients.slice(i, i + BATCH_SIZE);

    const resendPayload = chunk.map((r) => {
      const subject = meta.subject.replace(/\{\{name\}\}/g, r.name).replace(/\{\{team_name\}\}/g, r.teamName);
      const bodyHtml = meta.body.replace(/\{\{name\}\}/g, r.name).replace(/\{\{team_name\}\}/g, r.teamName);
      const attachments = r.fileNames
        .filter((fn) => fileMap.has(fn))
        .map((fn) => ({ filename: fn, content: fileMap.get(fn)!.toString("base64") }));
      console.log(`[cert-sender] recipient=${r.to} fileNames=${JSON.stringify(r.fileNames)} attachments=${attachments.length}`);
      return {
        from: `PassionSeed <${FROM_EMAIL}>`,
        to: [r.to],
        subject,
        html: `<!DOCTYPE html><html><body>${bodyHtml}</body></html>`,
        text: bodyHtml.replace(/<[^>]+>/g, ""),
        attachments,
      };
    });

    try {
      // Use fetch directly to avoid any SDK serialization issues with Buffer/base64
      for (const payload of resendPayload) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        const json = await res.json() as any;
        console.log(`[cert-sender] resend response status=${res.status} body=${JSON.stringify(json)}`);
        if (!res.ok) {
          failed++;
          errors.push(`${payload.to[0]}: ${json?.message ?? res.statusText}`);
        } else {
          sent++;
        }
      }
    } catch (err) {
      failed += chunk.length;
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const attachmentCounts = meta.recipients.map((r) => ({
    to: r.to,
    fileNames: r.fileNames,
    matched: r.fileNames.filter((fn) => fileMap.has(fn)),
  }));
  return NextResponse.json({ sent, failed, errors, debug: { fileMapKeys: [...fileMap.keys()], recipientFileNames: recipient0FileNames, debugFiles, attachmentCounts } });
}
