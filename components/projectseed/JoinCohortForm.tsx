"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { joinCohort } from "@/actions/projectseed";

interface JoinCohortFormProps {
  cohortName: string;
  defaultDisplayName?: string | null;
}

/**
 * The gate for the alumni MVP.
 *
 * A join code rather than an invite table because the audience is a Discord
 * server we already control: posting one code in a channel reaches exactly the
 * people who should get in, and costs no admin screen to maintain.
 */
export function JoinCohortForm({
  cohortName,
  defaultDisplayName,
}: JoinCohortFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState(defaultDisplayName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await joinCohort(code, displayName);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error ?? "เข้าร่วมไม่สำเร็จ");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="ei-card flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-white">เข้าร่วม {cohortName}</h2>
        <p className="text-sm leading-relaxed text-slate-300">
          ใส่โค้ดที่ประกาศไว้ในห้อง Discord ของรุ่น
        </p>
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300/80">
          โค้ดเข้าร่วม
        </span>
        <input
          className="ei-input rounded-xl px-4 py-3 font-mono text-lg uppercase tracking-[0.2em] text-white"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="XXXXXXXX"
          autoComplete="off"
          autoCapitalize="characters"
          required
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-300/80">
          ชื่อที่อยากให้คนในห้องเรียก
        </span>
        <input
          className="ei-input rounded-xl px-4 py-3 text-white"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="ชื่อเล่นก็ได้"
          autoComplete="off"
        />
      </label>

      {error ? (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      <button type="submit" className="ei-button-dawn" disabled={pending}>
        <span>{pending ? "กำลังเข้าร่วม…" : "เข้าร่วมรุ่นนี้"}</span>
      </button>
    </form>
  );
}
