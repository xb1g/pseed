import { redirect } from "next/navigation";

import { loadHub } from "@/lib/projectseed/hub";
import { buildSteps } from "@/lib/projectseed/steps";
import { DiscordLinkCard } from "@/components/projectseed/DiscordLinkCard";
import { HubDashboard } from "@/components/projectseed/HubDashboard";
import { JoinCohortForm } from "@/components/projectseed/JoinCohortForm";

export const dynamic = "force-dynamic";

export default async function HubPage() {
  const load = await loadHub();

  if (load.state === "anonymous") {
    redirect(`/login?next=${encodeURIComponent("/projectseed/hub")}`);
  }

  if (load.state === "no-cohort") {
    return (
      <section className="ei-card flex flex-col gap-3 p-6">
        <h1 className="text-xl font-bold text-white">ยังไม่เปิดรุ่น</h1>
        <p className="text-sm leading-relaxed text-slate-300">
          ตอนนี้ยังไม่มีรุ่นที่เปิดรับ ติดตามประกาศในห้อง Discord ได้เลย
        </p>
      </section>
    );
  }

  if (load.state === "not-joined") {
    return <JoinScreen cohortName={load.cohort.name} />;
  }

  const { hub } = load;

  return (
    <>
      <HubDashboard hub={hub} steps={buildSteps(hub)} />

      <DiscordLinkCard
        discordUsername={hub.participant.discord_username}
        discordUserId={hub.participant.discord_user_id}
        needsSync={load.needsDiscordSync}
      />
    </>
  );
}

function JoinScreen({ cohortName }: { cohortName: string }) {
  return (
    <>
      <section className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
          ห้องที่การลงมือสร้างเป็นเรื่องปกติ
        </h1>
        <p className="text-base leading-relaxed text-slate-300">
          เลือกโปรเจกต์ อธิบายว่ามันคืออะไร แล้วบอกว่าคุณเข้าห้องเสียงได้เวลาไหน
          — ที่เหลือเกิดขึ้นใน Discord
        </p>
      </section>

      <JoinCohortForm cohortName={cohortName} />
    </>
  );
}
