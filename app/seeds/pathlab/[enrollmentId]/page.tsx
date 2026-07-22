import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PathLabExperience } from "@/components/pathlab/PathLabExperience";
import { getPathEndReflection, getPathExitReflection, getPathReflections } from "@/lib/supabase/pathlab-reflections";

interface PathLabExperiencePageProps {
  params: Promise<{
    enrollmentId: string;
  }>;
  searchParams: Promise<{
    day?: string | string[];
  }>;
}

type PathDayRow = {
  id: string;
  day_number: number | string | null;
  title: string | null;
  context_text: string | null;
  reflection_prompts: string[] | null;
};

type ActivitySummaryRow = {
  id: string;
  title: string | null;
  path_day_id: string;
  display_order: number | null;
  is_required: boolean | null;
};

export default async function PathLabExperiencePage({ params, searchParams }: PathLabExperiencePageProps) {
  const { enrollmentId } = await params;
  const { day: daySearchParam } = await searchParams;
  const requestedDayNumber =
    typeof daySearchParam === "string" ? Number.parseInt(daySearchParam, 10) : Number.NaN;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/seeds/pathlab/${enrollmentId}`);
  }

  const { data: enrollment, error: enrollmentError } = await supabase
    .from("path_enrollments")
    .select(
      `
      *,
      path:paths(
        *,
        seed:seeds(*)
      )
    `
    )
    .eq("id", enrollmentId)
    .single();

  if (enrollmentError || !enrollment) {
    notFound();
  }

  if (enrollment.user_id !== user.id) {
    notFound();
  }

  const { data: days } = await supabase
    .from("path_days")
    .select("id, day_number, title, context_text, reflection_prompts")
    .eq("path_id", enrollment.path.id)
    .order("day_number", { ascending: true });

  const dayRows = (days || []) as PathDayRow[];

  // Activity titles across every day power the path overview / map panel
  const { data: allActivities } = await supabase
    .from("path_activities")
    .select("id, title, path_day_id, display_order, is_required")
    .in(
      "path_day_id",
      dayRows.map((entry) => entry.id)
    )
    .order("display_order", { ascending: true });

  const activitiesByDayId = ((allActivities || []) as ActivitySummaryRow[]).reduce<
    Record<string, ActivitySummaryRow[]>
  >((acc, activity) => {
    (acc[activity.path_day_id] ||= []).push(activity);
    return acc;
  }, {});

  const pathDaySummaries = dayRows
    .filter((entry) => Number.isFinite(Number(entry.day_number)))
    .map((entry) => {
      const dayActivities = activitiesByDayId[entry.id] || [];

      return {
        day_number: Number(entry.day_number),
        title: typeof entry.title === "string" ? entry.title : null,
        context_text:
          typeof entry.context_text === "string" ? entry.context_text : "",
        reflection_prompts: Array.isArray(entry.reflection_prompts)
          ? entry.reflection_prompts.filter(
              (prompt): prompt is string =>
                typeof prompt === "string" && prompt.trim().length > 0,
            )
          : [],
        activity_ids: dayActivities.map((activity) => activity.id),
        activities: dayActivities.map((activity) => ({
          id: activity.id,
          title: activity.title?.trim() || "Untitled activity",
        })),
      };
    });

  const allDayNumbers = pathDaySummaries.map((entry) => entry.day_number);

  const maxAccessibleDay =
    enrollment.status === "explored"
      ? Number(enrollment.path?.total_days || enrollment.current_day)
      : Number(enrollment.current_day);
  const availableDayNumbers = allDayNumbers.filter((dayNumber) => dayNumber <= maxAccessibleDay);
  const navigableDayNumbers = availableDayNumbers.length > 0 ? availableDayNumbers : allDayNumbers;
  const fallbackDayNumber =
    availableDayNumbers.includes(Number(enrollment.current_day))
      ? Number(enrollment.current_day)
      : availableDayNumbers[availableDayNumbers.length - 1] || allDayNumbers[0] || Number(enrollment.current_day);
  const selectedDayNumber =
    Number.isFinite(requestedDayNumber) && navigableDayNumbers.includes(requestedDayNumber)
      ? requestedDayNumber
      : fallbackDayNumber;

  const day = dayRows.find(
    (entry) => Number(entry.day_number) === selectedDayNumber
  );

  // Full content for the selected day only — the overview needs titles, the
  // active day needs everything required to actually do the work
  let dayActivities: any[] = [];
  if (day) {
    const { data: fetchedActivities } = await supabase
      .from("path_activities")
      .select(
        `
        *,
        path_content(*),
        path_assessments(
          *,
          path_quiz_questions(*)
        )
      `
      )
      .eq("path_day_id", day.id)
      .order("display_order", { ascending: true });

    dayActivities = (fetchedActivities || []).map((activity: any) => ({
      ...activity,
      content: [...(activity.path_content || [])].sort(
        (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
      ),
      // path_assessments is UNIQUE(activity_id), so at most one row
      assessment: activity.path_assessments?.[0] || null,
    }));
  }

  const { data: progressRows } = await supabase
    .from("path_activity_progress")
    .select("*")
    .eq("enrollment_id", enrollmentId);

  const progressMap = (progressRows || []).reduce<Record<string, any>>(
    (acc, row: any) => {
      acc[row.activity_id] = row;
      return acc;
    },
    {}
  );

  const [reflections, exitReflection, endReflection] = await Promise.all([
    getPathReflections(enrollmentId),
    getPathExitReflection(enrollmentId),
    getPathEndReflection(enrollmentId),
  ]);

  return (
    // No wrapper padding — PlayerShell owns the full-bleed player layout
    <>
      <PathLabExperience
        enrollment={enrollment}
        seed={enrollment.path.seed}
        path={enrollment.path}
        day={day}
        dayActivities={dayActivities}
        initialProgressMap={progressMap}
        pathDaySummaries={pathDaySummaries}
        availableDayNumbers={navigableDayNumbers}
        currentDayNumber={Number(enrollment.current_day)}
        reflections={reflections}
        exitReflection={exitReflection}
        endReflection={endReflection}
      />
    </>
  );
}
