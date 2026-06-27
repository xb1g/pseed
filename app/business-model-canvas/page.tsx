import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  GraduationCap,
  Heart,
  LineChart,
  Network,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  Users,
} from "lucide-react";

export const metadata = {
  title: "Business Model Canvas | PassionSeed",
  description:
    "PassionSeed's Ikigai-based business model canvas for helping Thai high school students choose paths that are actually theirs.",
};

const canvasBlocks = [
  {
    title: "Customer Segments",
    confidence: "Medium",
    body: "Thai high school students first, parents as buyers, alumni in college and career stage later, and schools as a possible B2B channel.",
    icon: Users,
  },
  {
    title: "Value Proposition",
    confidence: "Medium-high",
    body: "Help students choose the best path for themselves through Ikigai: love, strengths, world demand, and financial sustainability.",
    icon: Compass,
  },
  {
    title: "Channels",
    confidence: "Medium",
    body: "Student social content, referrals, Radar sharing, parent LINE sharing, school workshops, and senior or mentor networks.",
    icon: Network,
  },
  {
    title: "Customer Relationships",
    confidence: "Medium-low",
    body: "A multi-year guided membership from high school planning into college, portfolio building, internships, and early career decisions.",
    icon: Heart,
  },
  {
    title: "Revenue Streams",
    confidence: "Low-medium",
    body: "Yearly subscription, discounted 3-year high school plan, and lifetime alumni membership for students who commit to the full journey.",
    icon: LineChart,
  },
  {
    title: "Key Resources",
    confidence: "Medium",
    body: "Career Radar data, Ikigai profile, PathLab activities, mentor network, student progress profile, and parent-shareable reports.",
    icon: Sprout,
  },
  {
    title: "Key Activities",
    confidence: "Medium",
    body: "Career research, content verification, product development, mentor sourcing, student guidance loops, and parent conversion tests.",
    icon: Target,
  },
  {
    title: "Key Partners",
    confidence: "Medium-low",
    body: "University students, recent graduates, working professionals, schools, parent communities, and admissions or career partners.",
    icon: BadgeCheck,
  },
  {
    title: "Cost Structure",
    confidence: "Medium",
    body: "Product, data, AI/API, content verification, mentor operations, marketing, support, and school or parent sales work.",
    icon: ShieldCheck,
  },
];

const ikigaiDimensions = [
  {
    label: "What students love",
    detail: "Reflection, interest signals, and energy patterns.",
  },
  {
    label: "What they are good at",
    detail: "Project outputs, feedback, strengths, and growth rate.",
  },
  {
    label: "What the world needs",
    detail: "Career Radar, labor-market shifts, and real demand.",
  },
  {
    label: "What can sustain them",
    detail: "Salary progression, requirements, and career ladders.",
  },
];

const membershipTiers = [
  {
    name: "Yearly Membership",
    promise: "One year of guided career and study-path planning.",
    details: ["Career Radar", "Ikigai profile", "Planning reports", "Parent summaries"],
  },
  {
    name: "3-Year High School Plan",
    promise: "Support through the full high school decision journey.",
    details: ["Lower renewal friction", "Portfolio roadmap", "PathLab access", "Alumni upgrade"],
  },
  {
    name: "Lifetime Alumni",
    promise: "Stay supported after graduation without promising unlimited 1:1 service.",
    details: ["Alumni profile", "Career updates", "Events/community", "Discounted add-ons"],
  },
];

const validationRisks = [
  "Parents must prove willingness to pay, not just interest.",
  "Students must return after first Radar exploration.",
  "Lifetime alumni benefits must stay low-marginal-cost.",
  "Career data needs source, date, level, and requirements to preserve trust.",
];

function ConfidenceBadge({ value }: { value: string }) {
  return (
    <span className="rounded-full border border-amber-200/25 bg-amber-200/10 px-2.5 py-1 text-[11px] font-medium text-amber-100">
      {value}
    </span>
  );
}

export default function BusinessModelCanvasPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <section className="relative min-h-[92svh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(254,217,92,0.26),transparent_28%),radial-gradient(circle_at_78%_14%,rgba(59,130,246,0.24),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#1e1b4b_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#020617] via-[#020617]/80 to-transparent" />
        <div className="absolute -right-28 top-24 h-[520px] w-[520px] rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -left-24 bottom-10 h-[420px] w-[420px] rounded-full bg-amber-200/10 blur-3xl" />

        <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold text-white">
            <Image
              src="/passionseed-logo.svg"
              alt="PassionSeed"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
            PassionSeed
          </Link>
          <Link
            href="/radar"
            className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white sm:inline-flex"
          >
            Open Radar
          </Link>
        </nav>

        <div className="relative z-10 mx-auto grid min-h-[calc(92svh-88px)] max-w-7xl items-center gap-12 px-5 pb-16 pt-8 md:grid-cols-[1.05fr_0.95fr] md:px-8">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100">
              <Sparkles className="h-3.5 w-3.5" />
              Business Model Canvas v0.1
            </p>
            <h1 className="max-w-4xl text-5xl font-bold leading-[0.95] tracking-normal text-white md:text-7xl">
              PassionSeed helps students choose a future that is actually theirs.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-200 md:text-lg">
              An Ikigai-based career planning membership for Thai high school students:
              grounded in real career data, self-knowledge, mentor context, and hands-on trials.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className="ei-button-dawn justify-center" href="#canvas">
                <span>View canvas</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#membership"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/85 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                Membership model
              </a>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[520px]">
            <div className="absolute inset-0 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm" />
            <div className="absolute inset-[12%] rounded-full border border-amber-100/25 bg-amber-100/10" />
            <div className="absolute inset-[28%] rounded-full border border-blue-200/25 bg-blue-200/10" />
            <div className="absolute inset-[39%] flex items-center justify-center rounded-full bg-white text-slate-950 shadow-2xl">
              <div className="text-center">
                <Compass className="mx-auto h-8 w-8 text-blue-600" />
                <p className="mt-2 text-sm font-bold">Ikigai OS</p>
              </div>
            </div>
            {ikigaiDimensions.map((item, index) => {
              const positions = [
                "left-1/2 top-4 -translate-x-1/2",
                "right-0 top-1/2 -translate-y-1/2",
                "bottom-4 left-1/2 -translate-x-1/2",
                "left-0 top-1/2 -translate-y-1/2",
              ];
              return (
                <div
                  key={item.label}
                  className={`absolute ${positions[index]} w-36 rounded-lg border border-white/15 bg-slate-950/75 p-3 text-center shadow-xl backdrop-blur-md md:w-44`}
                >
                  <p className="text-xs font-semibold text-white">{item.label}</p>
                  <p className="mt-1 hidden text-[11px] leading-4 text-slate-300 sm:block">
                    {item.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="canvas" className="relative mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-200">
            Canvas
          </p>
          <h2 className="mt-3 text-3xl font-bold md:text-5xl">Nine blocks, with confidence levels.</h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            The problem and product wedge have early evidence. Pricing, renewal behavior,
            and lifetime alumni economics still need validation.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {canvasBlocks.map((block) => (
            <article
              key={block.title}
              className="dawn-card rounded-lg border border-white/10 bg-white/[0.04] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                  <block.icon className="h-5 w-5 text-amber-200" />
                </div>
                <ConfidenceBadge value={block.confidence} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{block.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{block.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="membership" className="relative border-y border-white/10 bg-white/[0.03]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-[0.8fr_1.2fr] md:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-200">
              Revenue hypothesis
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-5xl">Membership first. Alumni for life.</h2>
            <p className="mt-5 text-base leading-7 text-slate-300">
              The yearly and 3-year model matches the decision journey. The 3-year plan
              can unlock lifetime alumni status, but lifetime benefits must stay scalable.
            </p>
          </div>

          <div className="grid gap-3">
            {membershipTiers.map((tier) => (
              <article
                key={tier.name}
                className="rounded-lg border border-white/10 bg-slate-950/55 p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{tier.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{tier.promise}</p>
                  </div>
                  <GraduationCap className="h-6 w-6 shrink-0 text-amber-200" />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {tier.details.map((detail) => (
                    <span
                      key={detail}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-200"
                    >
                      {detail}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 md:grid-cols-[1fr_0.9fr] md:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-200">
            Positioning
          </p>
          <h2 className="mt-3 text-3xl font-bold md:text-5xl">
            Not pressure. Not hype. A better way to choose.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            PassionSeed should help students resist peer pressure, parent anxiety, and
            low-quality social media by giving them evidence, self-knowledge, and practical trials.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h3 className="font-semibold text-white">What it is</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                A decision-confidence platform and Ikigai operating system for young people.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h3 className="font-semibold text-white">What it is not</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Not a personality quiz, job board, generic community, or blind passion machine.
              </p>
            </div>
          </div>
        </div>

        <aside className="rounded-lg border border-amber-200/20 bg-amber-200/10 p-6">
          <h3 className="text-xl font-semibold text-amber-50">Next proof needed</h3>
          <p className="mt-3 text-sm leading-6 text-amber-50/80">
            The next proof is payment behavior: show parents a sample report and ask
            for a deposit, paid pilot, or 3-year waitlist commitment.
          </p>
          <ul className="mt-6 space-y-3">
            {validationRisks.map((risk) => (
              <li key={risk} className="flex gap-3 text-sm leading-6 text-amber-50/85">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
