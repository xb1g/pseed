"use server";

import { createClient } from "@/utils/supabase/server";
import { safeExternalUrl } from "@/lib/talent-url";

export interface TalentFormState {
  ok: boolean;
  error: string | null;
}

const TRACKS = ["dev", "video", "strategy", "design"] as const;

function splitList(value: FormDataEntryValue | null, max: number): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function text(value: FormDataEntryValue | null, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function submitTalentProfile(
  _prev: TalentFormState,
  formData: FormData,
): Promise<TalentFormState> {
  const full_name = text(formData.get("full_name"), 120);
  const nickname = text(formData.get("nickname"), 60);
  const school = text(formData.get("school"), 120);
  const line_id = text(formData.get("line_id"), 60);
  const track = text(formData.get("track"), 20);
  const tools = splitList(formData.get("tools"), 10);

  // This form inserts as anon, so treat every link as hostile: drop anything
  // that is not http(s) before it reaches the table.
  const portfolio_links = splitList(formData.get("portfolio_links"), 5)
    .map((link) => safeExternalUrl(link))
    .filter((link): link is string => link !== null);

  const ageRaw = text(formData.get("age"), 3);
  const age = ageRaw === "" ? null : Number(ageRaw);

  if (!full_name || !nickname || !track) {
    return { ok: false, error: "กรุณากรอกชื่อ ชื่อเล่น และสายงาน" };
  }
  if (!TRACKS.includes(track as (typeof TRACKS)[number])) {
    return { ok: false, error: "สายงานไม่ถูกต้อง" };
  }
  if (age !== null && (!Number.isInteger(age) || age < 10 || age > 100)) {
    return { ok: false, error: "อายุไม่ถูกต้อง" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("talent_profiles").insert({
      full_name,
      nickname,
      age,
      school: school || null,
      line_id: line_id || null,
      track,
      tools,
      portfolio_links,
      verified: false,
    });

    if (error) {
      console.error("submitTalentProfile failed:", error.message);
      if (error.code === "23505") {
        return { ok: false, error: "โปรไฟล์นี้ถูกส่งไว้แล้ว" };
      }
      return { ok: false, error: "ส่งโปรไฟล์ไม่สำเร็จ ลองอีกครั้ง" };
    }

    return { ok: true, error: null };
  } catch (error) {
    console.error("submitTalentProfile failed:", error);
    return { ok: false, error: "ส่งโปรไฟล์ไม่สำเร็จ ลองอีกครั้ง" };
  }
}

export async function submitProjectBrief(
  _prev: TalentFormState,
  formData: FormData,
): Promise<TalentFormState> {
  const contact = text(formData.get("contact"), 120);
  const brief = text(formData.get("brief"), 2000);

  if (!contact || !brief) {
    return { ok: false, error: "กรุณากรอกช่องทางติดต่อและรายละเอียดโปรเจกต์" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("talent_project_briefs")
      .insert({ contact, brief });

    if (error) {
      console.error("submitProjectBrief failed:", error.message);
      return { ok: false, error: "ส่งโปรเจกต์ไม่สำเร็จ ลองอีกครั้ง" };
    }

    return { ok: true, error: null };
  } catch (error) {
    console.error("submitProjectBrief failed:", error);
    return { ok: false, error: "ส่งโปรเจกต์ไม่สำเร็จ ลองอีกครั้ง" };
  }
}
