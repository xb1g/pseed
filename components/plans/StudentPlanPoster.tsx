"use client";

import React from "react";
import QRCode from "react-qr-code";
import type { StudentPlan, GeneratedPlanDraft } from "@/types/student-plan";

/**
 * StudentPlanPoster — the shareable Dawn-theme poster for a student plan.
 *
 * Design contract (docs/ui-design-system.md):
 * - Fixed 1080px design width; the Y axis is UNBOUNDED so content is never
 *   clipped or squeezed. Preview surfaces scale the node down with
 *   `PosterScaler`; export captures the node at full width.
 * - Self-contained Dawn sky (`.plan-poster__*` in globals.css) because
 *   `.dawn-scene` is position:fixed and cannot render inside an export node.
 * - Dawn foreground jobs: gold = the single most important statement
 *   (Step 1 keynote + importance weights), blue = informational chips,
 *   slate/white = text hierarchy.
 */

interface StudentPlanPosterProps {
  plan: StudentPlan | GeneratedPlanDraft;
  className?: string;
}

interface NormalizedPlan {
  token: string;
  studentName: string;
  gradeLevel: string;
  targetField: string;
  readinessScore: number;
  rankedPriorities: StudentPlan["ranked_priorities"];
  timeline: StudentPlan["timeline"];
  stepOneAction: StudentPlan["step_one_action"];
}

function normalizePlan(plan: StudentPlan | GeneratedPlanDraft): NormalizedPlan {
  if ("rankedPriorities" in plan) {
    return {
      token: plan.token,
      studentName: plan.studentName,
      gradeLevel: plan.gradeLevel,
      targetField: plan.targetField,
      readinessScore: plan.readinessScore,
      rankedPriorities: plan.rankedPriorities,
      timeline: plan.timeline,
      stepOneAction: plan.stepOneAction,
    };
  }
  return {
    token: plan.token,
    studentName: plan.student_name,
    gradeLevel: plan.grade_level,
    targetField: plan.target_field,
    readinessScore: plan.readiness_score,
    rankedPriorities: plan.ranked_priorities,
    timeline: plan.timeline,
    stepOneAction: plan.step_one_action,
  };
}

const font = {
  thai: "var(--font-bai-jamjuree), sans-serif",
  display: "var(--font-kodchasan), var(--font-bai-jamjuree), sans-serif",
  mono: "var(--font-space-mono), monospace",
} as const;

const ink = {
  primary: "#f1f5f9",
  secondary: "#cbd5e1",
  muted: "#94a3b8",
  faint: "#64748b",
  gold: "#fed95c",
  goldSoft: "rgba(254, 217, 92, 0.85)",
  blue: "#93c5fd",
} as const;

function ReadinessMeter({ score }: { score: number }) {
  const totalSlots = 8;
  const activeSlots = Math.min(Math.max(score, 1), totalSlots);

  return (
    <div className="plan-poster__card" style={{ padding: "20px 24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{ fontFamily: font.display, fontSize: 21, fontWeight: 600, color: ink.primary }}
        >
          ความพร้อมของพอร์ตปัจจุบัน
        </span>
        <span
          style={{
            fontFamily: font.mono,
            fontSize: 20,
            fontWeight: 700,
            color: ink.blue,
          }}
        >
          {activeSlots}/{totalSlots}
          <span style={{ color: ink.faint, fontSize: 15, marginLeft: 10 }}>
            {Math.round((activeSlots / totalSlots) * 100)}%
          </span>
        </span>
      </div>
      <p
        style={{
          fontFamily: font.thai,
          fontSize: 15,
          color: ink.faint,
          margin: "0 0 14px",
        }}
      >
        พี่ประเมินให้จากสิ่งที่น้องเล่าไว้ในแชท
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        {Array.from({ length: totalSlots }).map((_, idx) => (
          <div
            key={idx}
            style={{
              height: 12,
              flex: 1,
              borderRadius: 4,
              background:
                idx < activeSlots
                  ? "linear-gradient(90deg, #3b82f6 0%, #818cf8 100%)"
                  : "rgba(255,255,255,0.07)",
              boxShadow:
                idx < activeSlots
                  ? "0 0 10px rgba(59,130,246,0.35)"
                  : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export const StudentPlanPoster = React.forwardRef<
  HTMLDivElement,
  StudentPlanPosterProps
>(({ plan, className = "" }, ref) => {
  const data = normalizePlan(plan);
  const priorities = data.rankedPriorities.slice(0, 3);
  const timeline = data.timeline;

  return (
    <div ref={ref} className={`plan-poster ${className}`}>
      {/* Dawn sky — five layers, absolute, decorative */}
      <div className="plan-poster__cloud plan-poster__cloud--a" aria-hidden="true" />
      <div className="plan-poster__cloud plan-poster__cloud--b" aria-hidden="true" />
      <div className="plan-poster__cloud plan-poster__cloud--c" aria-hidden="true" />
      <div className="plan-poster__horizon" aria-hidden="true" />
      <div className="plan-poster__motes" aria-hidden="true" />
      <div className="plan-poster__stars" aria-hidden="true" />

      {/* Content — natural flow, nothing clipped */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "56px 56px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 28,
          color: ink.primary,
        }}
      >
        {/* Header */}
        <header>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- plain img keeps html-to-image export reliable */}
              <img
                src="/passionseed-logo.svg"
                alt="PassionSeed"
                width={52}
                height={52}
                style={{
                  width: 52,
                  height: 52,
                  objectFit: "contain",
                  filter: "drop-shadow(0 0 14px rgba(254,217,92,0.35))",
                }}
              />
              <span
                style={{
                  fontFamily: font.mono,
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  color: ink.goldSoft,
                }}
              >
                PASSIONSEED · PORTFOLIO ROADMAP
              </span>
            </div>
            <span
              style={{
                fontFamily: font.thai,
                fontSize: 17,
                fontWeight: 600,
                color: ink.blue,
                border: "1px solid rgba(147,197,253,0.35)",
                background: "rgba(59,130,246,0.10)",
                borderRadius: 9999,
                padding: "6px 18px",
              }}
            >
              {data.gradeLevel}
            </span>
          </div>

          <div style={{ marginTop: 24 }}>
            <div className="dawn-eyebrow" style={{ fontFamily: font.thai, fontSize: 16 }}>
              แผนเตรียมพอร์ตรายบุคคล
            </div>
            <h1
              style={{
                fontFamily: font.display,
                fontSize: 46,
                fontWeight: 700,
                lineHeight: 1.25,
                letterSpacing: "-0.01em",
                color: "#ffffff",
                margin: "8px 0 0",
              }}
            >
              {data.studentName || "นักเรียน"} · สาย{data.targetField}
            </h1>
            <hr className="dawn-rule" style={{ margin: "18px 0 0", width: "72%" }} />
          </div>
        </header>

        {/* Readiness */}
        <ReadinessMeter score={data.readinessScore ?? 3} />

        {/* 3 Priorities */}
        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <span className="dawn-eyebrow" style={{ fontFamily: font.thai, fontSize: 16 }}>
              3 อย่างที่ต้องทำ · เรียงตามน้ำหนัก TCAS1
            </span>
            <span style={{ fontFamily: font.thai, fontSize: 15, color: ink.faint }}>
              น้ำหนัก
            </span>
          </div>

          {priorities.map((item) => (
            <div
              key={item.rank}
              className="plan-poster__card"
              style={{ padding: "20px 24px" }}
            >
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 38,
                    height: 38,
                    borderRadius: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: font.mono,
                    fontSize: 19,
                    fontWeight: 700,
                    color: ink.blue,
                    border: "1px solid rgba(147,197,253,0.4)",
                    background: "rgba(59,130,246,0.12)",
                  }}
                >
                  {item.rank}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: font.display,
                        fontSize: 23,
                        fontWeight: 600,
                        color: "#ffffff",
                        margin: 0,
                        lineHeight: 1.35,
                      }}
                    >
                      {item.title}
                    </h3>
                    <span
                      aria-label={`น้ำหนัก ${item.stars} จาก 5`}
                      style={{
                        flexShrink: 0,
                        fontSize: 18,
                        letterSpacing: 2,
                        color: ink.gold,
                        textShadow: "0 0 10px rgba(254,217,92,0.35)",
                      }}
                    >
                      {"★".repeat(item.stars)}
                      <span style={{ color: "rgba(255,255,255,0.14)", textShadow: "none" }}>
                        {"☆".repeat(Math.max(0, 5 - item.stars))}
                      </span>
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: font.thai,
                      fontSize: 18,
                      lineHeight: 1.65,
                      color: ink.secondary,
                      margin: "8px 0 0",
                    }}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Timeline — every entry, the poster grows to fit */}
        <section style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span className="dawn-eyebrow" style={{ fontFamily: font.thai, fontSize: 16 }}>
            ปฏิทิน 6 เดือน & กำหนดการจริง
          </span>
          <div className="plan-poster__card" style={{ padding: "8px 24px" }}>
            {timeline.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 20,
                  padding: "12px 0",
                  borderBottom:
                    idx < timeline.length - 1
                      ? "1px solid rgba(255,255,255,0.06)"
                      : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
                  <span
                    style={{
                      flexShrink: 0,
                      fontFamily: font.thai,
                      fontSize: 15,
                      fontWeight: 600,
                      color: ink.blue,
                      background: "rgba(59,130,246,0.12)",
                      border: "1px solid rgba(147,197,253,0.3)",
                      borderRadius: 8,
                      padding: "5px 12px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.month}
                  </span>
                  <span
                    style={{
                      fontFamily: font.thai,
                      fontSize: 18,
                      color: ink.primary,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.title}
                  </span>
                </div>
                <span
                  style={{
                    flexShrink: 0,
                    fontFamily: font.thai,
                    fontSize: 15,
                    color: ink.blue,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.deadline}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Step 1 — the one gold keynote of the poster */}
        <section className="dawn-keynote" style={{ padding: "24px 30px 24px 36px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 28,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <span
                className="dawn-eyebrow"
                style={{ fontFamily: font.thai, fontSize: 15 }}
              >
                ขั้นแรกของน้อง · Step 1
              </span>
              <h4
                style={{
                  fontFamily: font.display,
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#ffffff",
                  margin: "8px 0 0",
                  lineHeight: 1.3,
                }}
              >
                {data.stepOneAction.title}
              </h4>
              <p
                style={{
                  fontFamily: font.display,
                  fontSize: 19,
                  fontWeight: 500,
                  color: ink.secondary,
                  margin: "10px 0 0",
                  lineHeight: 1.6,
                }}
              >
                {data.stepOneAction.subtitle ||
                  `ทำโปรเจกต์จริง ${data.stepOneAction.duration} เพื่อค้นหาว่าสายนี้ใช่สำหรับน้องไหม`}
              </p>
            </div>
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <div
                style={{
                  fontFamily: font.display,
                  fontSize: 44,
                  fontWeight: 700,
                  color: ink.gold,
                  lineHeight: 1,
                  textShadow: "0 0 24px rgba(254,217,92,0.35)",
                }}
              >
                {data.stepOneAction.price}฿
              </div>
              {data.stepOneAction.cohortDate && (
                <div
                  style={{
                    fontFamily: font.thai,
                    fontSize: 15,
                    color: ink.muted,
                    marginTop: 8,
                  }}
                >
                  {data.stepOneAction.cohortDate}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* QR — scan tracking routes through /qr/plan/[token] so every scan
            is attributed to this exact plan before redirecting to /pathlab */}
        <section
          className="plan-poster__card"
          style={{
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 28,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <span
              style={{
                fontFamily: font.thai,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: ink.blue,
              }}
            >
              สแกนเพื่อเริ่ม Step 1
            </span>
            <p
              style={{
                fontFamily: font.display,
                fontSize: 22,
                fontWeight: 600,
                color: "#ffffff",
                margin: "8px 0 0",
                lineHeight: 1.4,
              }}
            >
              ลองทำโปรเจกต์จริง 5 วัน
              <br />
              ค้นหาว่าเส้นทางนี้ใช่สำหรับน้องไหม
            </p>
            <p
              style={{
                fontFamily: font.mono,
                fontSize: 15,
                color: ink.blue,
                margin: "12px 0 0",
                letterSpacing: "0.04em",
              }}
            >
              passionseed.org/pathlab
            </p>
          </div>
          <div
            style={{
              flexShrink: 0,
              background: "#ffffff",
              borderRadius: 16,
              padding: 14,
              boxShadow: "0 0 32px rgba(254,217,92,0.18)",
            }}
          >
            <QRCode
              value={`https://passionseed.org/qr/plan/${data.token}`}
              size={132}
              bgColor="#ffffff"
              fgColor="#0b1020"
            />
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span
            style={{
              fontFamily: font.mono,
              fontSize: 12,
              letterSpacing: "0.08em",
              color: ink.faint,
            }}
          >
            passionseed.org · แผนพอร์ตรายบุคคล
          </span>
          <span style={{ fontFamily: font.mono, fontSize: 12, color: ink.faint }}>
            {new Date().toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "2-digit",
            })}
          </span>
        </footer>
      </div>
    </div>
  );
});

StudentPlanPoster.displayName = "StudentPlanPoster";
