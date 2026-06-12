import { redirect } from "next/navigation";
import { Suspense } from "react";
import { UserPortal } from "@/components/user-portal";
import { createClient } from "@/utils/supabase/server";
import { getUserDashboardData } from "@/lib/supabase/reflection";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dashboardData = await getUserDashboardData(supabase);

  const userName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const userAvatar = user.user_metadata?.avatar_url;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#05030a] via-[#080510] to-[#020104] relative overflow-hidden font-sans antialiased">
      {/* Gradient overlay for smooth transition */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[#020005]/95 z-0" />
      
      {/* Drifting Cloud Blobs - very subtle warm sunset colors */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-orange-950/5 blur-[120px] animate-cloud-slow z-0" style={{ animationDuration: '18s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-amber-950/4 blur-[110px] animate-cloud-slow z-0" style={{ animationDuration: '22s', animationDelay: '-5s' }} />

      <main className="relative z-10 flex-1">
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-10 max-w-7xl">
          {/* User Portal Content */}
          <UserPortal dashboardData={dashboardData} />
        </div>
      </main>
    </div>
  );
}
