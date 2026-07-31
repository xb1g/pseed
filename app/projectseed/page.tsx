import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { DawnScene } from "@/components/projectseed/dawn-scene";
import {
  CONTACT,
  formatThb,
  IS_OPEN_FOR_SALE,
  PRICE_THB,
  SCHOLARSHIP_SEATS,
  TOTAL_SEATS,
} from "@/lib/projectseed/offer";

export const metadata: Metadata = {
  title: "ProjectSeed — ทำโปรเจกต์จริง ก่อนยื่นพอร์ต TCAS รอบ 1",
  description:
    "ค่ายที่ไม่ได้ขายใบเกียรติบัตร นักเรียนทำโปรเจกต์ของตัวเอง มีผู้ใช้จริง มีเอกสาร พร้อมคอมมูนิตี้และพี่เลี้ยงศิษย์เก่า 2,990฿ รับ 20 ที่นั่ง",
};

export default function ProjectSeedPage() {
  return (
    <div className="dawn-theme relative min-h-screen overflow-hidden">
      <DawnScene />

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-col gap-14 px-4 py-12 sm:px-6 sm:py-16">
        <Hero />
        <TheWindow />
        <WhatYouGet />
        <WhoItIsFor />
        <PriceCard />
        <StraightTalk />
        <Safety />
        <CallToAction />
      </main>
    </div>
  );
}

function Hero() {
  return (
    <header className="flex flex-col gap-5">
      <p className="dawn-eyebrow">ProjectSeed</p>

      <h1 className="text-3xl font-bold leading-tight text-white sm:text-[2.6rem] sm:leading-[1.15]">
        ทำโปรเจกต์จริง
        <br />
        ก่อนยื่นพอร์ต TCAS รอบ 1
      </h1>

      <hr className="dawn-rule" />

      <p className="text-lg leading-relaxed text-slate-300">
        เราไม่ได้ขายใบเกียรติบัตร นักเรียนจะได้โปรเจกต์ที่ทำเอง
        มีคนใช้จริง สัมภาษณ์ผู้ใช้จริง และมีบันทึกว่าทำมายังไง
      </p>

      {/* The single warm accent on this page. The guarantee and the refusal to
          over-promise are the same sentence, and that pairing is the offer. */}
      <div className="dawn-keynote">
        <p className="text-[15px] leading-relaxed text-slate-200">
          <span className="font-semibold text-amber-200">
            เรารับประกันว่าโปรเจกต์จะเสร็จ — ไม่รับประกันว่าจะติด
          </span>
          <br />
          คณะกรรมการคัดเลือกไม่ได้อยู่ในมือเรา ใครบอกว่ารับประกันที่นั่งให้ได้ คนนั้นโกหก
          <br />
          แต่โปรเจกต์ที่นักเรียนทำเอง เป็นเรื่องจริงไม่ว่าใครจะอ่านหรือไม่อ่าน
        </p>
      </div>
    </header>
  );
}

function TheWindow() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="dawn-eyebrow">ทำไมต้องรอบพอร์ต</h2>
      <p className="text-[15px] leading-relaxed text-slate-300">
        ตลอดการศึกษาไทย มีอยู่ช่องเดียวที่ระบบยอมให้นักเรียนส่ง
        <span className="text-white"> สิ่งที่ตัวเองสร้าง</span> แทนคะแนนสอบ — คือพอร์ตใน TCAS รอบ 1
      </p>
      <p className="text-[15px] leading-relaxed text-slate-300">
        แต่ช่องนั้นกำลังถูกถมด้วยโปรเจกต์ที่ซื้อมา จ้างทำ หรือปั้นให้ดูดีในสามวัน
        ครอบครัวที่จ่ายไหวก็ได้พอร์ตที่ดูดีกว่า ทั้งที่เด็กไม่ได้ทำอะไรเลย
      </p>
      <p className="text-[15px] leading-relaxed text-slate-300">
        <span className="text-white">เราอยู่ตรงช่องนั้น และไม่ยอมให้มันเป็นแบบนั้น</span>{" "}
        นักเรียนลงมือทำเอง เราคอยถามคำถามที่ยาก และไม่ทำงานแทน
      </p>
    </section>
  );
}

function WhatYouGet() {
  const items = [
    {
      title: "คอมมูนิตี้ที่การลงมือทำเป็นเรื่องปกติ",
      body: "ห้องที่มีคนกำลังสร้างอะไรอยู่ทุกวัน โพสต์ความคืบหน้าในฟอรัม ถามได้ ตอบกัน — นี่คือสิ่งที่หายไปหลังค่ายจบ และเป็นเหตุผลหลักที่คนเลิกทำ",
    },
    {
      title: "พี่เลี้ยงที่เพิ่งผ่าน TCAS มาเอง",
      body: "ศิษย์เก่าที่กลับมาสอน ไม่ใช่เพราะเราจ้าง แต่เพราะเขาอยากกลับมา เขาเพิ่งเจอสิ่งที่นักเรียนกำลังกลัวอยู่",
    },
    {
      title: "โปรเจกต์ที่มีคนใช้จริง",
      body: "ไม่ใช่แบบสอบถาม ไม่ใช่โปสเตอร์รณรงค์ — ต้องมีคนจริงที่นักเรียนไปคุยด้วยได้ และต้องมีบันทึกว่าเขาว่ายังไง",
    },
    {
      title: "Radar และ Passion Map",
      body: "เครื่องมือสำรวจเส้นทางอาชีพ ใช้ตอนยังไม่รู้ว่าอยากทำอะไร",
    },
    {
      title: "คลาสกลุ่มและหลักสูตร",
      body: "โครงสร้างที่ย้อนกลับมาจากวันยื่นพอร์ต ไม่ใช่คอร์สที่เรียนไปเรื่อย ๆ",
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="dawn-eyebrow">ได้อะไรบ้าง</h2>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.title} className="ei-card ei-card--static p-5">
            <h3 className="mb-1.5 text-base font-semibold text-white">{item.title}</h3>
            <p className="text-[15px] leading-relaxed text-slate-300">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhoItIsFor() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="dawn-eyebrow">เหมาะกับใคร</h2>

      <div className="ei-card ei-card--static p-5">
        <h3 className="mb-3 text-base font-semibold text-white">ใช่</h3>
        <ul className="dawn-list flex flex-col gap-2 text-[15px] leading-relaxed text-slate-300">
          <li>
            <span className="text-white">ม.6</span> ที่ต้องยื่นพอร์ตรอบ 1
            และอยากได้โปรเจกต์ที่ตอบคำถามกรรมการได้จริง
          </li>
          <li>
            <span className="text-white">ม.4 – ม.5</span> ที่อยากเริ่มก่อน
            มีเวลาทำให้ลึกกว่าเดิม
          </li>
          <li>คนที่ยอมลงมือทำเอง แม้ตอนแรกจะยังไม่รู้ว่าจะทำอะไร</li>
        </ul>
      </div>

      <div className="ei-card ei-card--static p-5">
        <h3 className="mb-3 text-base font-semibold text-white">ไม่ใช่</h3>
        <ul className="dawn-list flex flex-col gap-2 text-[15px] leading-relaxed text-slate-300">
          <li>คนที่อยากได้โปรเจกต์สำเร็จรูป หรืออยากให้คนอื่นทำให้</li>
          <li>ผู้ปกครองที่อยากซื้อผลลัพธ์ให้ลูก โดยที่ลูกยังไม่อยากทำ</li>
          <li>คนที่ต้องการการรับประกันว่าจะสอบติด — เราไม่มีให้</li>
        </ul>
      </div>
    </section>
  );
}

function PriceCard() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="dawn-eyebrow">ราคาและเงื่อนไข</h2>

      <div className="ei-card ei-card--static p-6">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-4xl font-bold text-white">{formatThb(PRICE_THB)}</span>
          <span className="text-[15px] text-slate-400">จ่ายครั้งเดียว ไม่มีค่าใช้จ่ายซ่อน</span>
        </div>

        <hr className="dawn-rule my-5" />

        <ul className="dawn-list flex flex-col gap-2.5 text-[15px] leading-relaxed text-slate-300">
          <li>
            <span className="text-white">ราคาเดียว ไม่มีตัวเสริม</span> — เราตัดแพ็กเกจพี่เลี้ยงแบบจ่ายเพิ่มออก
            เพราะมันจะทำให้คนจ่ายไหวได้โปรเจกต์ดีกว่า ซึ่งคือระบบที่เราตั้งใจต่อต้าน
          </li>
          <li>
            <span className="text-white">คืนเงิน 100%</span> จนกว่านักเรียนจะส่งงานชิ้นแรก
            หลังจากนั้นไม่คืน — เพราะหลังจุดนั้นพี่เลี้ยงลงเวลาไปแล้ว
          </li>
          <li>
            <span className="text-white">ทุน {SCHOLARSHIP_SEATS} ที่นั่ง</span> ทุกรุ่น
            สำหรับคนที่จ่ายไม่ไหว ทักมาคุยได้เลย ไม่ต้องเขินอาย
          </li>
          <li>
            <span className="text-white">ชวนรุ่นน้อง ม.4 – ม.5 ได้ส่วนลด</span> — ชวนเพื่อน ม.6 ไม่ได้
            เพราะรอบพอร์ตพวกเธอแย่งที่นั่งกันเอง เราจะไม่ให้ใครต้องเลือกระหว่างส่วนลดกับเพื่อน
          </li>
          <li>
            <span className="text-white">รับ {TOTAL_SEATS} คน</span> เพราะเท่านี้คือจำนวนที่เราดูแลไหวจริง ๆ
          </li>
          <li>จ่ายผ่าน PromptPay โอนตรง ยังไม่มีระบบตัดบัตร</li>
        </ul>
      </div>
    </section>
  );
}

/**
 * The honest section. The programme's entire claim is that it is not the
 * credential factory it competes with — which is only credible if the page
 * says the unflattering things too. Nothing here may be softened, and no
 * outcome claim may be added until real outcome data exists (the working rules
 * in PROJECTSEED-STRATEGY.md forbid substantiating impact from conversational
 * outreach).
 */
function StraightTalk() {
  const points = [
    {
      title: "นี่คือรุ่นที่ 1",
      body: "ยังไม่มีใครจบจากรุ่นนี้ เพราะยังไม่เคยมีรุ่นนี้ ถ้าอยากได้ของที่พิสูจน์แล้ว รุ่นนี้ยังไม่ใช่",
    },
    {
      title: "ราคานี้เป็นราคาทดลอง",
      body: "รุ่นต่อไปอาจไม่เท่านี้ เราจะไม่สัญญาว่าราคาจะคงเดิม เพราะเรายังไม่รู้ว่าดูแลหนึ่งคนใช้เวลาเท่าไหร่จริง ๆ",
    },
    {
      title: "เราไม่มีสถิติผลลัพธ์มาโชว์",
      body: "18 เดือน 4 โปรดักต์ นักเรียนราว 1,300 คน — แล้วเราไม่เคยเก็บข้อมูลผลลัพธ์เลย นั่นคือความผิดพลาดของเราเอง รุ่นนี้เราจะเริ่มเก็บ",
    },
    {
      title: "เราไม่รับประกันการเข้ามหาลัย",
      body: "และจะไม่มีวันรับประกัน ระบบคัดเลือกไม่ได้อยู่ในมือเรา",
    },
  ];

  return (
    <section className="flex flex-col gap-4">
      <h2 className="dawn-eyebrow">พูดกันตรง ๆ ก่อนจ่าย</h2>
      <p className="text-[15px] leading-relaxed text-slate-400">
        ถ้าเราอยากขายอย่างเดียว เราคงไม่เขียนส่วนนี้
      </p>
      <div className="ei-card ei-card--static p-5">
        <ul className="flex flex-col gap-4">
          {points.map((point) => (
            <li key={point.title}>
              <p className="mb-1 text-[15px] font-semibold text-amber-200/90">{point.title}</p>
              <p className="text-[15px] leading-relaxed text-slate-300">{point.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Safety() {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="dawn-eyebrow">ความปลอดภัยของนักเรียน</h2>
      <div className="ei-card ei-card--static p-5">
        <p className="mb-3 text-[15px] leading-relaxed text-slate-300">
          พี่เลี้ยงเป็นรุ่นพี่วัยมหาลัย และนักเรียนส่วนใหญ่ยังไม่บรรลุนิติภาวะ
          เราจึงมีนโยบายคุ้มครองเด็กเป็นลายลักษณ์อักษร และเปิดให้อ่านได้ทุกคน
        </p>
        <p className="mb-4 text-[15px] leading-relaxed text-slate-300">
          <span className="text-white">
            กติกาที่ห้ามผิดเด็ดขาด: พี่เลี้ยงห้ามทักแชทส่วนตัวกับนักเรียนที่อายุต่ำกว่า 18 ปี
          </span>{" "}
          ทุกอย่างอยู่ในกลุ่มที่มีผู้ใหญ่คนที่สองอยู่ด้วย ผู้ปกครองขอดูได้ทุกเมื่อ
        </p>
        <Link
          href="/projectseed/safeguarding"
          className="text-[15px] text-blue-300 underline underline-offset-4 hover:text-blue-200"
        >
          อ่านนโยบายคุ้มครองเด็กฉบับเต็ม
        </Link>
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="flex flex-col gap-4">
      <hr className="dawn-rule" />

      <h2 className="text-2xl font-bold text-white">สนใจ? ทักมาคุยก่อน</h2>

      <p className="text-[15px] leading-relaxed text-slate-300">
        {IS_OPEN_FOR_SALE
          ? "ทักมาได้เลย เราจะส่งรายละเอียดการชำระเงินให้"
          : "ตอนนี้เรายังไม่เปิดขายที่นั่ง — เรากำลังปิดงานด้านความปลอดภัยและหลักสูตรให้เสร็จก่อน ทักมาคุยได้เลย เราจะเล่าให้ฟังตรง ๆ ว่าเหมาะกับลูกหรือนักเรียนคนนั้นไหม และแจ้งเมื่อเปิดรับ"}
      </p>

      <div className="ei-card ei-card--static flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
        <Image
          src={CONTACT.lineQrUrl}
          alt="QR code สำหรับเพิ่มเพื่อน LINE ของ PassionSeed"
          width={132}
          height={132}
          unoptimized
          className="rounded-lg bg-white p-2"
        />
        <div className="flex flex-col gap-3">
          <p className="text-[15px] leading-relaxed text-slate-300">
            สแกน QR เพื่อคุยทาง LINE — ผู้ปกครองถามได้ นักเรียนถามได้
          </p>
          <Link
            href={CONTACT.discordPath}
            className="ei-button-dawn min-h-[44px] w-fit self-start !px-5 !py-2.5 !text-sm"
          >
            เข้าคอมมูนิตี้ Discord
          </Link>
        </div>
      </div>

      {/* No-commitment entry point. Costs nothing, needs no account, and is the
          honest way to find out whether the student actually wants this. */}
      <div className="rounded-xl border border-amber-200/20 bg-slate-950/40 p-5">
        <p className="mb-2 text-[15px] leading-relaxed text-slate-300">
          <span className="font-semibold text-amber-200">ยังไม่พร้อมจ่าย? เริ่มฟรีได้เลย</span>
          <br />
          เอาพรอมป์ของเราไปคุยกับ AI 20 นาที แล้วจะได้โปรเจกต์ 1 อัน
          กับสิ่งที่ต้องทำในสัปดาห์นี้ 1 อย่าง ไม่ต้องสมัคร ไม่ต้องจ่าย
        </p>
        <Link
          href="/projectseed/prompt"
          className="text-[15px] text-blue-300 underline underline-offset-4 hover:text-blue-200"
        >
          ไปที่พรอมป์หาโปรเจกต์ →
        </Link>
      </div>
    </section>
  );
}
