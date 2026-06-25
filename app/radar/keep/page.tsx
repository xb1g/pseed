import Link from "next/link";
import { ArrowLeft, ArrowRight, Compass, Lock, Route, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const promises = [
  {
    icon: Compass,
    title: "Your answers become a compass",
    body: "We keep the fields you leaned toward, the ones you skipped, and the reasons you gave so the next visit starts smarter.",
  },
  {
    icon: Route,
    title: "You get concrete next steps",
    body: "Career Radar can turn interest signals into maps, workshops, projects, and people to learn from instead of another generic list.",
  },
  {
    icon: Sparkles,
    title: "The experience keeps adapting",
    body: "As you explore more fields, your profile gets clearer. PassionSeed can show better paths for your goals, not everyone else's.",
  },
  {
    icon: Lock,
    title: "No pressure",
    body: "Anonymous exploration still works. Signing up only makes your Radar durable across devices and future sessions.",
  },
];

export const dynamic = "force-dynamic";

export default async function KeepRadarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const returnTo = next?.startsWith("/radar/") ? next : "/radar";
  const loginHref = `/login?next=${encodeURIComponent(returnTo)}`;

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#020617_0%,#0f172a_46%,#111827_100%)] text-white">
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <Link
          href={returnTo}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Radar
        </Link>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:py-16">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-blue-200/80">
              Keep your Career Radar
            </p>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Save the signal before it turns back into noise.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-300 sm:text-lg">
              The useful part is not one answer. It is the pattern across what
              feels exciting, what feels wrong, and what you want to try next.
              An account keeps that pattern alive.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 bg-white px-6 font-semibold text-neutral-950 hover:bg-blue-100">
                <Link href={loginHref}>
                  Save my Radar <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 border-white/15 bg-white/5 px-6 font-semibold text-white hover:bg-white/10"
              >
                <Link href={returnTo}>Keep exploring anonymously</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            {promises.map((promise) => {
              const Icon = promise.icon;
              return (
                <div
                  key={promise.title}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-xl backdrop-blur"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-400/15 text-blue-200">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-white">
                        {promise.title}
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-neutral-400">
                        {promise.body}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
