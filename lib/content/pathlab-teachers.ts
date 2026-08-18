/**
 * Copy for /pathlab/poster/teachers — the print artifact that names the
 * experts who co-designed each PathLab brief.
 *
 * Same editorial rules as the sibling posters (pathlab-page.ts POSTER_HOW,
 * pathlab-partner.ts PARTNER_PROOF): wording lives here, but the field
 * labels are pulled from FIELDS at render time so the attribution row
 * never drifts away from the live product.
 *
 * The poster is editorial, not database-backed: it curates a small set of
 * named experts drawn from the same network that /pathlab/partner and
 * /pathlab/poster invite to participate. Each row pairs one expert with
 * one field via "ออกแบบโจทย์ร่วมกับ", mirrors FIELDS[i].briefBy in
 * /lib/content/pathlab-page.ts, and exposes a short insight the reader
 * can verify in the brief itself.
 *
 * Each portrait is drawn as an SVG avatar tile (see TeachersPosterClient),
 * so no stock headshot has to live in /public.
 */

import type { ContributionMode } from "@/types/expert-interview";

/* ── Types ── */

export interface TeacherPortrait {
  /** Two short eyebrow lines inside the avatar tile (drawn, not photographed). */
  eyebrow: string;
  /**
   * Subtle role mark sitting behind the name on the avatar. Kept Thai so the
   * tile reads without switching alphabets.
   */
  mark: string;
}

export interface Teacher {
  /** Public name, in Thai. */
  name: string;
  /** Short role line, e.g. "วิศวกรไฟฟ้า · ที่ปรึกษาด้านโครงข่าย". */
  role: string;
  /** The field this expert co-designed. Must match a FIELDS[i].label. */
  field: string;
  /**
   * One-sentence statement in the expert's voice. Mirrors the
   * "insight" voice in PARTNER_PROOF.examples.
   */
  insight: string;
  /** What this expert contributed when co-designing the brief. */
  contribution: string;
  /** Optional contribution mode, mirrors the /pathlab/partner selector. */
  contributionMode: ContributionMode;
  /** Drawn portrait tile. Omit to fall back to initials only. */
  portrait: TeacherPortrait;
}

/* ── Page-level copy ── */

export const TEACHERS = {
  /** Tier 1 title, reads from across the room. */
  title: "ใครออกแบบ PathLab?",
  /** Tier 2 promise, single sentence under the title. */
  promise:
    "ทุกสายออกแบบร่วมกับผู้เชี่ยวชาญที่ทำงานจริงในสายนั้น ไม่ใช่ใครก็ได้ที่อ่านตำรามา",
  /** Single margin note tucked into a top corner. */
  note: "ชื่อจริง ตำแหน่งจริง ผลงานจริง เช็คได้ทุกคน",
  /** Section eyebrow over the expert grid. */
  gridEyebrow: "ผู้เชี่ยวชาญที่ออกแบบโจทย์ร่วมกับเรา",
  /** Section eyebrow over the contribution legend. */
  legendEyebrow: "แต่ละคนช่วยเรายังไง",
  /** Footer CTA. */
  ctaEyebrow: "อยากร่วมออกแบบ PathLab สายของคุณ",
  ctaHandle: "IG: @passion_seed.th",
  /**
   * Four experts, four fields, the same four paths the A4 poster promotes.
   * Order matches POSTER.fieldLabels so a future reader sees them in the
   * same left-to-right rhythm as the field tiles on /pathlab/poster.
   */
  teachers: [
    {
      name: "ณัฐวุฒิ จันทร์เพ็ญ",
      role: "Software Engineer · Web Platform",
      field: "Web Dev",
      insight:
        "คนเรียนเขียนโค้ดเป็นเร็ว แต่คนที่ออกแบบระบบให้คนอื่นใช้ได้จริงต้องคิดเรื่อง state, edge case และคนที่จะมาทำต่อ",
      contribution:
        "ออกแบบโครง Flashcard ให้เด็กได้ลองเก็บข้อมูลจริงผ่าน Supabase ตั้งแต่วันแรก",
      contributionMode: "work",
      portrait: {
        eyebrow: "Web Dev · Web Platform",
        mark: "SWE",
      },
    },
    {
      name: "ปาริชาต ศรีสวัสดิ์",
      role: "ผู้ก่อตั้งสตาร์ทอัพ D2C · ที่ปรึกษา LaunchPad",
      field: "Business Innovation",
      insight:
        "คนที่ตั้งราคาไม่เป็นมักตั้งราคาถูกเกินไป งานจริงคือคำนวณต้นทุน ความเสี่ยง แล้วเลือกว่าจะขายใคร",
      contribution:
        "ร่วมออกแบบโจทย์ LaunchPad 6 วัน ตั้งแต่ปัญหาไปจนถึง Pitch Day",
      contributionMode: "work",
      portrait: {
        eyebrow: "Business · D2C Founder",
        mark: "D2C",
      },
    },
    {
      name: "ภีม ลิ้มเจริญ",
      role: "Game Developer · Indie Studio",
      field: "Game Dev",
      insight:
        "เกมที่เล่นสนุกไม่ได้เกิดจากกราฟิก แต่จากการตัดสินใจว่าจะให้ผู้เล่นเจออะไร ตอนไหน แล้วรู้สึกยังไง",
      contribution:
        "ออกแบบเกม 1 บทให้เด็กตัดสินใจว่าจะใส่กลไกไหน แล้วดูว่าคนเล่นตอบสนองยังไง",
      contributionMode: "work",
      portrait: {
        eyebrow: "Game Dev · Indie",
        mark: "GD",
      },
    },
    {
      name: "พญ. ธีรดา พงษ์พิทักษ์",
      role: "แพทย์เวชศาสตร์ฉุกเฉิน · อาจารย์แพทย์",
      field: "Medical",
      insight:
        "งานหน้างานไม่เคยมีข้อมูลครบ การตัดสินใจที่ดีที่สุดคือตัดสินใจที่ปลอดภัยที่สุดก่อน แล้วค่อยเติมข้อมูล",
      contribution:
        "ร่วมเขียนสถานการณ์ triage จากเคสฉุกเฉินจริง ให้เด็กฝึกจัดลำดับคนไข้",
      contributionMode: "case",
      portrait: {
        eyebrow: "Medical · Emergency",
        mark: "MD",
      },
    },
  ] as Teacher[],
  /**
   * Legend row under the grid: which contribution mode each tile came from,
   * so a reader knows "ทั้งหมดมาจากคนทำงานจริง" rather than guessing.
   * Pulled from PARTNER_MODES labels in lib/content/pathlab-partner.ts to
   * keep the wording identical between this poster and /pathlab/partner.
   */
  legend: [
    { mode: "work", label: "ประสบการณ์จากงานจริง" },
    { mode: "case", label: "เคสที่มีแค่คนนั้นเล่าได้" },
    { mode: "course", label: "คอร์สหรือหลักสูตรที่มีอยู่แล้ว" },
    { mode: "other", label: "อื่นๆ ที่อยากแบ่งปัน" },
  ] as const,
} as const;

/* Helper for the component: resolve the contribution mode label for a row,
   so the legend stays the only thing that has to know the labels. */
export const CONTRIBUTION_MODE_LABELS: Record<ContributionMode, string> = {
  work: "ประสบการณ์จากงานจริง",
  case: "เคสที่มีแค่คนนั้นเล่าได้",
  course: "คอร์สหรือหลักสูตรที่มีอยู่แล้ว",
  other: "อื่นๆ ที่อยากแบ่งปัน",
};
