import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function BriefsTable({ briefs }: { briefs: ProjectBrief[] }) {
  if (briefs.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No project briefs yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[190px]">Received</TableHead>
          <TableHead className="w-[220px]">Contact</TableHead>
          <TableHead>Brief</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {briefs.map((brief) => (
          <TableRow key={brief.id}>
            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
              {formatDate(brief.created_at)}
            </TableCell>
            <TableCell className="font-medium break-all">{brief.contact}</TableCell>
            <TableCell className="whitespace-pre-wrap text-sm">{brief.brief}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SignupsTable({ signups }: { signups: TalentSignup[] }) {
  if (signups.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No student signups yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[170px]">Signed up</TableHead>
          <TableHead>Student</TableHead>
          <TableHead className="w-[120px]">Track</TableHead>
          <TableHead className="w-[200px]">Contact</TableHead>
          <TableHead>Tools & links</TableHead>
          <TableHead className="w-[150px]">Public</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {signups.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
              {formatDate(s.created_at)}
            </TableCell>
            <TableCell>
              <p className="font-medium">
                {s.nickname}{" "}
                <span className="font-normal text-muted-foreground">
                  · {s.full_name}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                {[s.age !== null ? `${s.age} yrs` : null, s.school]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{TRACK_LABEL[s.track] ?? s.track}</Badge>
            </TableCell>
            <TableCell className="text-sm break-all">
              {[s.line_id ? `LINE: ${s.line_id}` : null, s.phone]
                .filter(Boolean)
                .join(" · ") || "—"}
            </TableCell>
            <TableCell className="text-sm">
              {s.tools.length > 0 && <p>{s.tools.join(", ")}</p>}
              {s.portfolio_links.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block break-all text-xs text-primary hover:underline"
                >
                  {url}
                </a>
              ))}
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
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Project briefs (hirers)" value={briefs.length} />
        <StatCard label="Student signups" value={signups.length} />
        <StatCard label="Awaiting review" value={pending} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project briefs — hirer side</CardTitle>
          <p className="text-sm text-muted-foreground">
            Submissions from the &ldquo;Interest?&rdquo; form on /talent. Newest first.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <BriefsTable briefs={briefs} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student signups</CardTitle>
          <p className="text-sm text-muted-foreground">
            Hidden signups do not appear on the public page until published.
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <SignupsTable signups={signups} />
        </CardContent>
      </Card>
    </div>
  );
}
