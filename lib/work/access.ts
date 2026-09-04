import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

const WORK_ROLES = ["admin", "passion-seed-team"] as const;

async function getWorkAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false as const, reason: "unauthorized" as const, supabase, user: null };
  }

  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", [...WORK_ROLES])
    .limit(1);

  if (roleError || !roles?.length) {
    return { ok: false as const, reason: "forbidden" as const, supabase, user };
  }

  return { ok: true as const, supabase, user };
}

export async function requireWorkAccess() {
  const access = await getWorkAccess();
  if (!access.ok && access.reason === "unauthorized") {
    redirect("/login");
  }
  if (!access.ok) {
    redirect("/me");
  }
  return access.user;
}

export async function requireWorkApiAccess() {
  const access = await getWorkAccess();
  if (!access.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: access.reason === "unauthorized" ? "Unauthorized" : "Forbidden" },
        { status: access.reason === "unauthorized" ? 401 : 403 }
      ),
    };
  }

  return {
    ok: true as const,
    value: { supabase: access.supabase, userId: access.user.id },
  };
}
