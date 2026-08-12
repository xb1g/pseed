"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { PhaseShell } from "../components/phase-shell";
import { requiresGuardianConsent } from "@/lib/profile-completion";
import type { CollectedData, OnboardingStep } from "@/types/onboarding";

export type AccountPrefill = {
  full_name: string | null;
  username: string | null;
  date_of_birth: string | null;
  education_level: "high_school" | "university" | "unaffiliated" | null;
};

interface Props {
  data: CollectedData;
  advance: (_step: OnboardingStep, _updates: Partial<CollectedData>) => void;
  goBack: () => void | Promise<void>;
  isAnonymous: boolean;
  prefill?: AccountPrefill | null;
}

const EDUCATION_COPY = {
  en: {
    high_school: "High School",
    university: "University",
    unaffiliated: "Other",
  },
  th: {
    high_school: "ม.ปลาย",
    university: "มหาวิทยาลัย",
    unaffiliated: "อื่นๆ",
  },
} as const;

const INPUT_CLASS =
  "min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder:text-white/30 focus:border-blue-400/50 focus:outline-none";

export function AccountPhase({ data, isAnonymous, goBack, prefill }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(
    () => prefill?.full_name?.trim() || data.name?.trim() || ""
  );
  const [username, setUsername] = useState(
    () => prefill?.username?.trim() || ""
  );
  const [dob, setDob] = useState(() => prefill?.date_of_birth || "");
  const [education, setEducation] = useState<
    "high_school" | "university" | "unaffiliated"
  >(prefill?.education_level || "high_school");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("");
  const [guardianApproved, setGuardianApproved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEn = (data.language || "th") === "en";
  const educationCopy = EDUCATION_COPY[isEn ? "en" : "th"];
  const needsGuardian = requiresGuardianConsent(dob);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    if (needsGuardian) {
      if (!guardianPhone.trim() || !guardianRelationship.trim()) {
        setError(
          isEn
            ? "Please add parent or guardian contact details."
            : "กรุณาใส่ข้อมูลผู้ปกครอง"
        );
        setLoading(false);
        return;
      }
      if (!guardianApproved) {
        setError(
          isEn
            ? "Please confirm parent or guardian approval."
            : "กรุณายืนยันการอนุญาตจากผู้ปกครอง"
        );
        setLoading(false);
        return;
      }
    }

    const collected = {
      ...data,
      name: fullName.trim() || data.name,
    };

    const body: Record<string, unknown> = {
      username,
      full_name: fullName.trim(),
      date_of_birth: dob,
      education_level: education,
      preferred_language: data.language || "th",
      interests: data.interests || [],
      collected_data: collected,
    };

    if (isAnonymous) {
      body.email = email;
      body.password = password;
    }

    if (needsGuardian) {
      body.guardian_phone = guardianPhone.trim();
      body.guardian_relationship = guardianRelationship.trim();
      body.guardian_approved = true;
    }

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        if (response.status === 401) {
          setError(isEn ? "Wrong password." : "รหัสผ่านไม่ถูกต้อง");
        } else {
          setError(
            json?.error || (isEn ? "Something went wrong." : "เกิดข้อผิดพลาด")
          );
        }
        return;
      }

      router.push("/me");
    } catch {
      setError(isEn ? "Something went wrong." : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PhaseShell
      eyebrow={isEn ? "Finish Setup" : "ขั้นตอนสุดท้าย"}
      title={
        isEn
          ? "Last step — save your progress"
          : "ขั้นตอนสุดท้าย — บันทึกความคืบหน้า"
      }
      subtitle={
        isAnonymous
          ? isEn
            ? "Create your account to save everything."
            : "สร้างบัญชีเพื่อบันทึกทุกอย่าง"
          : isEn
            ? "Complete your profile and we’ll take you into PassionSeed."
            : "ตั้งค่าโปรไฟล์ให้เสร็จ แล้วเข้าสู่ PassionSeed"
      }
      backLabel={isEn ? "Back" : "ย้อนกลับ"}
      onBack={() => {
        void goBack();
      }}
      footer={
        <button
          type="submit"
          form="onboard-account-form"
          disabled={loading || (needsGuardian && !guardianApproved)}
          className="ei-button-dawn min-h-12 w-full justify-center py-3.5 text-base font-semibold disabled:opacity-40 sm:min-h-0 sm:py-3 sm:text-sm"
        >
          {loading
            ? isEn
              ? "Saving..."
              : "กำลังบันทึก..."
            : isEn
              ? "Go to PassionSeed →"
              : "ไปที่ PassionSeed →"}
        </button>
      }
    >
      <form
        id="onboard-account-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-3.5"
      >
        {isAnonymous ? (
          <>
            <input
              required
              type="email"
              autoComplete="email"
              placeholder={isEn ? "Email" : "อีเมล"}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT_CLASS}
            />
            <input
              required
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder={
                isEn
                  ? "Password (min 8 characters)"
                  : "รหัสผ่าน (อย่างน้อย 8 ตัว)"
              }
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={INPUT_CLASS}
            />
          </>
        ) : null}

        <input
          required
          autoComplete="name"
          placeholder={isEn ? "Full name" : "ชื่อ-นามสกุล"}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className={INPUT_CLASS}
        />

        <input
          required
          autoComplete="username"
          placeholder={isEn ? "Username" : "ชื่อผู้ใช้"}
          value={username}
          onChange={(event) =>
            setUsername(
              event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
            )
          }
          className={INPUT_CLASS}
        />

        <input
          required
          type="date"
          value={dob}
          onChange={(event) => setDob(event.target.value)}
          className={`${INPUT_CLASS} [color-scheme:dark]`}
        />

        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">
            {isEn ? "Education level" : "ระดับการศึกษา"}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(["high_school", "university", "unaffiliated"] as const).map(
              (level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEducation(level)}
                  className={[
                    "min-h-12 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors",
                    education === level
                      ? "border-blue-400/50 bg-blue-500/15 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/55",
                  ].join(" ")}
                >
                  {educationCopy[level]}
                </button>
              )
            )}
          </div>
        </div>

        {needsGuardian ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="dawn-eyebrow">
              {isEn ? "Parent or guardian" : "ผู้ปกครอง"}
            </p>
            <p className="text-xs leading-5 text-white/45">
              {isEn
                ? "Required because you are 18 or under."
                : "จำเป็นเพราะคุณอายุ 18 หรือต่ำกว่า"}
            </p>
            <input
              required
              placeholder={
                isEn ? "Relationship (mom, dad…)" : "ความสัมพันธ์ (แม่, พ่อ…)"
              }
              value={guardianRelationship}
              onChange={(event) => setGuardianRelationship(event.target.value)}
              maxLength={60}
              className={INPUT_CLASS}
            />
            <input
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={isEn ? "Phone number" : "เบอร์โทร"}
              value={guardianPhone}
              onChange={(event) => setGuardianPhone(event.target.value)}
              pattern="[0-9+() .-]{7,24}"
              className={INPUT_CLASS}
            />
            <label className="flex min-h-12 items-start gap-3 text-sm leading-5 text-white/70">
              <input
                type="checkbox"
                checked={guardianApproved}
                onChange={(event) => setGuardianApproved(event.target.checked)}
                className="mt-1 h-5 w-5 shrink-0"
              />
              <span>
                {isEn
                  ? "My parent or guardian approves my use of PassionSeed and may be contacted at this number."
                  : "ผู้ปกครองอนุญาตให้ใช้ PassionSeed และติดต่อได้ที่เบอร์นี้"}
              </span>
            </label>
          </div>
        ) : null}

        {error ? (
          <p className="text-center text-sm text-red-400">{error}</p>
        ) : null}
      </form>
    </PhaseShell>
  );
}
