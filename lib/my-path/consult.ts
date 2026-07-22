/**
 * นัดคุยกับทีม PassionSeed — ปลายทางเดียวกันทั้งหน้าแผนและ My Path
 * ตั้งค่าปลายทางจริงผ่าน NEXT_PUBLIC_PLAN_CONSULT_URL, fallback เป็น LINE OA
 */
export const CONSULT_URL =
  process.env.NEXT_PUBLIC_PLAN_CONSULT_URL || "https://lin.ee/uFruUqa";

export const CONSULT_PRICE_THB = 100;
