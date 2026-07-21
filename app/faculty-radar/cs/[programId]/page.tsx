import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getComputerScienceTcasProgram } from "@/lib/tcas/faculty-gallery";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const program = await getComputerScienceTcasProgram(programId);
  return {
    title: program
      ? `${program.universityName} Computer Science | PassionSeed`
      : "TCAS program not found | PassionSeed",
  };
}

export default async function ComputerScienceTcasProgramPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const program = await getComputerScienceTcasProgram(programId);
  if (!program) notFound();

  return (
    <main className="faculty-detail-page faculty-tcas-detail-page min-h-screen">
      <section className="faculty-detail-hero">
        <div className="relative z-[3] mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/faculty-radar/cs" className="faculty-detail-back">
            <ArrowLeft className="h-4 w-4" /> Computer Science
          </Link>
          <div className="faculty-tcas-detail-hero">
            <div className="faculty-tcas-detail-logo">
              {program.logoUrl ? (
                <Image
                  src={program.logoUrl}
                  alt={`ตรา${program.universityName ?? "มหาวิทยาลัย"}`}
                  fill
                  sizes="112px"
                />
              ) : (
                <span>{program.universityName?.replace("มหาวิทยาลัย", "").trim().slice(0, 2) ?? "CS"}</span>
              )}
            </div>
            <div>
              <p className="faculty-detail-kicker">TCAS69 · ROUND 3</p>
              <h1>{program.universityName}</h1>
              <h2>{program.programName}</h2>
              <p className="faculty-detail-lede">
                {program.facultyName}
                {program.campusName ? ` · ${program.campusName}` : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="faculty-detail-section">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="faculty-tcas-metrics">
            <Metric label="จำนวนรับ" value={program.totalSeats} suffix="คน" />
            <Metric label="ผู้สมัคร" value={program.applicants} suffix="คน" />
            <Metric label="ผู้ผ่าน" value={program.passed} suffix="คน" />
            <Metric label="คะแนนต่ำสุด" value={program.minScore} />
            <Metric label="คะแนนสูงสุด" value={program.maxScore} />
          </div>

          <div className="faculty-tcas-detail-section">
            <div className="faculty-detail-section-head">
              <p>Admission tracks</p>
              <h2>รายละเอียดการรับสมัคร</h2>
            </div>
            <div className="faculty-tcas-round-list">
              {program.admissionRounds.map((round, index) => (
                <article key={`${round.projectName}-${index}`}>
                  <div>
                    <span>TCAS รอบ 3</span>
                    <h3>{round.projectName || "Admission"}</h3>
                  </div>
                  <dl>
                    <Stat label="รับ" value={round.receiveSeats} />
                    <Stat label="สมัคร" value={round.applicants} />
                    <Stat label="ผ่าน" value={round.passed} />
                    <Stat label="ต่ำสุด" value={round.minScore} />
                    <Stat label="สูงสุด" value={round.maxScore} />
                  </dl>
                  {round.sourceUrl && (
                    <a href={round.sourceUrl} target="_blank" rel="noreferrer">
                      Official TCAS source <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>

          <p className="faculty-tcas-source-note">
            TCAS ID {program.programId} · ข้อมูลจากสถิติ TCAS69 รอบ 3 ณ วันที่ 10 มิถุนายน 2569
          </p>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, suffix }: { label: string; value: number | null; suffix?: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value == null ? "—" : `${value.toLocaleString("th-TH")} ${suffix ?? ""}`}</strong>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value == null ? "—" : value.toLocaleString("th-TH")}</dd>
    </div>
  );
}
