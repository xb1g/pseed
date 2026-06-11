import Link from "next/link";
import {
  Video,
  Phone,
  Code2,
  Circle,
  PauseCircle,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata = {
  title: "Team Tasks — PassionSeed",
  description: "What each team is doing next, and exactly how.",
};

type TeamStatus = "active" | "queued" | "hold";

interface Task {
  label: string;
  status: TeamStatus;
  detail: string;
  steps?: string[];
}

interface Team {
  name: string;
  who: string;
  phase: string;
  mission: string;
  icon: LucideIcon;
  tasks: Task[];
}

const teams: Team[] = [
  {
    name: "Content Team",
    who: "Brother — on camera",
    phase: "Active · Week 1",
    mission:
      "Content is the only entry point that works. Students feel career anxiety as a feeling, not a search query — they won't come to a platform. You go to them through content they choose to watch. Turn one piece of Thai market data into a 60-second story Ting can't scroll past.",
    icon: Video,
    tasks: [
      {
        label: "Pull 1 data point that shocks Ting",
        status: "active",
        detail:
          "Find one public number that contradicts what schools tell students. Translate it for a 16-year-old — not \"healthcare FDI up 12%\" but \"hospitals are building AI that listens to a heartbeat, and the engineer who built it studied piano.\" This translation is the moat: anyone can make career videos, only you turn BOI / SCB EIC data into \"here's what Ting should actually do.\"",
        steps: [
          "Health-tech & Medical AI — BOI (boi.go.th) quarterly approvals, \"medical/health\" category + SCB EIC health PDFs. Insight: \"4 new AI-diagnostic projects approved last quarter, more than the prior 2 years combined. Starting pay ~80k/month.\"",
          "Games & Animation — depa (depa.or.th) Digital Content survey. Insight: \"Industry past 40 billion baht. A 'technical artist' draws the character AND codes its hair. Studios short on people who do both.\"",
          "Agri-tech & Food-tech — NIA (nia.or.th) + BOI agri approvals. Insight: \"Several times more investment than 5 years ago. Founders studied biology, not business — they build sensors that tell a farm when a plant is thirsty.\"",
        ],
      },
      {
        label: "Find the professional behind that data point",
        status: "active",
        detail:
          "One real Thai professional whose path would surprise Ting — combining an interest she's ruled out (piano, art, singing) with a job that pays. This delivers the core need: not information, but a believable human path forward. LinkedIn, alumni networks, or ask your network in that sector. Contact them. Ask for 15 minutes on camera.",
      },
      {
        label: "Film the first 60s video this week",
        status: "active",
        detail:
          "Brother on camera. Format = career story + believable path, OR market signal, OR employer perspective (\"I asked 3 Thai companies what they actually look for — not grades\"). It works because students trust a face and a voice (the smartmathpro model), not an institution. Film this week. Not next week.",
      },
      {
        label: "Publish → measure save rate",
        status: "active",
        detail:
          "Target save rate > 5%. Saves, not likes — a save means \"I want to come back to this,\" which is real intent. Likes are noise. This is the only Week-1 success metric that matters.",
      },
      {
        label: "Month 1 goal: 10 videos, 1,000 followers",
        status: "queued",
        detail:
          "Ten videos published, 1,000 followers, at least 3 students reaching out asking how to learn more, and at least one professional asking to be featured. This is the signal that Outreach can activate — it proves which career cluster students actually respond to.",
      },
    ],
  },
  {
    name: "Outreach Team",
    who: "One person with hustle + a phone",
    phase: "Activates Month 2",
    mission:
      "Intelligence → real access. Source the people who appear in the content and assemble the first cohort. Cannot start before content proves what sectors and careers students respond to — recruiting mentors blind wastes them.",
    icon: Phone,
    tasks: [
      {
        label: "Source the professionals featured in content",
        status: "queued",
        detail:
          "Find the people the content needs — the piano-major → hospital-AI engineer, the artist → game-dev technical artist. They are both the face of a video and a future mentor. One person, a phone, and persistence.",
      },
      {
        label: "Recruit the first mentor",
        status: "queued",
        detail:
          "One mentor, not a program. A Thai professional who fused an unexpected creative interest with a viable career and will run a 4-week cohort for free — in exchange for their story being told on the channel. The trade is exposure for time.",
      },
      {
        label: "Find the first 6 students",
        status: "queued",
        detail:
          "Six students, one grade level, one career cluster. Channels: post a form link after the first video lands, DM followers who engage, reach out to Assumption Bangrak directly, or ask Ting to bring 5 friends. Each fills a 4-question intake (what you make for fun / look-and-feel vs figure-out-why / camera comfort 1–5 / do you finish projects).",
      },
      {
        label: "Build a mentor pipeline for future cohorts",
        status: "queued",
        detail:
          "Once one cohort works, the bottleneck becomes mentors. Keep sourcing professionals across the responding sectors so Month 3+ cohorts never stall waiting for a human to say yes.",
      },
    ],
  },
  {
    name: "Product Team",
    who: "Dev team",
    phase: "Hold · until Month 3",
    mission:
      "Do not build the app yet. You cannot build the app before you know what a cohort actually needs. Run Month 2 manually first; build only what the manual flow proves it needs — otherwise you burn the dev team on features nobody uses.",
    icon: Code2,
    tasks: [
      {
        label: "HOLD — do not build the app",
        status: "hold",
        detail:
          "Run the first cohort entirely on Line (community + comms) + Google Meet (mentor calls) + Notion (brief, pair workspaces, reactions board). Six students, one grade, one cluster, 4 weeks: meet mentor → mini-project in pairs → present → reflect. No features needed. Learn what hurts before writing code.",
      },
      {
        label: "Cohort enrollment + peer matching",
        status: "queued",
        detail:
          "Month 3, only if the cohort works. Digitize the manual matching: pair complementary leans (creative + analytical), balance finishers (never two start-and-stoppers), keep friends in the same cohort but different pairs. Founder did this by hand in 10 minutes for 6 — the app earns this only at scale.",
      },
      {
        label: "Mini-project submission + mentor feedback flow",
        status: "queued",
        detail:
          "The brief: \"build one small thing a real person could open, and show one screenshot of one real human reacting to it.\" ~3–4 hours over 2 weeks. The app holds the artifact, the reaction evidence, and the mentor's feedback — replacing the Notion board.",
      },
      {
        label: "Reflection / decision tracking",
        status: "queued",
        detail:
          "Week 4 is \"would I do this for real?\" Capture the before/after path decision and the public one-sentence commitment each student made in Week 1. Reuse the ps_app PathLab reflection system — don't rebuild it.",
      },
      {
        label: "Market intelligence feed (v2)",
        status: "queued",
        detail:
          "Later. Surface the weekly translated insights (BOI / SCB EIC / depa / NIA) inside the app as a feed. v2 — not a Month-3 blocker.",
      },
    ],
  },
];

const statusStyles: Record<TeamStatus, string> = {
  active: "text-amber-300",
  queued: "text-white/30",
  hold: "text-rose-300/70",
};

function TaskRow({ task }: { task: Task }) {
  const Icon = task.status === "hold" ? PauseCircle : Circle;
  const dimmed = task.status === "queued";
  return (
    <li className="flex items-start gap-3 py-4">
      <Icon
        className={`mt-1 h-4 w-4 shrink-0 ${statusStyles[task.status]}`}
        strokeWidth={task.status === "active" ? 2.2 : 1.6}
      />
      <div className="flex flex-col gap-1.5">
        <span
          className={`text-sm font-medium ${
            dimmed ? "text-white/55" : "text-white"
          }`}
        >
          {task.label}
        </span>
        <p
          className={`text-sm leading-relaxed ${
            dimmed ? "text-white/40" : "text-white/65"
          }`}
        >
          {task.detail}
        </p>
        {task.steps && (
          <ul className="mt-1.5 flex flex-col gap-2 border-l border-amber-400/20 pl-4">
            {task.steps.map((step, i) => (
              <li
                key={i}
                className="text-[13px] leading-relaxed text-white/50"
              >
                {step}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function TeamCard({ team }: { team: Team }) {
  const Icon = team.icon;
  return (
    <article className="ei-card flex flex-col gap-5 p-7">
      <header className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">{team.name}</h2>
              <p className="text-xs text-white/40">{team.who}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-wide text-white/50">
            {team.phase}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-white/55">{team.mission}</p>
      </header>
      <ul className="flex flex-col divide-y divide-white/5">
        {team.tasks.map((task, i) => (
          <TaskRow key={i} task={task} />
        ))}
      </ul>
    </article>
  );
}

export default function TeamPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] px-6 py-16 text-white sm:py-24">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12 flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.2em] text-amber-300/70">
            Team Tasks
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">
            What each team does next.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-white/55">
            Three teams, phased activation. Content first, Outreach Month 2, app
            Month 3. Running all three at once before there is an audience is how
            startups die — so each team knows exactly when it turns on, and what
            it does the moment it does.
          </p>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-white/45">
            <span className="flex items-center gap-1.5">
              <Circle className="h-3 w-3 text-amber-300" strokeWidth={2.4} /> Do now
            </span>
            <span className="flex items-center gap-1.5">
              <Circle className="h-3 w-3 text-white/30" /> Queued
            </span>
            <span className="flex items-center gap-1.5">
              <PauseCircle className="h-3 w-3 text-rose-300/70" /> Hold
            </span>
          </div>
        </header>

        <div className="flex flex-col gap-6">
          {teams.map((team) => (
            <TeamCard key={team.name} team={team} />
          ))}
        </div>

        <footer className="mt-12 flex flex-col gap-4 border-t border-white/5 pt-8">
          <p className="text-sm leading-relaxed text-white/45">
            The assignment this week: pull one shocking data point, find the
            person behind it, film the video. Do not build the app. Do not design
            cohort flows. Do not write a business plan.
          </p>
          <Link
            href="/about"
            className="inline-flex w-fit items-center gap-2 text-sm text-amber-300 transition-colors hover:text-amber-200"
          >
            About PassionSeed
            <ArrowRight className="h-4 w-4" />
          </Link>
        </footer>
      </div>
    </main>
  );
}
