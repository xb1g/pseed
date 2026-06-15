import { createClient } from "@supabase/supabase-js";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type GalleryProduct = {
  id: string;
  team_id: string;
  product_name: string;
  problem_statement: string;
  solution_description: string;
  cover_image_url: string | null;
  additional_images: string[];
  demo_url: string | null;
  line_qr_url: string | null;
  tags: string[];
  hackathon_year: number;
  hackathon_name: string;
  interest_count: number;
  created_at: string;
  team: {
    name: string;
    members: { name: string }[];
  } | null;
};

export type GalleryProductSummary = Pick<
  GalleryProduct,
  | "id"
  | "team_id"
  | "product_name"
  | "problem_statement"
  | "cover_image_url"
  | "tags"
  | "hackathon_year"
  | "hackathon_name"
  | "interest_count"
> & { team_name: string };

export async function getGalleryProducts(): Promise<GalleryProductSummary[]> {
  const { data, error } = await getClient()
    .from("hackathon_gallery_products")
    .select(`
      id,
      team_id,
      product_name,
      problem_statement,
      cover_image_url,
      tags,
      hackathon_year,
      hackathon_name,
      interest_count,
      hackathon_teams!inner ( name )
    `)
    .eq("is_published", true)
    .order("interest_count", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    team_id: row.team_id,
    product_name: row.product_name,
    problem_statement: row.problem_statement,
    cover_image_url: row.cover_image_url,
    tags: row.tags,
    hackathon_year: row.hackathon_year,
    hackathon_name: row.hackathon_name,
    interest_count: row.interest_count,
    team_name: row.hackathon_teams?.name ?? "",
  }));
}

export async function getGalleryProduct(teamId: string): Promise<GalleryProduct | null> {
  const { data, error } = await getClient()
    .from("hackathon_gallery_products")
    .select(`
      *,
      hackathon_teams!inner (
        name,
        hackathon_team_members (
          hackathon_participants ( name )
        )
      )
    `)
    .eq("team_id", teamId)
    .eq("is_published", true)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    team_id: data.team_id,
    product_name: data.product_name,
    problem_statement: data.problem_statement,
    solution_description: data.solution_description,
    cover_image_url: data.cover_image_url,
    additional_images: data.additional_images ?? [],
    demo_url: data.demo_url,
    line_qr_url: data.line_qr_url ?? null,
    tags: data.tags,
    hackathon_year: data.hackathon_year,
    hackathon_name: data.hackathon_name,
    interest_count: data.interest_count,
    created_at: data.created_at,
    team: {
      name: data.hackathon_teams.name,
      members: (data.hackathon_teams.hackathon_team_members ?? []).map(
        (m: any) => ({ name: m.hackathon_participants?.name ?? "" })
      ),
    },
  };
}

export async function submitGalleryInterest(params: {
  productId: string;
  name: string;
  email: string;
  message: string;
}): Promise<{ error: string | null }> {
  const { error } = await getClient()
    .from("hackathon_gallery_interests")
    .insert({
      product_id: params.productId,
      name: params.name.trim(),
      email: params.email.trim().toLowerCase(),
      message: params.message.trim() || null,
    });

  if (error) return { error: error.message };
  return { error: null };
}

export function getAllTags(products: GalleryProductSummary[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    for (const t of p.tags) set.add(t);
  }
  return Array.from(set).sort();
}

export const ALLOWED_TAGS = [
  "Health", "Mental Health", "Education", "Productivity", "Community",
  "Elderly Care", "Disability", "Nutrition", "Fitness", "Research",
  "Diagnosis", "Telemedicine", "Other",
] as const;

export type GalleryProductInput = {
  product_name: string;
  problem_statement: string;
  solution_description: string;
  tags: string[];
  demo_url?: string | null;
  cover_image_url?: string | null;
  additional_images?: string[];
  line_qr_url?: string | null;
};

export type GalleryProductWithPublished = GalleryProduct & { is_published: boolean };

/** Fetch team's own product regardless of publish state (uses service role) */
export async function getMyGalleryProduct(teamId: string): Promise<GalleryProductWithPublished | null> {
  const { data, error } = await getAdminClient()
    .from("hackathon_gallery_products")
    .select(`
      *,
      hackathon_teams!inner (
        name,
        hackathon_team_members (
          hackathon_participants ( name )
        )
      )
    `)
    .eq("team_id", teamId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    team_id: data.team_id,
    product_name: data.product_name,
    problem_statement: data.problem_statement,
    solution_description: data.solution_description,
    cover_image_url: data.cover_image_url,
    additional_images: data.additional_images ?? [],
    demo_url: data.demo_url,
    line_qr_url: data.line_qr_url ?? null,
    tags: data.tags,
    hackathon_year: data.hackathon_year,
    hackathon_name: data.hackathon_name,
    interest_count: data.interest_count,
    created_at: data.created_at,
    is_published: data.is_published,
    team: {
      name: data.hackathon_teams.name,
      members: (data.hackathon_teams.hackathon_team_members ?? []).map(
        (m: any) => ({ name: m.hackathon_participants?.name ?? "" })
      ),
    },
  };
}

/** Upsert (insert or update) a team's gallery product. is_published stays untouched on update. */
export async function upsertGalleryProduct(
  teamId: string,
  data: GalleryProductInput
): Promise<GalleryProductWithPublished> {
  const admin = getAdminClient();

  const payload = {
    team_id: teamId,
    product_name: data.product_name,
    problem_statement: data.problem_statement,
    solution_description: data.solution_description,
    tags: data.tags,
    demo_url: data.demo_url ?? null,
    cover_image_url: data.cover_image_url ?? null,
    additional_images: data.additional_images ?? [],
    line_qr_url: data.line_qr_url ?? null,
    hackathon_year: new Date().getFullYear(),
    hackathon_name: "PassionSeed Hackathon",
  };

  const { data: row, error } = await admin
    .from("hackathon_gallery_products")
    .upsert(payload, { onConflict: "team_id", ignoreDuplicates: false })
    .select()
    .single();

  if (error || !row) throw new Error(error?.message ?? "Failed to upsert gallery product");

  return {
    id: row.id,
    team_id: row.team_id,
    product_name: row.product_name,
    problem_statement: row.problem_statement,
    solution_description: row.solution_description,
    cover_image_url: row.cover_image_url,
    additional_images: row.additional_images ?? [],
    demo_url: row.demo_url,
    line_qr_url: row.line_qr_url ?? null,
    tags: row.tags,
    hackathon_year: row.hackathon_year,
    hackathon_name: row.hackathon_name,
    interest_count: row.interest_count ?? 0,
    created_at: row.created_at,
    is_published: row.is_published,
    team: null,
  };
}

/** Admin: list all products regardless of publish state */
export async function adminGetAllProducts(): Promise<(GalleryProductWithPublished & { team_name: string })[]> {
  const { data, error } = await getAdminClient()
    .from("hackathon_gallery_products")
    .select(`
      *,
      hackathon_teams!inner ( name )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    team_id: row.team_id,
    product_name: row.product_name,
    problem_statement: row.problem_statement,
    solution_description: row.solution_description,
    cover_image_url: row.cover_image_url,
    additional_images: row.additional_images ?? [],
    demo_url: row.demo_url,
    line_qr_url: row.line_qr_url ?? null,
    tags: row.tags,
    hackathon_year: row.hackathon_year,
    hackathon_name: row.hackathon_name,
    interest_count: row.interest_count ?? 0,
    created_at: row.created_at,
    is_published: row.is_published,
    team_name: row.hackathon_teams?.name ?? "",
    team: null,
  }));
}

/** Admin: set published state for a product */
export async function adminSetPublished(productId: string, published: boolean): Promise<void> {
  const { error } = await getAdminClient()
    .from("hackathon_gallery_products")
    .update({ is_published: published })
    .eq("id", productId);

  if (error) throw error;
}
