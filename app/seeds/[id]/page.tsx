import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CreateRoomButton } from "@/components/seeds/CreateRoomButton";
import { SeedSettingsButton } from "@/components/seeds/SeedSettingsButton";
import { SeedAbout } from "@/components/seeds/SeedAbout";
import { SeedDayArc, type SeedDayArcItem } from "@/components/seeds/SeedDayArc";
import { InViewAnimator } from "@/components/ui/in-view-animator";
import { markdownToSafeHtml } from "@/lib/security/sanitize-html";
import { BeginPathButton } from "@/components/pathlab/BeginPathButton";
import { TrialGate } from "@/components/trials/TrialGate";
import { hasTrialAccess, resolveTrialStatus } from "@/lib/trials/status";

interface SeedDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SeedDetailPage({ params }: SeedDetailPageProps) {
  const { id } = await params;
  console.log("[SeedPage] Loading seed id:", id);
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) console.error("[SeedPage] Auth error:", authError.message);
  console.log("[SeedPage] User:", user?.id ?? "anonymous");

  // Check if user is admin
  let isAdmin = false;
  if (user) {
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (rolesError) console.error("[SeedPage] user_roles error:", rolesError.message, rolesError.code);
    isAdmin = roles?.some((r) => r.role === "admin") || false;
    console.log("[SeedPage] User ID:", user.id, "| is admin:", isAdmin);
  }

  // Fetch seed details
  console.log("[SeedPage] Fetching seed…");
  const { data: seed, error: seedError } = await supabase
    .from("seeds")
    // No learning_maps join here — this page never reads it, and anon users
    // lack select permission on that table, which 404'd the whole page.
    .select("*, category:seed_categories(id, name, logo_url)")
    .eq("id", id)
    .single();

  if (seedError) console.error("[SeedPage] seeds fetch error:", seedError.message, seedError.code);
  console.log("[SeedPage] Seed found:", !!seed, "| type:", seed?.seed_type);

  if (!seed) {
    notFound();
  }

  const isPathLab = seed.seed_type === "pathlab";

  // Fetch path data separately so a missing table doesn't break the whole page
  let pathData: { id: string; total_days: number } | null = null;
  if (isPathLab) {
    console.log("[SeedPage] Fetching pathlab path data…");
    const { data: pathResult, error: pathError } = await supabase
      .from("paths")
      .select("id, total_days")
      .eq("seed_id", id)
      .maybeSingle();
    if (pathError) console.error("[SeedPage] paths fetch error:", pathError.message, pathError.code);
    console.log("[SeedPage] Path data:", pathResult);
    pathData = pathResult;
  }

  const pathTotalDays = pathData?.total_days ?? 5;

  // Day arc preview — shape of the week, not the activities themselves
  let pathDays: SeedDayArcItem[] = [];
  if (pathData?.id) {
    const { data: dayRows, error: daysError } = await supabase
      .from("path_days")
      .select("day_number, title, context_text")
      .eq("path_id", pathData.id)
      .order("day_number", { ascending: true });

    if (daysError) console.error("[SeedPage] path_days error:", daysError.message, daysError.code);
    pathDays = (dayRows as SeedDayArcItem[] | null) ?? [];
    console.log("[SeedPage] Authored days:", pathDays.length);
  }

  // Check if user is already in a room for this seed
  let userRoom = null;
  let userHasCompletedRoom = false;
  if (user && !isPathLab) {
    console.log("[SeedPage] Fetching room membership…");
    const { data: membershipData, error: membershipError } = await supabase
      .from("seed_room_members")
      .select(
        `
                *,
                room:seed_rooms!inner(*)
            `,
      )
      .eq("user_id", user.id)
      .eq("room.seed_id", id)
      .limit(1)
      .maybeSingle();

    if (membershipError) console.error("[SeedPage] seed_room_members error:", membershipError.message, membershipError.code);
    console.log("[SeedPage] Membership found:", !!membershipData);

    if (membershipData && (membershipData as any).room) {
      const room = (membershipData as any).room;
      console.log("[SeedPage] Room id:", room.id, "| status:", room.status, "| seed_id:", room.seed_id);
      // Check if the room is for this seed
      if (
        room.seed_id === id &&
        (room.status === "waiting" || room.status === "active")
      ) {
        userRoom = room;

        // Check if user has completed this room
        const { data: completionData, error: completionError } = await supabase
          .from("seed_room_completions")
          .select("*")
          .eq("room_id", room.id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (completionError) console.error("[SeedPage] seed_room_completions error:", completionError.message, completionError.code);
        console.log("[SeedPage] Completion found:", !!completionData);

        if (completionData) {
          userHasCompletedRoom = true;
        }
      }
    }
  }

  // Check if user is already enrolled in pathlab
  let pathEnrollmentId: string | undefined = undefined;
  if (user && isPathLab && pathData?.id) {
    console.log("[SeedPage] Fetching path enrollment…");
    const { data: enrollment, error: enrollmentError } = await supabase
      .from("path_enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("path_id", pathData.id)
      .maybeSingle();

    if (enrollmentError) console.error("[SeedPage] path_enrollments error:", enrollmentError.message, enrollmentError.code);
    console.log("[SeedPage] Enrollment:", enrollment?.id ?? "none");

    if (enrollment) {
      pathEnrollmentId = enrollment.id;
    }
  }

  const isCreator = user && seed.created_by === user.id;
  const canEdit = isAdmin || isCreator;

  // PathLab trial gate ("ทำก่อน จ่ายทีหลัง"): นักเรียนที่ล็อกอินแล้วต้องมี
  // trial ที่ยังใช้ได้ (active/pending/paid) ถึงจะเห็นเนื้อหา pathlab
  // null = ยังไม่มี trial, object = มี trial แต่หมดอายุ, undefined = ไม่ถูก gate
  // signed-out users และ admin/creator เห็นเนื้อหาปกติ
  let lockedTrial:
    | { payToken: string; payUrl: string; paymentDeadline: string }
    | null
    | undefined = undefined;
  if (user && isPathLab && pathData?.id && !canEdit) {
    const { data: trialRow, error: trialError } = await supabase
      .from("trial_accesses")
      .select("id, status, pay_token, payment_deadline, paid_at")
      .eq("user_id", user.id)
      .eq("seed_id", id)
      .maybeSingle();

    if (trialError)
      console.error("[SeedPage] trial_accesses error:", trialError.message, trialError.code);

    console.log(
      "[SeedPage] Trial:",
      trialRow?.id ?? "none",
      "| status:",
      trialRow ? resolveTrialStatus(trialRow) : "none"
    );

    if (!trialRow) {
      lockedTrial = null;
    } else if (!hasTrialAccess(trialRow)) {
      lockedTrial = {
        payToken: trialRow.pay_token,
        payUrl: `/pay/${trialRow.pay_token}`,
        paymentDeadline: trialRow.payment_deadline,
      };
    }
  }
  const trialLocked = lockedTrial !== undefined;

  console.log("[SeedPage] Seed created by:", seed.created_by, "| is creator:", isCreator, "| can edit:", canEdit);
  console.log("[SeedPage] Rendering page ✓");

  // Parse description markdown with line breaks preserved
  const descriptionHtml = seed.description
    ? markdownToSafeHtml(seed.description.replace(/\n/g, "  \n"))
    : null;

  const primaryAction = user ? (
    isPathLab ? (
      trialLocked ? (
        <a
          href="#trial-gate"
          className="ei-button-dusk min-h-12 w-full justify-center text-base"
        >
          <span>ดูวิธีเริ่มทดลอง</span>
        </a>
      ) : (
        <BeginPathButton
          seedId={seed.id}
          existingEnrollmentId={pathEnrollmentId}
        />
      )
    ) : (
      <CreateRoomButton
        seedId={seed.id}
        userId={user.id}
        existingRoom={userRoom}
        isCompleted={userHasCompletedRoom}
      />
    )
  ) : (
    <Link
      href="/login"
      className="ei-button-dusk min-h-12 w-full justify-center text-base"
    >
      <span>Sign in to start</span>
    </Link>
  );

  const hasCover = Boolean(seed.cover_image_url);

  // Facts stay short enough to read as one line on a phone
  const facts = isPathLab
    ? [
        { label: "Length", value: `${pathTotalDays} days` },
        { label: "Per day", value: "~30 min" },
        { label: "Format", value: "Solo" },
      ]
    : [
        {
          label: "Group",
          value: `${seed.min_students || 1}–${seed.max_students || 50}`,
        },
        { label: "Format", value: "Live room" },
        { label: "Series", value: seed.category?.name || "Uncategorized" },
      ];

  return (
    <div className="relative min-h-screen bg-[#0a0a0b] font-sans">
      <InViewAnimator />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      {/* With artwork: a full-bleed image the title sits on. Without: a slim
          control bar, so an empty gradient block never eats the first screen. */}
      <header className="relative isolate">
        <div
          className={`relative w-full overflow-hidden ${
            hasCover
              ? "h-[52vw] max-h-[380px] min-h-[240px] sm:h-[38vw] md:max-h-[440px]"
              : "h-16"
          }`}
        >
          {hasCover && (
            <>
              <img
                src={seed.cover_image_url}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Scrim — title stays legible on any artwork, hero lands on the page bg */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/75 to-[#0a0a0b]/25"
              />
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a0a0b] to-transparent"
              />
            </>
          )}

          {/* Controls — edge-anchored over artwork, aligned to the text column without it */}
          <div className="absolute inset-x-0 top-0 px-3 py-3 sm:px-4 sm:py-4">
            <div
              className={`flex items-center justify-between ${
                hasCover ? "" : "mx-auto max-w-2xl"
              }`}
            >
              <Link
                href="/seeds"
                aria-label="Back to Seeds"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white backdrop-blur-md transition-colors hover:bg-black/70"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              {canEdit && <SeedSettingsButton seed={seed} />}
            </div>
          </div>
        </div>

        {/* Title block — pulled up over the scrim when there is artwork */}
        <div className={`relative px-4 sm:px-6 ${hasCover ? "-mt-16" : "mt-2"}`}>
          <div className="mx-auto max-w-2xl">
            <div className="flex items-center gap-2.5">
              {seed.category?.logo_url && (
                <img
                  src={seed.category.logo_url}
                  alt=""
                  className="h-6 w-6 shrink-0 rounded object-contain"
                />
              )}
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
                {isPathLab ? "PathLab" : "Group journey"}
                {seed.category?.name ? ` · ${seed.category.name}` : ""}
              </span>
            </div>

            <h1 className="mt-2.5 text-[28px] font-extrabold leading-[1.14] tracking-tight text-white sm:text-4xl md:text-5xl">
              {seed.title}
            </h1>

            {seed.slogan && (
              <p className="mt-3 max-w-prose text-[15px] leading-7 text-neutral-400 sm:text-lg">
                {seed.slogan}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pb-16 sm:px-6 md:pb-24">
        {/* ── Facts ────────────────────────────────────────────────────── */}
        <dl className="mt-7 grid grid-cols-3 divide-x divide-white/10 rounded-xl border border-white/10 bg-white/[0.03]">
          {facts.map((fact) => (
            <div key={fact.label} className="px-3 py-3.5 text-center">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                {fact.label}
              </dt>
              <dd className="mt-1 truncate text-[13px] font-semibold text-white sm:text-sm">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* ── Primary action ───────────────────────────────────────────── */}
        {/* Sticks to the viewport bottom on mobile so the CTA is always in
            reach; settles back into the flow from md up. */}
        <div className="sticky bottom-0 z-30 -mx-4 mt-6 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/95 to-transparent px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-5 sm:-mx-6 sm:px-6 md:static md:mx-0 md:max-w-xs md:bg-none md:p-0">
          {primaryAction}
        </div>

        {canEdit && isPathLab && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="min-h-11 border-white/10 bg-white/[0.04] text-neutral-300 hover:bg-white/10 hover:text-white"
            >
              <Link href={`/seeds/${seed.id}/pathlab-builder`}>
                Path Builder
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="min-h-11 border-white/10 bg-white/[0.04] text-neutral-300 hover:bg-white/10 hover:text-white"
            >
              <Link href={`/seeds/${seed.id}/reports`}>Student Reports</Link>
            </Button>
          </div>
        )}

        {/* ── Body ─────────────────────────────────────────────────────── */}
        {trialLocked ? (
          <div id="trial-gate" className="mt-10 scroll-mt-20">
            <TrialGate
              seedId={seed.id}
              seedTitle={seed.title}
              trial={lockedTrial ?? null}
            />
          </div>
        ) : (
          <div className="mt-12 space-y-12 md:mt-16 md:space-y-16">
            {isPathLab && (
              <>
                <SeedDayArc days={pathDays} totalDays={pathTotalDays} />

                <section className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 sm:p-5">
                  <h2 className="text-[15px] font-semibold text-white">
                    A decision instrument, not a course
                  </h2>
                  <p className="mt-1.5 text-sm leading-6 text-amber-100/70">
                    Each day you do the work, then decide whether to continue,
                    pause, or stop. Deciding &ldquo;this isn&apos;t for me&rdquo;
                    on day 3 is a good outcome.
                  </p>
                </section>
              </>
            )}

            <section aria-labelledby="about-heading">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300/70">
                Detail
              </p>
              <h2
                id="about-heading"
                className="mt-2 text-2xl font-bold tracking-tight text-white"
              >
                {isPathLab ? "About this exploration" : "About this journey"}
              </h2>

              <div className="mt-5">
                {descriptionHtml ? (
                  <SeedAbout html={descriptionHtml} />
                ) : (
                  <p className="text-sm italic text-neutral-500">
                    No description yet.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
