import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { getComputerScienceTcasPrograms } from "@/lib/tcas/faculty-gallery";

const studyBlocks = [
  {
    title: "Programming + Problem Solving",
    body: "เริ่มจากเขียนโปรแกรมพื้นฐาน แล้วค่อยๆ ไปสู่ data structures, algorithms และการคิดเป็นขั้นตอนให้คอมพิวเตอร์ทำตามได้จริง",
    chips: ["Python / C / Java", "Debugging", "Data Structures"],
  },
  {
    title: "Math + Logic",
    body: "เจอ discrete math, logic, probability, linear algebra และบางที่มี calculus เพราะ CS ต้องเข้าใจเหตุผลเบื้องหลัง algorithm ไม่ใช่แค่จำ code",
    chips: ["Discrete Math", "Proof", "Probability"],
  },
  {
    title: "Computer Systems",
    body: "เรียนว่าโปรแกรมทำงานบนเครื่องจริงอย่างไร ตั้งแต่ database, operating systems, networks, computer organization ไปถึง performance trade-off",
    chips: ["Database", "OS", "Network"],
  },
  {
    title: "AI / Data / Software Projects",
    body: "ปีหลังๆ จะเจอ project ที่ใหญ่ขึ้น เช่น web/app, backend, AI model, data pipeline หรือ software engineering project ที่ต้องทำงานเป็นทีม",
    chips: ["AI", "Backend", "Team Project"],
  },
];

const assessmentBlocks = [
  {
    title: "Coding Assignments",
    body: "งานเขียน code ที่วัดจาก test case, logic, edge cases และความอ่านง่าย บางงานใช้เวลาหลายวันเพราะ bug เล็กๆ จุดเดียว",
  },
  {
    title: "Written Exams",
    body: "สอบทฤษฎี algorithm, math, database, network หรือ OS ต้องอธิบายเหตุผล วิเคราะห์ complexity และแก้โจทย์บนกระดาษได้",
  },
  {
    title: "Lab + Practical Test",
    body: "บางวิชามี lab ที่ต้องทำในเวลาจำกัด เห็น error จริง แก้จริง และต้องรู้ว่า code ตัวเองทำอะไรอยู่",
  },
  {
    title: "Team Project + Demo",
    body: "ปีท้ายๆ มักมี project เป็นทีม ใช้ Git แบ่งงาน ทำเอกสาร นำเสนอ และรับ feedback เหมือนจำลองงาน software จริง",
  },
];

const studentProjects = [
  {
    title: "Mining Better Jupyter Notebooks",
    eyebrow: "DATA SCIENCE + SOFTWARE QUALITY",
    image: "/faculty-radar/cs-projects/jupyter-quality.jpg",
    imageAlt: "ICT Mahidol student project about measuring the quality of Jupyter notebooks",
    body: "นักศึกษาเก็บและวิเคราะห์ notebook จาก Kaggle เพื่อหาว่า code, คำอธิบาย และ visualization แบบไหนทำให้ notebook คุณภาพดีพอจะใช้เป็นตัวอย่างฝึก AI ได้",
    reality: "ของจริงไม่ได้มีแค่ train model — ต้องนิยามคำว่า ‘คุณภาพ’, เก็บข้อมูลจำนวนมาก และตรวจว่าข้อมูลไม่ได้สุ่มหรือคัดลอกมา",
    skills: ["Python", "Data analysis", "Code quality", "Research"],
    source: "ICT Mahidol · Senior Project",
    href: "https://news.ict.mahidol.ac.th/rom-mining-the-characteristics-of-jupyter-notebooks-in-data-science-projects/",
  },
  {
    title: "86 Senior Projects in One Room",
    eyebrow: "FINAL YEAR · BUILD + TEST + PRESENT",
    image: "/faculty-radar/cs-projects/senior-showcase.jpg",
    imageAlt: "Fourth-year ICT Mahidol students presenting senior projects at the 2026 exhibition",
    body: "งาน ICT SP-APEC 2026 รวมโครงงานนักศึกษาปี 4 ถึง 86 โครงงาน ตั้งแต่งานวิจัย ซอฟต์แวร์ ไปจนถึงเทคโนโลยีที่แก้ปัญหาจริง พร้อมนำเสนอให้กรรมการและรุ่นน้องทดลองดู",
    reality: "ปลายทางของโปรเจกต์ไม่ใช่แค่ code ที่รันได้ แต่ต้องอธิบายปัญหา รับ feedback และปรับงานให้คนอื่นเชื่อถือได้",
    skills: ["Product demo", "Teamwork", "Testing", "Presentation"],
    source: "ICT Mahidol · SP-APEC 2026",
    href: "https://news.ict.mahidol.ac.th/ictdst-senior-project-poster-exhibition-2026/",
  },
];

const comparisonRows = [
  {
    name: "Computer Science",
    body: "เน้นหลักคิดของ software, algorithm, data, AI และระบบคอมพิวเตอร์ เหมาะกับคนที่อยากเข้าใจว่าเทคโนโลยีทำงานอย่างไรจากแกนข้างใน",
  },
  {
    name: "Computer Engineering",
    body: "ใกล้ hardware และวิศวกรรมมากกว่า เช่น circuit, embedded systems, electronics, low-level systems และอาจมี physics/engineering math หนักกว่า",
  },
  {
    name: "Information Technology",
    body: "เน้นการนำเทคโนโลยีไปใช้ในองค์กร ระบบสารสนเทศ infrastructure, cloud, security, support, business process และ implementation",
  },
  {
    name: "Data Science / AI",
    body: "โฟกัส data, statistics, machine learning และการวิเคราะห์ข้อมูลมากกว่า CS ทั่วไป แต่บางหลักสูตรจะเขียนระบบลึกน้อยกว่า",
  },
];

const careerDoors = [
  {
    title: "Software Engineer / Developer",
    percent: 38,
    body: "สร้าง web, mobile, backend, internal tools หรือระบบ product จริง เป็นประตูหลักของ CS",
  },
  {
    title: "Data / AI / Machine Learning",
    percent: 18,
    body: "ทำ data analysis, ML model, AI application, automation หรือ prototype ด้านข้อมูล",
  },
  {
    title: "Cybersecurity / Cloud / DevOps",
    percent: 12,
    body: "ดูแลระบบ, security, infrastructure, cloud deployment, monitoring และ reliability",
  },
  {
    title: "Product / UX / Tech Business",
    percent: 10,
    body: "ใช้พื้นฐาน tech ไปทำ product manager, UX engineer, business analyst หรือ startup role",
  },
  {
    title: "Research / Grad School",
    percent: 7,
    body: "ต่อยอดด้าน AI, systems, theory, HCI หรือ research-heavy track",
  },
  {
    title: "Other / Pivot",
    percent: 15,
    body: "บางคนไปสายสอน, consulting, digital marketing, game, creative tech หรือเปลี่ยนสายโดยใช้ logic จาก CS เป็นฐาน",
  },
];

export const metadata = {
  title: "Computer Science Faculty Radar | Passion Seed",
  description: "A student-facing preview of what Computer Science feels like inside university.",
};

export const dynamic = "force-dynamic";

export default async function ComputerScienceFacultyPage() {
  const tcasPrograms = await getComputerScienceTcasPrograms();

  return (
    <main className="faculty-detail-page min-h-screen">
      <section className="faculty-detail-hero">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/faculty-radar" className="faculty-detail-back">
            <ArrowLeft className="h-4 w-4" /> Faculty Gallery
          </Link>
          <div className="faculty-detail-hero-grid">
            <div>
              <p className="faculty-detail-kicker">Faculty Preview</p>
              <h1>Computer Science</h1>
              <h2>วิทยาการคอมพิวเตอร์</h2>
              <p className="faculty-detail-lede">
                ถ้าจะเลือก CS อย่าดูแค่ว่า “จบไปเป็นโปรแกรมเมอร์ไหม”
                ให้ดูว่าชอบสภาพแวดล้อมแบบนี้หรือเปล่า: งานที่ต้องคิดเป็นขั้นตอน
                เรียนรู้จาก error เยอะ ทำ project จริง และค่อยๆ สร้างความเข้าใจจากความงง
              </p>
            </div>
            <div className="faculty-detail-terminal" aria-label="CS faculty snapshot">
              <div className="faculty-detail-terminal-bar">
                <span />
                <span />
                <span />
              </div>
              <pre>{`semester.load({
  math: "logic + probability",
  code: "daily practice",
  lab: "test cases fail first",
  project: "team + git + demo",
  feeling: "confused -> shipped"
})`}</pre>
            </div>
          </div>
        </div>
      </section>

      <section className="faculty-detail-section faculty-tcas-section">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="faculty-detail-section-head faculty-tcas-heading">
            <div>
              <p>TCAS / Programs in Thailand</p>
              <h2>หลักสูตร CS เด่นจากมหาวิทยาลัยใหญ่</h2>
            </div>
            <p className="faculty-tcas-intro">
              คัดหนึ่งหลักสูตรต่อมหาวิทยาลัยจากสถาบันขนาดใหญ่และเป็นที่รู้จัก
              พร้อมจำนวนรับที่ประกาศใน TCAS69 รอบ 3
            </p>
          </div>

          {tcasPrograms.length > 0 ? (
            <div className="faculty-tcas-grid">
              {tcasPrograms.map((program) => (
                <Link
                  key={program.programId}
                  href={`/faculty-radar/cs/${program.programId}`}
                  className="faculty-tcas-card"
                >
                  <div className="faculty-tcas-card__identity">
                    <div className="faculty-tcas-card__logo">
                      {program.logoUrl ? (
                        <Image
                          src={program.logoUrl}
                          alt={`ตรา${program.universityName ?? "มหาวิทยาลัย"}`}
                          fill
                          sizes="64px"
                        />
                      ) : (
                        <span>{program.universityName?.replace("มหาวิทยาลัย", "").trim().slice(0, 2) ?? "CS"}</span>
                      )}
                    </div>
                    <div>
                      <p>{program.universityName ?? `มหาวิทยาลัย ${program.universityId}`}</p>
                      {program.facultyName && <span>{program.facultyName}</span>}
                    </div>
                  </div>
                  <div className="faculty-tcas-card__footer">
                    {program.totalSeats != null && <strong>รับ {program.totalSeats.toLocaleString("th-TH")} คน</strong>}
                    <span>ดูรายละเอียด <ArrowUpRight className="h-4 w-4" /></span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="faculty-tcas-empty">
              <strong>ยังไม่พบข้อมูล TCAS ในฐานข้อมูลที่เชื่อมต่ออยู่</strong>
              <p>
                ส่วนนี้พร้อมแสดงผลแล้ว เมื่อ import ข้อมูลลงตาราง <code>tcas_programs</code>
                รายการหลักสูตร Computer Science จะปรากฏที่นี่อัตโนมัติ
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="faculty-detail-section faculty-project-section">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="faculty-detail-section-head faculty-project-heading">
            <div>
              <p>3 / What Students Actually Build</p>
              <h2>เรียนแล้วสร้างอะไรได้จริง</h2>
            </div>
            <p className="faculty-project-intro">
              ตัวอย่างจริงจากนักศึกษาสาย ICT/Computer Science ในไทย — ดูทั้งผลงานที่น่าตื่นเต้น
              และงานยากที่ซ่อนอยู่ข้างหลัง
            </p>
          </div>
          <div className="faculty-project-grid">
            {studentProjects.map((project) => (
              <article key={project.title} className="faculty-project-card">
                <div className="faculty-project-image">
                  <Image
                    src={project.image}
                    alt={project.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <span>{project.eyebrow}</span>
                </div>
                <div className="faculty-project-content">
                  <h3>{project.title}</h3>
                  <p>{project.body}</p>
                  <div className="faculty-project-reality">
                    <strong>งานยากที่อยู่ข้างหลัง</strong>
                    <p>{project.reality}</p>
                  </div>
                  <div className="faculty-project-footer">
                    <div className="faculty-project-skills">
                      {project.skills.map((skill) => <span key={skill}>{skill}</span>)}
                    </div>
                    <a href={project.href} target="_blank" rel="noreferrer">
                      {project.source} <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="faculty-project-question">
            <span>ลองถามตัวเอง</span>
            <p>งานไหนทำให้คุณอยากเปิดคอมแล้วลองสร้างเวอร์ชันเล็กๆ ของตัวเอง?</p>
          </div>
        </div>
      </section>

      <section className="faculty-detail-section">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="faculty-detail-section-head">
            <p>1 / What You Actually Study</p>
            <h2>เรียนอะไรจริงในคณะนี้</h2>
          </div>
          <div className="faculty-subject-grid">
            {studyBlocks.map((item) => (
              <article key={item.title} className="faculty-subject-card">
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <div>
                  {item.chips.map((chip) => (
                    <span key={chip}>{chip}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="faculty-detail-section">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="faculty-detail-section-head">
            <p>2 / Assessment Style</p>
            <h2>เขาวัดผลยังไง</h2>
          </div>
          <div className="faculty-assessment-grid">
            {assessmentBlocks.map((item) => (
              <article key={item.title} className="faculty-assessment-card">
                <span>{item.title}</span>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="faculty-detail-section">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="faculty-detail-section-head">
            <p>4 / Difference From Similar Faculty</p>
            <h2>ต่างจากคณะใกล้เคียงยังไง</h2>
          </div>
          <div className="faculty-compare-list">
            {comparisonRows.map((item) => (
              <article key={item.name} className="faculty-compare-row">
                <h3>{item.name}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="faculty-detail-section pb-16">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="faculty-detail-section-head">
            <p>5 / Career Doors After This Faculty</p>
            <h2>จบแล้วประตูอาชีพเปิดไปทางไหนบ้าง</h2>
          </div>
          <p className="faculty-career-note">
            สัดส่วนนี้เป็นภาพประมาณเพื่อช่วยตัดสินใจ ไม่ใช่สถิติของมหาวิทยาลัยใดมหาวิทยาลัยหนึ่ง
            เพราะผลจริงขึ้นกับ portfolio, internship, ภาษา, เมืองที่สมัคร และเศรษฐกิจปีนั้น
          </p>
          <div className="faculty-career-list">
            {careerDoors.map((career) => (
              <article key={career.title} className="faculty-career-row">
                <div>
                  <h3>{career.title}</h3>
                  <p>{career.body}</p>
                </div>
                <div className="faculty-career-meter" aria-label={`${career.title} ${career.percent}%`}>
                  <span style={{ width: `${career.percent}%` }} />
                </div>
                <strong className="faculty-career-percent">{career.percent}%</strong>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
