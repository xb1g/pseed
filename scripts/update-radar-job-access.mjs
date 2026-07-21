import { createClient } from "@supabase/supabase-js";

const targets = [
  {
    name: "local",
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  {
    name: "production",
    url: process.env.HACKATHON_SUPABASE_URL,
    key: process.env.HACKATHON_SUPABASE_SERVICE_ROLE_KEY,
  },
];

const sharedMethodology =
  "สูตร: ความต้องการจ้าง 50% + การแข่งขันแบบกลับคะแนน 25% + ด่านทักษะแรกเข้าแบบกลับคะแนน 25% คะแนนนี้ไม่ใช่เปอร์เซ็นต์โอกาสได้งาน";

const updates = {
  cybersecurity: {
    sources: [
      { ref: 14, title: "Cyber Security jobs in Thailand", publisher: "LinkedIn", url: "https://th.linkedin.com/jobs/cyber-security-jobs", tier: "secondary" },
      { ref: 15, title: "ปัญหากำลังคนด้านดิจิทัลในไทย", publisher: "depa", url: "https://www.depa.or.th/th/article-view/Digital-workforce", tier: "primary" },
    ],
    th: {
      eyebrow: "ตลาดไทย · ประเมิน 21 ก.ค. 2569",
      title: "งานนี้หาง่ายแค่ไหนในไทย?",
      body: "ตลาดมีงานให้เห็นจริง แต่ด่านแรกของเด็กจบใหม่ยังสูง: LinkedIn แสดงผลค้นหา 222 งาน โดย 34 งานอยู่ระดับประสบการณ์น้อย เทียบกับ 133 งานระดับกึ่งอาวุโส ตัวเลขเป็นภาพจากแพลตฟอร์ม ไม่ใช่จำนวนงานว่างทั้งประเทศ",
      job_access: {
        score: 63,
        label: "ปานกลางค่อนไปทางง่ายเมื่อมีทักษะจริง",
        confidence: "medium",
        demand_score: 8,
        competition_score: 4,
        entry_barrier_score: 7,
        applicant_data: "ยังไม่มีข้อมูลสาธารณะที่น่าเชื่อถือว่ามีผู้สมัครกี่คนต่อ 1 ตำแหน่งไซเบอร์ในไทย",
        methodology: sharedMethodology,
      },
      source_refs: [14, 15],
    },
    en: {
      eyebrow: "Thailand market · assessed 21 Jul 2026",
      title: "How easy is it to find this job?",
      body: "Demand is visible, but the first step remains difficult for graduates. LinkedIn showed 222 search results: 34 entry-level versus 133 mid-senior. These are platform search results, not national unique vacancies.",
      job_access: {
        score: 63,
        label: "Moderate; easier with demonstrated skills",
        confidence: "medium",
        demand_score: 8,
        competition_score: 4,
        entry_barrier_score: 7,
        applicant_data: "No reliable public Thailand-wide applicants-per-opening figure is available for cybersecurity.",
        methodology: "Formula: demand 50% + inverse competition 25% + inverse entry barrier 25%. This is not a probability of receiving an offer.",
      },
      source_refs: [14, 15],
    },
  },
  "ai-engineer": {
    sources: [
      { ref: 7, title: "Thailand AI Readiness Assessment 2025", publisher: "TDRI", url: "https://tdri.or.th/en/2025/06/thailand-ai-readiness-assessment-report-2025/", tier: "primary" },
      { ref: 8, title: "ปัญหากำลังคนด้านดิจิทัลในไทย", publisher: "depa", url: "https://www.depa.or.th/th/article-view/Digital-workforce", tier: "primary" },
    ],
    th: {
      eyebrow: "ตลาดไทย · ประเมิน 21 ก.ค. 2569",
      title: "งานนี้หาง่ายแค่ไหนในไทย?",
      body: "ตลาดต้องการคนจริง แต่ประตูเข้าค่อนข้างแคบสำหรับมือใหม่ JobsDB แสดงผลค้นหา 138 งาน และหลายประกาศขอประสบการณ์ 3–5 ปี พร้อมทักษะทำ AI ขึ้น production ไม่ใช่แค่ทำโมเดลทดลอง",
      job_access: {
        score: 60,
        label: "ปานกลาง · ยากสำหรับมือใหม่",
        confidence: "medium",
        demand_score: 8,
        competition_score: 4,
        entry_barrier_score: 8,
        applicant_data: "ยังไม่มีข้อมูลผู้สมัครต่อ 1 ตำแหน่ง AI Engineer ในไทย คะแนนการแข่งขันจึงใช้ภาวะขาดแคลนคนที่มีทักษะพร้อมทำงานเป็นตัวแทน",
        methodology: sharedMethodology,
      },
      source_refs: [1, 7, 8],
    },
    en: {
      eyebrow: "Thailand market · assessed 21 Jul 2026",
      title: "How easy is it to find this job?",
      body: "Demand is real, but entry is narrow for beginners. JobsDB showed 138 search results, while many listings asked for 3–5 years of experience and production AI skills.",
      job_access: {
        score: 60,
        label: "Moderate; difficult for beginners",
        confidence: "medium",
        demand_score: 8,
        competition_score: 4,
        entry_barrier_score: 8,
        applicant_data: "No reliable public applicants-per-opening figure exists for AI Engineer roles in Thailand; qualified-skill scarcity is used as a competition proxy.",
        methodology: "Formula: demand 50% + inverse competition 25% + inverse entry barrier 25%. This is not a probability of receiving an offer.",
      },
      source_refs: [1, 7, 8],
    },
  },
  "data-scientist": {
    sources: [
      { ref: 8, title: "ตลาดงาน AI ไทยโต แต่ทักษะคนยังไม่ทัน", publisher: "TDRI", url: "https://tdri.or.th/2025/08/ai-job-market-2tracked-growth/", tier: "primary" },
      { ref: 9, title: "Big Data ตลาดแรงงานไทย ไตรมาส 2 ปี 2568", publisher: "TDRI", url: "https://tdri.or.th/2025/08/bigdata-report-labourmarket-q2-2025/", tier: "primary" },
    ],
    th: {
      eyebrow: "ตลาดไทย · ข้อมูลไตรมาส 2/2568",
      title: "งานนี้หาง่ายแค่ไหนในไทย?",
      body: "ประกาศ Data Scientist/Data Analyst โต 23% จาก 2,129 เป็น 2,618 ตำแหน่ง แต่ตลาดเด็กจบใหม่ยังแน่น: ในกลุ่มวิทยาการคอมพิวเตอร์ที่เป็นแหล่งผู้สมัครหลัก มีบัณฑิต 8,242 คน เทียบกับประกาศที่เหมาะกับจบใหม่ 3,088 งาน และเพียง 376 งานระบุว่าไม่ต้องมีประสบการณ์ ตัวเลขกลุ่ม CS ไม่ใช่อัตราสมัครงาน Data Scientist โดยตรง",
      job_access: {
        score: 59,
        label: "ปานกลาง · งานโตแต่คัดทักษะสูง",
        confidence: "medium",
        demand_score: 8.5,
        competition_score: 6.5,
        entry_barrier_score: 7,
        applicant_data: "ยังไม่มีข้อมูลสาธารณะที่น่าเชื่อถือเรื่องผู้สมัครต่อ 1 ตำแหน่ง Data Scientist ในไทย จึงใช้ข้อมูลบัณฑิตและงานที่เหมาะกับจบใหม่เป็นตัวแทนการแข่งขัน",
        methodology: sharedMethodology,
      },
      source_refs: [8, 9],
    },
    en: {
      eyebrow: "Thailand market · Q2 2025 data",
      title: "How easy is it to find this job?",
      body: "Data Scientist/Data Analyst postings grew 23%, from 2,129 to 2,618. Entry-level supply is tighter: the broader Computer Science feeder field had 8,242 graduates versus 3,088 graduate-suitable postings, with only 376 explicitly requiring no experience. This is not a direct Data Scientist application ratio.",
      job_access: {
        score: 59,
        label: "Moderate; growing but selective",
        confidence: "medium",
        demand_score: 8.5,
        competition_score: 6.5,
        entry_barrier_score: 7,
        applicant_data: "No reliable public applicants-per-opening figure exists for Data Scientist roles in Thailand; graduate supply and graduate-suitable postings are used as a proxy.",
        methodology: "Formula: demand 50% + inverse competition 25% + inverse entry barrier 25%. This is not a probability of receiving an offer.",
      },
      source_refs: [8, 9],
    },
  },
  "software-engineer": {
    sources: [
      { ref: 8, title: "Software and Software Services Industry in 2023, 3-Year Forecast", publisher: "depa", url: "https://www.depa.or.th/storage/app/media/file-announce/01%20SW%202023_compressed.pdf", tier: "primary" },
      { ref: 9, title: "ปัญหากำลังคนด้านดิจิทัลในไทย", publisher: "depa", url: "https://www.depa.or.th/th/article-view/Digital-workforce", tier: "primary" },
    ],
    th: {
      eyebrow: "ตลาดไทย · คาดการณ์ปี 2569",
      title: "งานนี้หาง่ายแค่ไหนในไทย?",
      body: "ตลาดใหญ่แต่ไม่ได้โตแบบไร้การแข่งขัน depa คาดความต้องการบุคลากรซอฟต์แวร์ 150,071 คนในปี 2569 เพิ่ม 2.05% จากปีก่อน และรายงานอัตราว่างงานนักพัฒนา 6% ในกรุงเทพฯ เทียบกับ 13% ต่างจังหวัด จึงต้องหักคะแนนทั้งการแข่งขันระดับเริ่มต้นและความกระจุกตัวของงาน",
      job_access: {
        score: 63,
        label: "ปานกลางค่อนไปทางง่ายในกรุงเทพฯ",
        confidence: "medium",
        demand_score: 7,
        competition_score: 5,
        entry_barrier_score: 4,
        applicant_data: "ยังไม่มีข้อมูลผู้สมัครต่อ 1 ตำแหน่ง Software Engineer ทั้งประเทศ คะแนนการแข่งขันจึงใช้การเติบโตของกำลังคนและอัตราว่างงานนักพัฒนาแยกพื้นที่เป็นตัวแทน",
        methodology: sharedMethodology,
      },
      source_refs: [8, 9],
    },
    en: {
      eyebrow: "Thailand market · 2026 forecast",
      title: "How easy is it to find this job?",
      body: "The market is large but not competition-free. depa forecasts demand for 150,071 software personnel in 2026, up 2.05%, and reports developer unemployment of 6% in Bangkok versus 13% outside Bangkok.",
      job_access: {
        score: 63,
        label: "Moderate; easier in Bangkok",
        confidence: "medium",
        demand_score: 7,
        competition_score: 5,
        entry_barrier_score: 4,
        applicant_data: "No reliable nationwide applicants-per-opening figure exists for Software Engineer roles; workforce growth and regional developer unemployment are used as competition proxies.",
        methodology: "Formula: demand 50% + inverse competition 25% + inverse entry barrier 25%. This is not a probability of receiving an offer.",
      },
      source_refs: [8, 9],
    },
  },
};

async function updateTarget(target) {
  if (!target.url || !target.key) {
    throw new Error(`Missing credentials for ${target.name}`);
  }
  const supabase = createClient(target.url, target.key);

  for (const [slug, update] of Object.entries(updates)) {
    const { data: field, error: fieldError } = await supabase
      .from("radar_fields")
      .select("id")
      .eq("slug", slug)
      .single();
    if (fieldError) throw fieldError;

    for (const source of update.sources) {
      const { data: existing, error: sourceReadError } = await supabase
        .from("radar_sources")
        .select("id")
        .eq("field_id", field.id)
        .eq("ref", source.ref)
        .maybeSingle();
      if (sourceReadError) throw sourceReadError;

      const payload = { ...source, field_id: field.id };
      const sourceResult = existing
        ? await supabase.from("radar_sources").update(payload).eq("id", existing.id)
        : await supabase.from("radar_sources").insert(payload);
      if (sourceResult.error) throw sourceResult.error;
    }

    const { data: card, error: cardReadError } = await supabase
      .from("radar_cards")
      .select("id,content_th,content_en")
      .eq("field_id", field.id)
      .eq("kind", "marketThailand")
      .single();
    if (cardReadError) throw cardReadError;

    const { error: cardUpdateError } = await supabase
      .from("radar_cards")
      .update({
        content_th: { ...(card.content_th ?? {}), ...update.th },
        content_en: { ...(card.content_en ?? {}), ...update.en },
      })
      .eq("id", card.id);
    if (cardUpdateError) throw cardUpdateError;
  }

  console.log(`Updated ${Object.keys(updates).length} radar careers in ${target.name}`);
}

for (const target of targets) {
  await updateTarget(target);
}
