import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { HeroSection } from "@/components/hero-section";
import { FeatureSection } from "@/components/feature-section";
import { WorkshopCategories } from "@/components/workshop-categories";
import { CommunitySection } from "@/components/community-section";
import { Layout } from "@/components/layout";
import { DashboardHome } from "@/components/dashboard-home";

export default async function Home() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <Layout>
      {session ? (
        <DashboardHome user={session.user} />
      ) : (
        <>
          <HeroSection />
          <FeatureSection />
          <WorkshopCategories />
          <CommunitySection />
        </>
      )}
    </Layout>
  );
}
