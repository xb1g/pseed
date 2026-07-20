import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/admin/requireAdmin";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { TrialReviewActions } from "@/components/admin/TrialReviewActions";

export const dynamic = "force-dynamic";

const SLIP_URL_TTL_SECONDS = 300;
const RECENT_LIMIT = 50;

interface AdminTrialRow {
  id: string;
  user_id: string;
  seed_id: string;
  status: string;
  price_amount: number;
  started_at: string;
  payment_deadline: string;
  slip_path: string | null;
  paid_at: string | null;
  admin_note: string | null;
  seed: { title: string } | { title: string }[] | null;
}

interface AdminTrialView extends Omit<AdminTrialRow, "seed"> {
  seedTitle: string | null;
  slipUrl: string | null;
}

const TRIAL_SELECT =
  "id, user_id, seed_id, status, price_amount, started_at, payment_deadline, slip_path, paid_at, admin_note, seed:seeds!seed_id(title)";

function formatTs(value: string | null): string {
  if (!value) return "—";
  return format(new Date(value), "MMM d, yyyy HH:mm");
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400">
          pending
        </Badge>
      );
    case "paid":
      return (
        <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">
          paid
        </Badge>
      );
    case "active":
      return (
        <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400">
          active
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground">
          {status}
        </Badge>
      );
  }
}

async function loadTrials(): Promise<{ trials: AdminTrialView[]; error: string | null }> {
  try {
    // RLS limits trial_accesses reads to the owner's rows; the admin queue
    // must go through the service role.
    const service = createServiceRoleClient();

    const [pendingResult, recentResult] = await Promise.all([
      service
        .from("trial_accesses")
        .select(TRIAL_SELECT)
        .eq("status", "pending")
        .order("started_at", { ascending: false }),
      service
        .from("trial_accesses")
        .select(TRIAL_SELECT)
        .neq("status", "pending")
        .order("started_at", { ascending: false })
        .limit(RECENT_LIMIT),
    ]);

    if (pendingResult.error) throw pendingResult.error;
    if (recentResult.error) throw recentResult.error;

    // Pending first, then newest
    const rows = [
      ...((pendingResult.data ?? []) as unknown as AdminTrialRow[]),
      ...((recentResult.data ?? []) as unknown as AdminTrialRow[]),
    ];

    const trials = await Promise.all(
      rows.map(async (row) => {
        let slipUrl: string | null = null;
        if (row.slip_path) {
          const { data: signed } = await service.storage
            .from("trial-slips")
            .createSignedUrl(row.slip_path, SLIP_URL_TTL_SECONDS);
          slipUrl = signed?.signedUrl ?? null;
        }

        const seedTitle = Array.isArray(row.seed)
          ? row.seed[0]?.title ?? null
          : row.seed?.title ?? null;

        return { ...row, seedTitle, slipUrl };
      })
    );

    return { trials, error: null };
  } catch (error) {
    console.error("[admin/trials] failed to load trials", error);
    return { trials: [], error: "Failed to load trials. Is the trial_accesses migration applied?" };
  }
}

export default async function AdminTrialsPage() {
  await requireAdmin();

  const { trials, error } = await loadTrials();

  return (
    <div className="space-y-2">
      <div>
        <h2 className="text-2xl font-semibold">PathLab Trial Payments</h2>
        <p className="text-sm text-muted-foreground">
          Review uploaded payment slips and approve or reject trial access.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {!error && trials.length === 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
          No trials to review.
        </div>
      )}

      <div className="space-y-3">
        {trials.map((trial) => (
          <div
            key={trial.id}
            className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-start"
          >
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">
                  {trial.seedTitle ?? "Unknown seed"}
                </span>
                <StatusBadge status={trial.status} />
                <span className="text-sm text-muted-foreground">
                  ฿{trial.price_amount.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Student: <span className="font-mono">{trial.user_id.slice(0, 8)}</span>
                {" · "}Started: {formatTs(trial.started_at)}
                {" · "}Deadline: {formatTs(trial.payment_deadline)}
                {trial.paid_at && <>{" · "}Paid: {formatTs(trial.paid_at)}</>}
              </p>
              {trial.admin_note && (
                <p className="text-sm text-muted-foreground">
                  Note: {trial.admin_note}
                </p>
              )}
            </div>

            <div className="flex items-start gap-4">
              {trial.slipUrl ? (
                <a
                  href={trial.slipUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block shrink-0"
                  title="View full slip"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={trial.slipUrl}
                    alt="Payment slip"
                    className="h-20 w-20 rounded-md border border-border object-cover"
                    referrerPolicy="no-referrer"
                  />
                </a>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-dashed border-border text-[10px] text-muted-foreground">
                  No slip
                </div>
              )}

              {trial.status === "pending" && (
                <TrialReviewActions trialId={trial.id} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
