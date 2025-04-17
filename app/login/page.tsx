import { LoginForm } from "@/components/login-form"
import { MainNav } from "@/components/main-nav"
import { LavaFooter } from "@/components/lava-footer"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MainNav />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <LoginForm />
      </main>
      <LavaFooter />
    </div>
  )
}
