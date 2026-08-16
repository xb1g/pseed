import type { PathContent } from "./web-dev-path";

export const STARTUP_PATH: PathContent = {
  slug: "startup",
  titleTh: "สร้างสตาร์ทอัพ",
  titleEn: "Startup PathLab",
  taglineTh:
    "หาให้เจอว่าคนยอมจ่ายเพื่ออะไร แล้วปั้นโปรเจกต์จากศูนย์จนได้พิตช์เด็คและ MVP จริง",
  hoursPerDay: "3-4 ชม./วัน",
  level: "เริ่มต้น",
  outcomeTh:
    "จบแล้วคุณจะมีพิตช์เด็คและ MVP ที่ทดสอบกับคนจริง พร้อมข้อพิสูจน์ว่าไอเดียของคุณมีคนยอมจ่าย",
  days: [
    {
      day: 1,
      titleTh: "ล่าปัญหา & ทำความเข้าใจลูกค้า",
      titleEn: "Problem Hunt & Discovery",
      bodyTh:
        "ค้นหาปัญหาที่เจ็บจริง ให้คะแนนความถี่ และคุยกับคน 3 คนเพื่อฟังปัญหาแบบไม่เข้าข้างตัวเอง",
      skills: ["ล่าปัญหา", "Customer Discovery", "User Persona"],
    },
    {
      day: 2,
      titleTh: "โมเดลธุรกิจ & ความคุ้มค่า",
      titleEn: "Business Model & Economics",
      bodyTh:
        "เขียน Lean Canvas วางวิธีสร้างรายได้ และคำนวณตัวเลขว่าต้องมีลูกค้ากี่คนถึงจะไม่ขาดทุน",
      skills: ["Lean Canvas", "ตั้งราคา", "จุดคุ้มทุน"],
    },
    {
      day: 3,
      titleTh: "สร้าง MVP ที่จับต้องได้",
      titleEn: "Build Minimum Viable Product",
      bodyTh:
        "ลงมือทำของจริงที่เล็กที่สุด เช่น Landing Page หรือ Prototype เพื่อนำไปทดสอบกับกลุ่มเป้าหมาย",
      skills: ["MVP", "Prototype", "ทดสอบกับคนจริง"],
    },
    {
      day: 4,
      titleTh: "ทดสอบและหาผู้ใช้กลุ่มแรก",
      titleEn: "Experiment & Early Traction",
      bodyTh:
        "วางแผนหาผู้ใช้ 50-100 คนแรกโดยไม่พึ่งพายิงแอด พร้อมวัดผลว่าคนสนใจจริงไหม",
      skills: ["First 100 Users", "Go-To-Market", "วัด Conversion"],
    },
    {
      day: 5,
      titleTh: "Pitch Day & ก้าวต่อไป",
      titleEn: "Pitch Day & Next Milestone",
      bodyTh:
        "สรุปสิ่งที่ได้เรียนรู้เป็น Pitch Deck เล่าเรื่องธุรกิจให้น่าเชื่อถือใน 3 นาที พร้อมลุยตลาดจริง",
      skills: ["Pitch Deck", "Storytelling", "นำเสนองาน"],
      isFinale: true,
    },
  ],
};
