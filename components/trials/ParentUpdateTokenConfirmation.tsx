import Link from "next/link";

interface ParentUpdateTokenConfirmationProps {
  action: string | null;
  kind: "verify" | "unsubscribe";
  status?: string;
}

const COPY = {
  verify: {
    eyebrow: "ยืนยันอีเมลผู้ปกครอง",
    title: "พร้อมรับข่าวความคืบหน้าไหม?",
    description:
      "กดยืนยันด้านล่างเพื่อเริ่มรับเฉพาะหมุดหมายสำคัญของ PathLab — ไม่มีคำตอบส่วนตัวของเด็ก",
    button: "ยืนยันอีเมลนี้",
  },
  unsubscribe: {
    eyebrow: "จัดการข่าวความคืบหน้า",
    title: "หยุดรับอีเมลจาก PathLab นี้?",
    description:
      "กดยืนยันด้านล่างเพื่อหยุดอีเมลทั้งหมด คุณสามารถสมัครใหม่ภายหลังได้จากหน้า PathLab",
    button: "หยุดรับอีเมล",
  },
} as const;

function statusCopy(
  kind: ParentUpdateTokenConfirmationProps["kind"],
  status: string | undefined,
  hasAction: boolean
) {
  if (status === "verified") {
    return {
      title: "ยืนยันอีเมลแล้ว",
      description: "เราจะส่งเฉพาะความคืบหน้าสำคัญ เพื่อให้ครอบครัวช่วยเชียร์ได้ถูกจังหวะ",
    };
  }
  if (status === "unsubscribed") {
    return {
      title: "หยุดรับอีเมลแล้ว",
      description: "เราจะไม่ส่งข่าว PathLab นี้มายังอีเมลของคุณอีก",
    };
  }
  if (status === "expired") {
    return {
      title: "ลิงก์นี้หมดอายุแล้ว",
      description: "กลับไปที่หน้า PathLab แล้วขอลิงก์ยืนยันฉบับใหม่ได้เลย",
    };
  }
  if (status === "not-found" || !hasAction) {
    return {
      title: "ลิงก์นี้ใช้ไม่ได้แล้ว",
      description: "ลิงก์อาจถูกเปลี่ยนหรือใช้งานไปแล้ว เพื่อความปลอดภัยโปรดใช้ลิงก์ล่าสุด",
    };
  }
  return null;
}

export function ParentUpdateTokenConfirmation({
  action,
  kind,
  status,
}: ParentUpdateTokenConfirmationProps) {
  const copy = COPY[kind];
  const result = statusCopy(kind, status, Boolean(action));
  return (
    <main className="dawn-theme relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-blue-950 px-4 py-12 font-bai-jamjuree text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(254,217,92,0.12),transparent_58%)]" />
      <section className="ei-card relative w-full max-w-lg p-7 text-center sm:p-10">
        <p className="text-label-md mb-4 text-blue-300">{copy.eyebrow}</p>
        <h1 className="font-kodchasan text-2xl font-semibold leading-relaxed text-white sm:text-3xl">
          {result?.title ?? copy.title}
        </h1>
        <p className="text-body-md mx-auto mt-4 max-w-md text-slate-300">
          {result?.description ?? copy.description}
        </p>
        {!result && action ? (
          <form action={action} method="post" className="mt-8">
            <button type="submit" className="ei-button-dawn w-full">
              <span>{copy.button}</span>
            </button>
          </form>
        ) : (
          <Link href="/" className="mt-8 inline-flex min-h-12 items-center text-blue-300 underline underline-offset-4">
            กลับหน้าแรก
          </Link>
        )}
        {!result ? (
          <p className="text-body-sm mt-5 text-slate-400">
            เรารอให้คุณกดเอง อีเมลสแกนเนอร์จึงไม่สามารถเปลี่ยนสถานะนี้แทนคุณได้
          </p>
        ) : null}
      </section>
    </main>
  );
}
