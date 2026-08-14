import { createAdminClient } from "@/utils/supabase/admin";
import type {
  CreateStudentPlanInput,
  StudentPlan,
} from "@/types/student-plan";

function generatePlanToken(prefix = "p5"): string {
  const chars = "23456789abcdefghjkmnpqrstuvwxyz";
  let random = "";
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${random}`;
}

/**
 * Fetch a student plan by its public URL token.
 * Can be called from server components or public API endpoints.
 */
export async function getStudentPlanByToken(
  token: string
): Promise<StudentPlan | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("student_plans")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("Error fetching student plan by token:", error);
    return null;
  }

  return data as StudentPlan | null;
}

/**
 * Fetch all student plans linked to a DM conversation.
 */
export async function getStudentPlansByConversationId(
  conversationId: string
): Promise<StudentPlan[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("student_plans")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching student plans by conversation:", error);
    return [];
  }

  return (data || []) as StudentPlan[];
}

/**
 * Create a new student plan.
 */
export async function createStudentPlan(
  input: CreateStudentPlanInput
): Promise<StudentPlan> {
  const supabase = createAdminClient();
  // Prefer the draft token so QR codes already rendered on the poster keep
  // pointing at this exact plan; fall back to a fresh token otherwise.
  const token =
    input.token?.trim() ||
    generatePlanToken(
      input.grade_level ? input.grade_level.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "p" : "p"
    );

  const payload = {
    token,
    conversation_id: input.conversation_id || null,
    student_name: input.student_name,
    grade_level: input.grade_level,
    target_field: input.target_field,
    readiness_score: input.readiness_score ?? 2,
    ranked_priorities: input.ranked_priorities,
    timeline: input.timeline,
    step_one_action: input.step_one_action,
    parent_notes: input.parent_notes || null,
    custom_advice: input.custom_advice || null,
  };

  const { data, error } = await supabase
    .from("student_plans")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    console.error("Error inserting student plan:", error);
    throw new Error(`Failed to create student plan: ${error.message}`);
  }

  return data as StudentPlan;
}

/**
 * Increment a counter column via RPC, falling back to a read-then-write
 * increment if the function is not installed yet.
 */
async function incrementCounter(
  token: string,
  rpcName: "increment_plan_view" | "increment_plan_qr_scan",
  column: "view_count" | "qr_scan_count",
  timestampColumn: "last_viewed_at" | "last_qr_scanned_at"
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.rpc(rpcName, { plan_token: token });
  if (!error) return;

  const { data } = await supabase
    .from("student_plans")
    .select(column)
    .eq("token", token)
    .maybeSingle();

  if (!data) return;

  await supabase
    .from("student_plans")
    .update({
      [column]: ((data as Record<string, number>)[column] ?? 0) + 1,
      [timestampColumn]: new Date().toISOString(),
    })
    .eq("token", token);
}

/**
 * Increment view count on student plan.
 */
export async function incrementPlanViewCount(token: string): Promise<void> {
  await incrementCounter(token, "increment_plan_view", "view_count", "last_viewed_at");
}

/**
 * Record a poster QR scan for a student plan.
 */
export async function incrementPlanQrScan(token: string): Promise<void> {
  await incrementCounter(token, "increment_plan_qr_scan", "qr_scan_count", "last_qr_scanned_at");
}
