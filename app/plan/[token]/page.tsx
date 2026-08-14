import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getStudentPlanByToken,
  incrementPlanViewCount,
} from "@/lib/supabase/student-plans";
import { StudentPlanPageView } from "@/components/plans/StudentPlanPageView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const plan = await getStudentPlanByToken(token);

  if (!plan) {
    return {
      title: "ไม่พบแผนพอร์ต | PassionSeed",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `แผนเตรียมพอร์ต ${plan.target_field} (${plan.student_name}) | PassionSeed`,
    description: `แผน 6 เดือนเตรียมตัวเข้ามหาวิทยาลัยสำหรับ ${plan.student_name} (${plan.grade_level}) สาย ${plan.target_field}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function StudentPlanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const plan = await getStudentPlanByToken(token);

  if (!plan) {
    notFound();
  }

  // Record page view asynchronously
  incrementPlanViewCount(token).catch((err) =>
    console.error("Failed to increment plan view count:", err)
  );

  return <StudentPlanPageView plan={plan} />;
}
