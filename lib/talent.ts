import { createClient } from "@/utils/supabase/server";

export interface TalentProfile {
  id: string;
  full_name: string;
  nickname: string;
  age: number | null;
  school: string | null;
  track: "dev" | "video" | "strategy" | "design";
  tools: string[];
  portfolio_links: string[];
  verified: boolean;
}

export async function getTalentProfiles(): Promise<TalentProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_profiles")
    .select("id, full_name, nickname, age, school, track, tools, portfolio_links, verified")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch talent profiles:", error.message);
    return [];
  }

  return (data ?? []) as TalentProfile[];
}
