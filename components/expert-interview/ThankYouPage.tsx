"use client";

import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/language-context";

export function ThankYouPage() {
  const { language } = useLanguage();

  const content = {
    en: {
      title: "Thank you!",
      subtitle: "Your interview has been submitted. We'll draft a PathLab from what you shared, and you review and approve it before any student sees it.",
      nextTitle: "What happens next",
      step1: "Check your email: we sent you a link to claim your profile and manage your data.",
      step2: "Our team reviews your submission (usually within 3 days)",
      step3: "We draft a PathLab from what you shared",
      step4: "You review, request changes, or approve. Nothing publishes without you.",
      step5: "Students explore your career through hands-on activities, with your name on it",
      homeBtn: "Back to home"
    },
    th: {
      title: "ขอบคุณ!",
      subtitle: "ส่งข้อมูลเรียบร้อยแล้ว เราจะสร้างร่าง PathLab จากสิ่งที่คุณแบ่งปัน แล้วให้คุณรีวิวและอนุมัติก่อนที่นักเรียนจะได้เห็น",
      nextTitle: "ขั้นตอนต่อไป",
      step1: "ตรวจสอบอีเมลของคุณ: เราส่งลิงก์ให้คุณยืนยันโปรไฟล์และจัดการข้อมูลของคุณแล้ว",
      step2: "ทีมงานของเราตรวจสอบข้อมูลของคุณ (ปกติภายใน 3 วัน)",
      step3: "เราสร้างร่าง PathLab จากสิ่งที่คุณแบ่งปัน",
      step4: "คุณรีวิว ขอแก้ไข หรืออนุมัติ ไม่มีอะไรเผยแพร่โดยไม่ผ่านคุณ",
      step5: "นักเรียนได้ลงมือทำจริง พร้อมชื่อคุณอยู่บนผลงาน",
      homeBtn: "กลับสู่หน้าหลัก"
    }
  };

  const t = content[language];

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 space-y-6">
      <div className="p-4 rounded-full bg-green-500/10 border border-green-500/20">
        <CheckCircle className="h-12 w-12 text-green-400" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">{t.title}</h2>
        <p className="text-gray-400 max-w-md">
          {t.subtitle}
        </p>
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 max-w-md w-full text-left space-y-3">
        <h3 className="text-sm font-semibold text-white">{t.nextTitle}</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">1.</span>
            {t.step1}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">2.</span>
            {t.step2}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">3.</span>
            {t.step3}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">4.</span>
            {t.step4}
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-400 mt-0.5">5.</span>
            {t.step5}
          </li>
        </ul>
      </div>

      <Button asChild variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
        <Link href="/">{t.homeBtn}</Link>
      </Button>
    </div>
  );
}
