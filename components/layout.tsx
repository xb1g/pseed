import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { LavaFooter } from "@/components/lava-footer";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

export async function Layout({ children }: LayoutProps) {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            {session ? (
              <UserNav user={session.user} />
            ) : (
              <>
                <Button asChild variant="ghost">
                  <a href="/login">Login</a>
                </Button>
                <Button asChild>
                  <a href="/signup">Sign Up</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <LavaFooter />
    </div>
  );
}
