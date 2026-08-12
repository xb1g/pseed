import { LandingPageWrapper } from "@/components/landing-page-wrapper";
import { isAnonymousUser } from "@/lib/supabase/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect, unstable_rethrow } from "next/navigation";
import {
  isProfileComplete,
  PROFILE_COMPLETION_SELECT,
} from "@/lib/profile-completion";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAnonymous = isAnonymousUser(user);

    if (user && isAnonymous) {
      const { data: anonProfile } = await supabase
        .from("profiles")
        .select("is_onboarded")
        .eq("id", user.id)
        .maybeSingle();

      if (anonProfile?.is_onboarded) {
        redirect("/me");
      }

      redirect("/onboard");
    }

    if (user && !isAnonymous) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`${PROFILE_COMPLETION_SELECT}, is_onboarded`)
        .eq("id", user.id)
        .single();
      const { data: guardianConsent } = await supabase
        .from("profile_guardian_consents")
        .select("guardian_phone, guardian_relationship, consent_confirmed_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (
        profileError ||
        !isProfileComplete(profileData, guardianConsent) ||
        !profileData.is_onboarded
      ) {
        redirect("/onboard");
      }

      redirect("/me");
    }
  } catch (error) {
    // redirect() throws a framework control-flow error. Preserve it instead of
    // treating a successful auth redirect as a failed Supabase request.
    unstable_rethrow(error);
    // Supabase unreachable or auth error — show landing page
  }

  return <LandingPageWrapper />;
}
