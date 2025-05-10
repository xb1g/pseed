import { HeroSection } from "@/components/hero-section";
import { FeatureSection } from "@/components/feature-section";
import { WorkshopCategories } from "@/components/workshop-categories";
import { CommunitySection } from "@/components/community-section";
import { Layout } from "@/components/layout";
import { DashboardHome } from "@/components/dashboard-home";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function Home() {
  const user = await getAuthenticatedUser();

  return (
    <Layout>
      {user ? (
        <DashboardHome user={user} />
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
