import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { REFERRAL_CODE_PATTERN } from "@/lib/techseed/referral";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") ?? "";

  // Referral codes are 8 chars from an unambiguous alphabet — reject anything else
  if (!REFERRAL_CODE_PATTERN.test(code)) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("techseed_signups")
    .select("referral_count, price_final")
    .eq("referral_code", code)
    .maybeSingle();

  if (error) {
    console.error("Error fetching TechSeed price:", error);
    return NextResponse.json(
      { error: "Failed to fetch price" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Unknown code" }, { status: 404 });
  }

  return NextResponse.json({
    referral_count: data.referral_count,
    price_final: data.price_final,
  });
}
