/**
 * Hard-coded curriculum for the Web Developer PathLab.
 *
 * The map's own node titles are placeholder data ("New Noded", "New Noded
 * (Copy)"), so the lobby gate reads this file instead of the path graph. When
 * real content is authored per-map, delete the `WEB_DEV_PATH` import from
 * LobbyCodeGate and go back to `map.journey`.
 *
 * Copy is bilingual: Thai leads (primary audience), English follows. Thai text
 * renders in Bai Jamjuree via the font-sans fallback, since Libre Franklin
 * carries no Thai glyphs.
 */

export interface PathDay {
  day: number;
  /** Short verb phrase: what they walk away having built. */
  titleTh: string;
  titleEn: string;
  /** One concrete sentence about the day's work. */
  bodyTh: string;
  /** The 2-4 things they actually touch. Nouns, not skills-speak. */
  skills: string[];
  /** Marks the last day so it can be framed as a finale. */
  isFinale?: boolean;
}

export interface PathContent {
  slug: string;
  titleTh: string;
  titleEn: string;
  /** Sits under the title. Says who it is for and what they end with. */
  taglineTh: string;
  /** Total working days. */
  days: PathDay[];
  /** What exists at the end that did not exist before. */
  outcomeTh: string;
  level: string;
  /** Hours per day, shown as a fact so expectations are set up front. */
  hoursPerDay: string;
}

export const WEB_DEV_PATH: PathContent = {
  slug: "web-developer",
  titleTh: "นักพัฒนาเว็บ",
  titleEn: "Web Developer",
  taglineTh:
    "เขียนเว็บแรกของคุณให้เสร็จและใช้งานได้จริงบนอินเทอร์เน็ต ไม่ต้องมีพื้นฐานมาก่อน",
  hoursPerDay: "3-4 ชม./วัน",
  level: "เริ่มต้น",
  outcomeTh:
    "จบแล้วคุณจะมีเว็บไซต์ของตัวเองที่ออนไลน์อยู่จริง พร้อมลิงก์ที่ส่งให้ใครดูก็ได้",
  days: [
    {
      day: 1,
      titleTh: "หน้าเว็บแรกของคุณ",
      titleEn: "Your first page",
      bodyTh:
        "เขียน HTML หน้าแรกด้วยตัวเอง แล้วเปิดดูในเบราว์เซอร์ เข้าใจว่าเว็บประกอบขึ้นจากอะไร",
      skills: ["HTML", "โครงสร้างหน้าเว็บ", "แท็กพื้นฐาน"],
    },
    {
      day: 2,
      titleTh: "ทำให้เป็นสไตล์ของคุณ",
      titleEn: "Make it yours",
      bodyTh:
        "จัดวางองค์ประกอบ เลือกสีและฟอนต์ ทำให้หน้าเว็บดูดีทั้งบนจอคอมและมือถือ",
      skills: ["CSS", "Flexbox", "สีและฟอนต์", "Responsive"],
    },
    {
      day: 3,
      titleTh: "ทำให้มันตอบสนอง",
      titleEn: "Make it respond",
      bodyTh:
        "เพิ่ม JavaScript ให้ปุ่มกดได้ ฟอร์มทำงานได้ และหน้าเว็บโต้ตอบกับคนใช้ได้จริง",
      skills: ["JavaScript", "Event", "DOM"],
    },
    {
      day: 4,
      titleTh: "ปล่อยขึ้นออนไลน์",
      titleEn: "Ship it",
      bodyTh:
        "นำเว็บขึ้นออนไลน์ ได้ลิงก์เป็นของตัวเอง แล้วนำเสนอสิ่งที่สร้างให้เพื่อนในกลุ่มดู",
      skills: ["Deploy", "โดเมน", "นำเสนองาน"],
      isFinale: true,
    },
  ],
};
