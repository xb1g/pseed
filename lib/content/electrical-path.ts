import type { PathContent } from "./web-dev-path";

export const ELECTRICAL_ENGINEERING_PATH: PathContent = {
  slug: "electrical-engineering",
  titleTh: "วิศวกรไฟฟ้า & ฮาร์ดแวร์",
  titleEn: "Electrical & Hardware Engineer",
  taglineTh:
    "เรียนรู้วิธีคิดของวิศวกรไฟฟ้าหน้างานจริง จากการวิเคราะห์วงจร ดีบั๊กฮาร์ดแวร์ สู่การออกแบบระบบที่ทำงานได้จริง",
  hoursPerDay: "3-4 ชม./วัน",
  level: "เริ่มต้นถึงปานกลาง",
  outcomeTh:
    "จบแล้วผู้เรียนจะมี Portfolio ชิ้นงาน Simulation วิเคราะห์วงจรและฮาร์ดแวร์ พร้อมความเข้าใจภาพรวมอาชีพวิศวกรไฟฟ้าอย่างแท้จริง",
  days: [
    {
      day: 1,
      titleTh: "แกะรอยวงจร & Mental Model วิศวกร",
      titleEn: "Circuit Anatomy & Engineering Mindset",
      bodyTh:
        "ทำความเข้าใจว่าวิศวกรไฟฟ้ามองปัญหาอย่างไร จากบล็อกไดอะแกรมสู่วงจรจริง และการอ่าน Schematic ที่ซับซ้อน",
      skills: ["Schematic", "Signal Flow", "Mental Model"],
    },
    {
      day: 2,
      titleTh: "วิเคราะห์ & คำนวณจุดทำงาน (Trade-offs)",
      titleEn: "Component Sizing & Power Budget",
      bodyTh:
        "เลือกอุปกรณ์จริง คำนวณ Power Budget และรับมือกับข้อจำกัดเรื่องความร้อน แรงดัน และสัญญาณรบกวน",
      skills: ["Power Budget", "Voltage Drop", "Thermal Limits"],
    },
    {
      day: 3,
      titleTh: "จำลองการทำงาน & ดีบั๊กสัญญาณ (Simulation)",
      titleEn: "Circuit Simulation & Signal Analysis",
      bodyTh:
        "ใช้เครื่องมือจำลองการทำงานของวงจร ตรวจจับจุดผิดพลาด และเรียนรู้วิธีแก้ปัญหาสัญญาณเพี้ยน",
      skills: ["SPICE Simulation", "Oscilloscope", "Noise Reduction"],
    },
    {
      day: 4,
      titleTh: "เชื่อมต่อไมโครคอนโทรลเลอร์ & เซนเซอร์",
      titleEn: "Sensors & Embedded Interfacing",
      bodyTh:
        "เชื่อมโลกแอนะล็อกสู่ดิจิทัล อ่านค่าเซนเซอร์ และสื่อสารผ่าน Protocol ยอดนิยม (I2C, SPI, UART)",
      skills: ["Embedded Systems", "ADC/Sensors", "I2C/SPI"],
    },
    {
      day: 5,
      titleTh: "Mini-Project: ปล่อยผลงานวิศวกรรมจริง",
      titleEn: "Hardware Architecture & Capstone Pitch",
      bodyTh:
        "สรุปแนวคิดการออกแบบระบบฮาร์ดแวร์ จำลองโจทย์การส่งมอบงานให้ลูกค้า และนำเสนอโซลูชันแบบมืออาชีพ",
      skills: ["System Design", "Hardware Spec", "Engineering Pitch"],
      isFinale: true,
    },
  ],
};
