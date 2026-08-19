import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TalentVerifyToggle } from "@/components/admin/TalentVerifyToggle";
import {
  getProjectBriefs,
  getTalentSignups,
  type ProjectBrief,
  type TalentSignup,
} from "@/lib/talent-admin";
import { TRACK_LABEL } from "@/lib/talent-work";
import { safeExternalUrl } from "@/lib/talent-url";
import { DawnScene } from "@/components/projectseed/dawn-scene";
import { StatTile } from "./_components/Stats";
import { Panel } from "./_components/Panel";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BriefsTable({ briefs }: { briefs: ProjectBrief[] }) {
  if (briefs.length === 0) {
    return (
      <p className="px-6 py-12 text-center text-sm text-stone-400">
        ยังไม่มีคนทักทายเข้ามาเลย — พอมีใครส่ง Interest? มา จะโผล่ที่นี่นะ
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/5 hover:bg-transparent">
          <TableHead className="w-[190px] text-stone-400">Received</TableHead>
          <TableHead className="w-[220px] text-stone-400">Contact</TableHead>
          <TableHead className="text-stone-400">Brief</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {briefs.map((brief) => (
          <TableRow key={brief.id} className="border-white/5">
            <TableCell className="whitespace-nowrap text-sm text-stone-400">
              {formatDate(brief.created_at)}
            </TableCell>
            <TableCell className="break-all font-medium text-white">
              {brief.contact}
            </TableCell>
            <TableCell className="whitespace-pre-wrap text-sm text-stone-300">
              {brief.brief}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SignupsTable({ signups }: { signups: TalentSignup[] }) {
  if (signups.length === 0) {
    return (
      <p className="px-6 py-12 text-center text-sm text-stone-400">
        ยังไม่มีนักเรียนสมัครเข้ามา — พอมีคนกรอกฟอร์ม จะโผล่ที่นี่นะ
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/5 hover:bg-transparent">
          <TableHead className="w-[170px] text-stone-400">Signed up</TableHead>
          <TableHead className="text-stone-400">Student</TableHead>
          <TableHead className="w-[120px] text-stone-400">Track</TableHead>
          <TableHead className="w-[200px] text-stone-400">Contact</TableHead>
          <TableHead className="text-stone-400">Tools & links</TableHead>
          <TableHead className="w-[170px] text-stone-400">Public</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {signups.map((s) => (
          <TableRow
            key={s.id}
            className="border-white/5"
            data-verified={s.verified || undefined}
          >
            <TableCell className="whitespace-nowrap text-sm text-stone-400">
              {formatDate(s.created_at)}
            </TableCell>
            <TableCell>
              <p className="font-medium text-white">
                {s.nickname}{" "}
                <span className="font-normal text-stone-400">
                  · {s.full_name}
                </span>
              </p>
              <p className="text-xs text-stone-500">
                {[s.age !== null ? `${s.age} yrs` : null, s.school]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{TRACK_LABEL[s.track] ?? s.track}</Badge>
            </TableCell>
            <TableCell className="break-all text-sm text-stone-300">
              {[s.line_id ? `LINE: ${s.line_id}` : null, s.phone]
                .filter(Boolean)
                .join(" · ") || "—"}
            </TableCell>
            <TableCell className="text-sm">
              {s.tools.length > 0 && (
                <p className="text-stone-300">{s.tools.join(", ")}</p>
              )}
              {s.portfolio_links.map((url) => {
                const safe = safeExternalUrl(url);

                // Never linkify a scheme we did not vet — show it as inert
                // text so the row still reveals what was submitted.
                if (!safe) {
                  return (
                    <p
                      key={url}
                      className="block break-all text-xs text-destructive"
                      title="Blocked: not an http(s) URL"
                    >
                      ⚠ {url}
                    </p>
                  );
                }

                return (
                  <a
                    key={url}
                    href={safe}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block break-all text-xs text-[#fed95c] hover:underline"
                  >
                    {url}
                  </a>
                );
              })}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge variant={s.verified ? "default" : "outline"}>
                  {s.verified ? "Live" : "Hidden"}
                </Badge>
                <TalentVerifyToggle id={s.id} verified={s.verified} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function AdminTalentPage() {
  const [briefs, signups] = await Promise.all([
    getProjectBriefs(),
    getTalentSignups(),
  ]);

  const pending = signups.filter((s) => !s.verified).length;

  return (
    <div className="dawn-theme relative min-h-screen overflow-hidden">
      <DawnScene />

      <div className="relative z-10 mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero — one gold keynote statement for the page, per design system. */}
        <header className="space-y-4">
          <p className="dawn-eyebrow">Talent Ops</p>
          <div className="dawn-keynote space-y-3 px-5 py-5">
            <h1 className="font-kodchasan text-3xl font-semibold text-white sm:text-4xl">
              นักเรียนที่พร้อมเป็นที่รู้จัก
            </h1>
            <p className="max-w-2xl text-sm text-stone-300">
              รีวิวงานที่ส่งมาจากฟอร์ม <span className="text-stone-200">/talent</span>{" "}
              แล้วเปิดให้คนภายนอกเห็นเมื่อพร้อม
            </p>
          </div>
          <div className="dawn-rule" aria-hidden="true" />
        </header>

        {/* Stat row — three glass tiles, pending one gets the gold pulse. */}
        <section
          aria-label="Talent funnel summary"
          className="grid gap-4 sm:grid-cols-3"
        >
          <StatTile label="Project briefs (hirers)" value={briefs.length} />
          <StatTile label="Student signups" value={signups.length} />
          <StatTile
            label="Awaiting review"
            value={pending}
            emphasis={pending > 0}
          />
        </section>

        <Panel
          eyebrow="Hirer side"
          title="Project briefs"
          description="Submissions from the “Interest?” form on /talent. Newest first."
        >
          <BriefsTable briefs={briefs} />
        </Panel>

        <Panel
          eyebrow="Student side"
          title="Signups"
          description="Hidden signups do not appear on the public page until published."
        >
          <SignupsTable signups={signups} />
        </Panel>
      </div>
    </div>
  );
}
