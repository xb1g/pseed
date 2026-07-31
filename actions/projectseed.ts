"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { extractDiscordIdentity } from "@/lib/projectseed/discord";
import { PSEED_ACTIVE_COHORT_SLUG } from "@/lib/projectseed/hub";
import { normalizeTags } from "@/lib/projectseed/tags";
import type { PseedSlot } from "@/types/projectseed";

export interface PseedActionResult {
  ok: boolean;
  error?: string;
}

const HUB_PATH = "/projectseed/hub";

function fail(error: string): PseedActionResult {
  return { ok: false, error };
}

async function requireParticipant() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, participant: null };

  const { data: cohort } = await supabase
    .from("pseed_cohorts")
    .select("id")
    .eq("slug", PSEED_ACTIVE_COHORT_SLUG)
    .eq("is_active", true)
    .maybeSingle();

  if (!cohort) return { supabase, user, participant: null };

  const { data: participant } = await supabase
    .from("pseed_participants")
    .select("id, cohort_id")
    .eq("cohort_id", cohort.id)
    .eq("user_id", user.id)
    .maybeSingle();

  return { supabase, user, participant };
}

/**
 * Joins the active cohort with the code shared in Discord.
 *
 * The code is verified inside `pseed_join_cohort`, a SECURITY DEFINER function,
 * so the code itself is never readable by a client — an anon-key user can
 * neither select it nor brute-force it without hitting the API rate limit.
 */
export async function joinCohort(
  code: string,
  displayName?: string
): Promise<PseedActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return fail("ต้องเข้าสู่ระบบก่อน");
  if (!code?.trim()) return fail("ใส่โค้ดเข้าร่วมก่อน");

  const { error } = await supabase.rpc("pseed_join_cohort", {
    p_slug: PSEED_ACTIVE_COHORT_SLUG,
    p_code: code.trim(),
    p_display_name: displayName?.trim() || null,
  });

  if (error) {
    if (error.message.includes("invalid_join_code")) return fail("โค้ดไม่ถูกต้อง");
    if (error.message.includes("cohort_not_found")) return fail("ยังไม่เปิดรับรุ่นนี้");
    console.error("[projectseed] join failed:", error.message);
    return fail("เข้าร่วมไม่สำเร็จ ลองใหม่อีกครั้ง");
  }

  await syncDiscordLink();
  revalidatePath(HUB_PATH);
  return { ok: true };
}

/**
 * Copies the Discord identity from the auth user onto the participant row.
 *
 * Called on every hub render, not only right after linking: `linkIdentity`
 * redirects through Supabase and back, and the participant may also have signed
 * up with Discord long before this cohort existed. Making it idempotent and
 * unconditional is cheaper than trying to catch the one moment it changes.
 */
export async function syncDiscordLink(): Promise<PseedActionResult> {
  const { supabase, user, participant } = await requireParticipant();
  if (!user) return fail("ต้องเข้าสู่ระบบก่อน");
  if (!participant) return fail("ยังไม่ได้เข้าร่วมรุ่นนี้");

  const identity = extractDiscordIdentity(user);
  if (!identity) return fail("ยังไม่ได้เชื่อมบัญชี Discord");

  const { error } = await supabase
    .from("pseed_participants")
    .update({
      discord_user_id: identity.userId,
      discord_username: identity.username,
      discord_linked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", participant.id);

  if (error) {
    // A unique-violation here means the Discord account is already on another
    // participant row in this cohort — two site accounts, one Discord. The bot
    // could not tell them apart, so the link is refused rather than moved.
    if (error.code === "23505") {
      return fail("บัญชี Discord นี้ถูกเชื่อมกับผู้ใช้อื่นในรุ่นนี้แล้ว");
    }
    console.error("[projectseed] discord sync failed:", error.message);
    return fail("บันทึกการเชื่อมบัญชีไม่สำเร็จ");
  }

  // profiles.discord_id is the pre-existing, app-wide field. Keeping it in step
  // means anything outside ProjectSeed that already reads it keeps working.
  await supabase
    .from("profiles")
    .update({ discord_id: identity.userId })
    .eq("id", user.id);

  revalidatePath(HUB_PATH);
  return { ok: true };
}

/**
 * Clears the Discord link from the participant row.
 *
 * Exists because authorising the wrong Discord account is easy and invisible:
 * the browser is signed into whichever account you last used, and the OAuth
 * screen does not make the account obvious. Removing the identity itself is a
 * client call (`supabase.auth.unlinkIdentity`) — this clears our side of it, so
 * the two never disagree about who is linked.
 */
export async function unlinkDiscord(): Promise<PseedActionResult> {
  const { supabase, user, participant } = await requireParticipant();
  if (!user) return fail("ต้องเข้าสู่ระบบก่อน");
  if (!participant) return fail("ยังไม่ได้เข้าร่วมรุ่นนี้");

  const { error } = await supabase
    .from("pseed_participants")
    .update({
      discord_user_id: null,
      discord_username: null,
      discord_linked_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", participant.id);

  if (error) {
    console.error("[projectseed] discord unlink failed:", error.message);
    return fail("ยกเลิกการเชื่อมบัญชีไม่สำเร็จ");
  }

  await supabase.from("profiles").update({ discord_id: null }).eq("id", user.id);

  revalidatePath(HUB_PATH);
  return { ok: true };
}

export interface SaveProjectPickInput {
  projectOptionId?: string | null;
  customTitle?: string | null;
  tags?: string[] | null;
}


/** Step 2 — which project. Explanation is a separate save so a pick is never lost. */
export async function saveProjectPick(
  input: SaveProjectPickInput
): Promise<PseedActionResult> {
  const { supabase, user, participant } = await requireParticipant();
  if (!user) return fail("ต้องเข้าสู่ระบบก่อน");
  if (!participant) return fail("ยังไม่ได้เข้าร่วมรุ่นนี้");

  const customTitle = input.customTitle?.trim() || null;
  const projectOptionId = input.projectOptionId || null;

  if (!customTitle && !projectOptionId) {
    return fail("เลือกหมวดหมู่หรือพิมพ์ชื่อโปรเจกต์ของคุณ");
  }

  const { error } = await supabase.from("pseed_project_picks").upsert(
    {
      participant_id: participant.id,
      project_option_id: projectOptionId,
      custom_title: customTitle,
      // Normalized here as well as in the form: the client's copy is a
      // convenience, and a tag that reaches the database un-lowercased will
      // never match the one someone else typed.
      tags: normalizeTags(input.tags),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "participant_id" }
  );

  if (error) {
    console.error("[projectseed] pick failed:", error.message);
    return fail("บันทึกโปรเจกต์ไม่สำเร็จ");
  }

  revalidatePath(HUB_PATH);
  revalidatePath(`${HUB_PATH}/project`);
  return { ok: true };
}

export interface SaveProjectBriefInput {
  whatBuild: string;
  whyThis: string;
  whoFor: string;
  firstStep?: string;
  submit?: boolean;
}

/**
 * Step 3 — the explanation. `submit: false` saves a draft, which is what the
 * autosave path uses; only an explicit submit stamps `submitted_at`, because
 * that timestamp is the thing a mentor reads as "ready for me".
 */
export async function saveProjectBrief(
  input: SaveProjectBriefInput
): Promise<PseedActionResult> {
  const { supabase, user, participant } = await requireParticipant();
  if (!user) return fail("ต้องเข้าสู่ระบบก่อน");
  if (!participant) return fail("ยังไม่ได้เข้าร่วมรุ่นนี้");

  const { data: existing } = await supabase
    .from("pseed_project_picks")
    .select("id, project_option_id, custom_title")
    .eq("participant_id", participant.id)
    .maybeSingle();

  if (!existing) return fail("เลือกโปรเจกต์ก่อน แล้วค่อยอธิบาย");

  const submitting = Boolean(input.submit);
  if (submitting) {
    if (!input.whatBuild?.trim()) return fail("บอกก่อนว่าจะทำอะไร");
    if (!input.whyThis?.trim()) return fail("บอกก่อนว่าทำไมต้องเป็นเรื่องนี้");
    if (!input.whoFor?.trim()) return fail("บอกก่อนว่าทำเพื่อใคร");
  }

  const { error } = await supabase
    .from("pseed_project_picks")
    .update({
      what_build: input.whatBuild?.trim() || null,
      why_this: input.whyThis?.trim() || null,
      who_for: input.whoFor?.trim() || null,
      first_step: input.firstStep?.trim() || null,
      status: submitting ? "submitted" : "draft",
      submitted_at: submitting ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) {
    console.error("[projectseed] brief failed:", error.message);
    return fail("บันทึกคำอธิบายไม่สำเร็จ");
  }

  revalidatePath(HUB_PATH);
  revalidatePath(`${HUB_PATH}/project`);
  return { ok: true };
}

/**
 * Step 4 — replaces the whole week in one RPC. Sending a diff would mean a
 * failed request could leave the grid half-applied, and the grid is small
 * enough (105 cells) that the whole-week payload is cheaper than that risk.
 */
export async function saveAvailability(
  slots: PseedSlot[]
): Promise<PseedActionResult> {
  const { supabase, user, participant } = await requireParticipant();
  if (!user) return fail("ต้องเข้าสู่ระบบก่อน");
  if (!participant) return fail("ยังไม่ได้เข้าร่วมรุ่นนี้");

  const clean = (slots ?? []).filter(
    (s) =>
      Number.isInteger(s.day) &&
      Number.isInteger(s.hour) &&
      s.day >= 0 &&
      s.day <= 6 &&
      s.hour >= 0 &&
      s.hour <= 23
  );

  const { error } = await supabase.rpc("pseed_set_availability", {
    p_participant_id: participant.id,
    p_slots: clean,
  });

  if (error) {
    console.error("[projectseed] availability failed:", error.message);
    return fail("บันทึกเวลาไม่สำเร็จ");
  }

  revalidatePath(HUB_PATH);
  revalidatePath(`${HUB_PATH}/schedule`);
  return { ok: true };
}
