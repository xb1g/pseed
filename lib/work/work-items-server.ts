import type { SupabaseClient } from "@supabase/supabase-js";

import type { WorkArea, WorkItem, WorkItemInput, WorkItemPatch } from "./work-items";

type WorkItemRow = {
  id: string;
  area: WorkItem["area"];
  kind: WorkItem["kind"];
  title: string;
  description: string;
  status: WorkItem["status"];
  funnel_stage: WorkItem["funnelStage"];
  channel: WorkItem["channel"];
  offer: WorkItem["offer"];
  owner_name: string;
  due_on: string | null;
  position: number;
  details: Record<string, string>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

function fromRow(row: WorkItemRow): WorkItem {
  return {
    id: row.id,
    area: row.area,
    kind: row.kind,
    title: row.title,
    description: row.description,
    status: row.status,
    funnelStage: row.funnel_stage,
    channel: row.channel,
    offer: row.offer,
    ownerName: row.owner_name,
    dueOn: row.due_on,
    position: row.position,
    details: row.details ?? {},
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toRow(input: Partial<WorkItemInput>) {
  return {
    ...(input.area !== undefined && { area: input.area }),
    ...(input.kind !== undefined && { kind: input.kind }),
    ...(input.title !== undefined && { title: input.title }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.funnelStage !== undefined && { funnel_stage: input.funnelStage }),
    ...(input.channel !== undefined && { channel: input.channel }),
    ...(input.offer !== undefined && { offer: input.offer }),
    ...(input.ownerName !== undefined && { owner_name: input.ownerName }),
    ...(input.dueOn !== undefined && { due_on: input.dueOn }),
    ...(input.position !== undefined && { position: input.position }),
    ...(input.details !== undefined && { details: input.details }),
  };
}

export async function listWorkItems(supabase: SupabaseClient, area: WorkArea) {
  const { data, error } = await supabase
    .from("work_items")
    .select("*")
    .eq("area", area)
    .neq("status", "archived")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return { items: (data as WorkItemRow[] | null)?.map(fromRow) ?? [], error };
}

export async function createWorkItem(
  supabase: SupabaseClient,
  userId: string,
  input: WorkItemInput
) {
  const { data, error } = await supabase
    .from("work_items")
    .insert({ ...toRow(input), created_by: userId })
    .select("*")
    .single();

  return { item: data ? fromRow(data as WorkItemRow) : null, error };
}

export async function updateWorkItem(supabase: SupabaseClient, patch: WorkItemPatch) {
  const { id, ...changes } = patch;
  const { data, error } = await supabase
    .from("work_items")
    .update(toRow(changes))
    .eq("id", id)
    .select("*")
    .single();

  return { item: data ? fromRow(data as WorkItemRow) : null, error };
}
