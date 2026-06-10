"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface BuildTodo {
  id: string;
  user_id: string;
  title: string;
  is_done: boolean;
  due_date: string;
  created_at: string;
}

export async function getBuildTodos(): Promise<BuildTodo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("build_todos")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createBuildTodo(
  title: string,
  due_date?: string
): Promise<BuildTodo> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("build_todos")
    .insert({
      user_id: user.id,
      title,
      due_date: due_date ?? new Date().toISOString().split("T")[0],
    })
    .select()
    .single();
  if (error) throw error;
  revalidatePath("/build");
  return data;
}

export async function updateBuildTodo(
  id: string,
  patch: Partial<Pick<BuildTodo, "title" | "is_done" | "due_date">>
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("build_todos")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/build");
}

export async function deleteBuildTodo(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("build_todos")
    .delete()
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/build");
}
