import { createClient } from "@/utils/supabase/server";

export type FacultyTcasSummary = {
  programCount: number;
  samplePrograms: string[];
};

export type FacultyTcasSummaries = Record<string, FacultyTcasSummary>;

export type FacultyTcasProgram = {
  programId: string;
  programName: string;
  facultyName: string | null;
  universityId: string;
  universityName: string | null;
  logoUrl: string | null;
  totalSeats: number | null;
};

export type ComputerScienceTcasDetail = FacultyTcasProgram & {
  campusName: string | null;
  minScore: number | null;
  maxScore: number | null;
  applicants: number | null;
  passed: number | null;
  admissionRounds: Array<{
    projectName: string | null;
    receiveSeats: number | null;
    minScore: number | null;
    maxScore: number | null;
    applicants: number | null;
    passed: number | null;
    sourceUrl: string | null;
  }>;
};

const FACULTY_QUERIES = {
  cs: ["วิทยาการคอมพิวเตอร์", "คอมพิวเตอร์", "เทคโนโลยีสารสนเทศ"],
  engineering: ["วิศวกรรม"],
  medicine: ["แพทยศาสตร์"],
  business: ["บริหารธุรกิจ", "พาณิชยศาสตร์", "การจัดการ"],
  architecture: ["สถาปัตยกรรม"],
} as const;

const FEATURED_CS_UNIVERSITIES = [
  "จุฬาลงกรณ์มหาวิทยาลัย",
  "มหาวิทยาลัยธรรมศาสตร์",
  "มหาวิทยาลัยเกษตรศาสตร์",
  "มหาวิทยาลัยเชียงใหม่",
  "มหาวิทยาลัยขอนแก่น",
  "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
  "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
  "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ",
  "มหาวิทยาลัยศรีนครินทรวิโรฒ",
  "มหาวิทยาลัยเทคโนโลยีสุรนารี",
  "มหาวิทยาลัยศิลปากร",
  "มหาวิทยาลัยนเรศวร",
] as const;

const LOCAL_UNIVERSITY_LOGOS: Record<string, string> = {
  จุฬาลงกรณ์มหาวิทยาลัย: "/universities/chula-logo.png",
  มหาวิทยาลัยธรรมศาสตร์: "/universities/tu-logo.png",
  มหาวิทยาลัยเกษตรศาสตร์: "/universities/KU-logo.jpg",
  มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี: "/universities/kmutt-logo.png",
};

function normalizeThaiName(value: string) {
  return value.replace(/\s+/g, "");
}

function canonicalComputerScienceName(programName: string) {
  if (!normalizeThaiName(programName).includes("วิทยาการคอมพิวเตอร์")) {
    return programName;
  }

  const specialProgram = programName.includes("โครงการพิเศษ");
  return `วิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์${
    specialProgram ? " (โครงการพิเศษ)" : ""
  }`;
}

function universityLogo(universityName: string | null, databaseLogo?: string | null) {
  if (databaseLogo) return databaseLogo;
  if (!universityName) return null;
  const normalized = normalizeThaiName(universityName);
  const match = Object.entries(LOCAL_UNIVERSITY_LOGOS).find(
    ([name]) => normalizeThaiName(name) === normalized
  );
  return match?.[1] ?? null;
}

function facultyFilter(terms: readonly string[]) {
  const columns = [
    "faculty_name",
    "faculty_name_en",
    "field_name",
    "field_name_en",
    "program_name",
    "program_name_en",
  ];

  return terms
    .flatMap((term) => columns.map((column) => `${column}.ilike.%${term}%`))
    .join(",");
}

async function getFacultySummary(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
  terms: readonly string[]
): Promise<[string, FacultyTcasSummary]> {
  const filter = facultyFilter(terms);

  const [countResult, sampleResult] = await Promise.all([
    supabase
      .from("tcas_programs")
      .select("program_id", { count: "exact", head: true })
      .or(filter),
    supabase
      .from("tcas_programs")
      .select("program_name")
      .or(filter)
      .not("program_name", "is", null)
      .order("program_name")
      .limit(3),
  ]);

  if (countResult.error) throw countResult.error;
  if (sampleResult.error) throw sampleResult.error;

  const samplePrograms = Array.from(
    new Set((sampleResult.data ?? []).map((row) => row.program_name).filter(Boolean))
  );

  return [
    slug,
    {
      programCount: countResult.count ?? 0,
      samplePrograms,
    },
  ];
}

export async function getFacultyTcasSummaries(): Promise<FacultyTcasSummaries> {
  try {
    const supabase = await createClient();
    const summaries = await Promise.all(
      Object.entries(FACULTY_QUERIES).map(([slug, terms]) =>
        getFacultySummary(supabase, slug, terms)
      )
    );

    return Object.fromEntries(summaries);
  } catch (error) {
    console.error("[faculty-gallery] TCAS summary query failed", error);
    return {};
  }
}

export async function getComputerScienceTcasPrograms(
  limit = 12
): Promise<FacultyTcasProgram[]> {
  try {
    const supabase = await createClient();
    const filter = [
      "program_name.ilike.%วิทยาการคอมพิวเตอร์%",
      "field_name.ilike.%วิทยาการคอมพิวเตอร์%",
      "program_name_en.ilike.%computer science%",
      "field_name_en.ilike.%computer science%",
    ].join(",");
    const { data, error } = await supabase
      .from("tcas_programs")
      .select(`
        program_id,
        program_name,
        faculty_name,
        university_id,
        total_seats,
        score_components,
        tcas_universities ( university_name, logo_url )
      `)
      .or(filter)
      .order("program_name")
      .limit(200);

    if (error) throw error;

    const priority = new Map(
      FEATURED_CS_UNIVERSITIES.map((name, index) => [normalizeThaiName(name), index])
    );
    const featured = (data ?? []).map((row) => {
      const university = Array.isArray(row.tcas_universities)
        ? row.tcas_universities[0]
        : row.tcas_universities;

      return {
        programId: row.program_id,
        programName: canonicalComputerScienceName(row.program_name),
        sourceProgramName: row.program_name,
        facultyName: row.faculty_name,
        universityId: row.university_id,
        universityName: university?.university_name ?? null,
        logoUrl: universityLogo(
          university?.university_name ?? null,
          university?.logo_url ?? null
        ),
        totalSeats: row.total_seats,
        applicants:
          typeof row.score_components === "object" && row.score_components !== null
            ? Number((row.score_components as { applicants?: unknown }).applicants ?? 0)
            : 0,
      };
    }).filter((program) => {
      if (!program.universityName) return false;
      return priority.has(normalizeThaiName(program.universityName));
    });

    featured.sort((a, b) => {
      const aPriority = priority.get(normalizeThaiName(a.universityName ?? "")) ?? 999;
      const bPriority = priority.get(normalizeThaiName(b.universityName ?? "")) ?? 999;
      const specialProgramOrder =
        Number(a.sourceProgramName.includes("โครงการพิเศษ")) -
        Number(b.sourceProgramName.includes("โครงการพิเศษ"));
      return aPriority - bPriority || specialProgramOrder || b.applicants - a.applicants;
    });

    const seenUniversities = new Set<string>();
    return featured
      .filter((program) => {
        const key = normalizeThaiName(program.universityName ?? "");
        if (seenUniversities.has(key)) return false;
        seenUniversities.add(key);
        return true;
      })
      .slice(0, limit)
      .map((program) => ({
        programId: program.programId,
        programName: program.programName,
        facultyName: program.facultyName,
        universityId: program.universityId,
        universityName: program.universityName,
        logoUrl: program.logoUrl,
        totalSeats: program.totalSeats,
      }));
  } catch (error) {
    console.error("[faculty-gallery] CS TCAS program query failed", error);
    return [];
  }
}

export async function getComputerScienceTcasProgram(
  programId: string
): Promise<ComputerScienceTcasDetail | null> {
  try {
    const supabase = await createClient();
    const [programResult, roundsResult] = await Promise.all([
      supabase
        .from("tcas_programs")
        .select(`
          program_id,
          program_name,
          faculty_name,
          university_id,
          campus_name,
          total_seats,
          min_score,
          max_score,
          score_components,
          tcas_universities ( university_name, logo_url )
        `)
        .eq("program_id", programId)
        .maybeSingle(),
      supabase
        .from("tcas_admission_rounds")
        .select("project_name,receive_seats,min_total_score,score_conditions,score_weights,link")
        .eq("program_id", programId)
        .eq("round_type", "3_2569")
        .order("receive_seats", { ascending: false }),
    ]);

    if (programResult.error) throw programResult.error;
    if (roundsResult.error) throw roundsResult.error;
    if (!programResult.data) return null;

    const row = programResult.data;
    const university = Array.isArray(row.tcas_universities)
      ? row.tcas_universities[0]
      : row.tcas_universities;
    const scoreComponents = row.score_components as {
      applicants?: unknown;
      passed?: unknown;
    } | null;

    return {
      programId: row.program_id,
      programName: canonicalComputerScienceName(row.program_name),
      facultyName: row.faculty_name,
      universityId: row.university_id,
      universityName: university?.university_name ?? null,
      logoUrl: universityLogo(
        university?.university_name ?? null,
        university?.logo_url ?? null
      ),
      campusName: row.campus_name,
      totalSeats: row.total_seats,
      minScore: row.min_score,
      maxScore: row.max_score,
      applicants: Number(scoreComponents?.applicants ?? 0) || null,
      passed: Number(scoreComponents?.passed ?? 0) || null,
      admissionRounds: (roundsResult.data ?? []).map((round) => {
        const conditions = round.score_conditions as {
          applicants?: unknown;
          passed?: unknown;
        } | null;
        const weights = round.score_weights as { max_score?: unknown } | null;
        return {
          projectName: round.project_name,
          receiveSeats: round.receive_seats,
          minScore: round.min_total_score,
          maxScore: Number(weights?.max_score ?? 0) || null,
          applicants: Number(conditions?.applicants ?? 0) || null,
          passed: Number(conditions?.passed ?? 0) || null,
          sourceUrl: round.link,
        };
      }),
    };
  } catch (error) {
    console.error("[faculty-gallery] CS TCAS detail query failed", error);
    return null;
  }
}
