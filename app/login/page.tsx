import { LoginForm } from "@/components/login-form";
import { isAnonymousUser } from "@/lib/supabase/auth";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params?.next?.startsWith("/") ? params.next : "/";
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user && !isAnonymousUser(data.user)) {
    // Check if profile is complete before redirecting
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, username, date_of_birth")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profileData?.full_name || !profileData?.username || !profileData?.date_of_birth) {
      // Profile incomplete, redirect to finish profile
      redirect(`/auth/finish-profile?next=${encodeURIComponent(next)}`);
    }

    redirect(next);
  }

  return (
    <div className="flex-1 flex items-center justify-center my-10">
      <LoginForm next={next} />
    </div>
  );
}
