import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { adminGetAllProducts } from "@/lib/hackathon/gallery";

function getAdminClient() {
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
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin");
  if (!roles || roles.length === 0) return null;
  return user;
}

async function getAnalytics() {
  const supabase = getAdminClient();

  // Gallery page views (unique sessions)
  const { count: galleryViews } = await supabase
    .from("hackathon_gallery_views")
    .select("*", { count: "exact", head: true })
    .eq("page", "gallery");

  // Product detail views per product
  const { data: productViews } = await supabase
    .from("hackathon_gallery_views")
    .select("product_id")
    .eq("page", "product");

  const viewsByProduct: Record<string, number> = {};
  for (const row of productViews ?? []) {
    if (row.product_id) {
      viewsByProduct[row.product_id] = (viewsByProduct[row.product_id] || 0) + 1;
    }
  }

  // Test/contact button clicks per product
  const { data: testClicks } = await supabase
    .from("hackathon_gallery_views")
    .select("product_id")
    .eq("page", "test_click");

  const testClicksByProduct: Record<string, number> = {};
  for (const row of testClicks ?? []) {
    if (row.product_id) {
      testClicksByProduct[row.product_id] = (testClicksByProduct[row.product_id] || 0) + 1;
    }
  }

  // Interest submissions per product
  const { data: interests } = await supabase
    .from("hackathon_gallery_interests")
    .select("product_id");

  const interestsByProduct: Record<string, number> = {};
  for (const row of interests ?? []) {
    if (row.product_id) {
      interestsByProduct[row.product_id] = (interestsByProduct[row.product_id] || 0) + 1;
    }
  }

  return { galleryViews: galleryViews ?? 0, viewsByProduct, testClicksByProduct, interestsByProduct };
}

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  try {
    const [products, analytics] = await Promise.all([
      adminGetAllProducts(),
      getAnalytics().catch(() => ({ galleryViews: 0, viewsByProduct: {}, interestsByProduct: {} })),
    ]);
    return NextResponse.json({ products, analytics });
  } catch (err) {
    console.error("[admin/gallery GET]", err);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
