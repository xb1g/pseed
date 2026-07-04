import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CareerTestDashboard } from "@/components/careers/CareerTestDashboard";

export default async function CareersTestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/careers/test");
  }

  // Check admin
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .in("role", ["admin", "instructor"])
    .maybeSingle();

  if (!roleData) {
    redirect("/careers");
  }

  // Fetch test events
  const { data: events } = await supabase
    .from("view_test_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Career Views — Test Results</h1>
      <p className="text-muted-foreground mb-8">
        A/B testing: List View vs RPG View
      </p>
      <CareerTestDashboard events={events || []} />
    </div>
  );
}
