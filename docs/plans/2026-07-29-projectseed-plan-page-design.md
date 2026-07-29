# ProjectSeed Plan Page Design (`/plan`)

**Status:** APPROVED
**Date:** 2026-07-29
**Strategy Reference:** [`docs/project/PROJECTSEED-STRATEGY.md`](../project/PROJECTSEED-STRATEGY.md)

---

## 1. Executive Summary & Purpose

The `/plan` page ("My Path") serves as PassionSeed's interactive diagnostic and project blueprint generator for Thai students (high school and university). 

Instead of forcing a single hard sell, the `/plan` page diagnoses student readiness and recommends the appropriate path:
1. **Direction Finding / Exploration (Free)** — For students who are still exploring options (using Career Radar & Passion Map).
2. **ProjectSeed (2,990฿)** — For students ready for hands-on building, entry events (TechSeed / BizSeed / Hackathons), and shipping a TCAS Round 1 portfolio project with alumni mentors and real user interviews.

**Primary CTA for all paths:** *"Talk to mentors on LINE OA for free"* (`LINE OA: @passionseed`).

---

## 2. Student Readiness Diagnosis & Recommendation Matrix

| Readiness Level | Diagnostic Signal in Wizard | Recommended Outcome | Primary Action (CTA) |
|---|---|---|---|
| **Level 1: Searching Direction** | *"ยังไม่แน่ใจ อยากลองค้นหาสายอาชีพก่อน"* | **Career Radar & Passion Map**<br>• Explore 10+ career fields<br>• Fantasy vs Reality & AI Impact checks | **"คุยกับพี่ๆ ช่วยค้นหาทิศทางฟรี (LINE OA)"** |
| **Level 2: Hands-on & Execution** | *"สนใจสายนี้ อยากทำโปรเจกต์/ลงมือทำจริง"* | **ProjectSeed (2,990฿)**<br>• Hands-on entry events (TechSeed / BizSeed)<br>• Shipped project + real user interviews<br>• Alumni mentors & community | **"ส่ง Plan ให้พี่ๆ ช่วยดูฟรี (LINE OA)"**<br>*(Shows 2,990฿ ProjectSeed Offer)* |

---

## 3. Page Architecture & Component Structure

### Components & File Locations
- **`app/plan/page.tsx`**: Server component fetching published `radar_fields` and `pathlab_seeds`.
- **`components/my-path/wizard/PlanWizard.tsx`**: State container managing step transitions and readiness options.
- **`components/my-path/wizard/steps/ReadinessStep.tsx`**: Readiness selector question (Exploration vs Hands-on Building).
- **`components/my-path/wizard/steps/PlanSummaryStep.tsx`**: Tailored summary screen rendering:
  - Personalized **Project Blueprint** (field, project scope, target timeline).
  - **ProjectSeed Offer Card** (2,990฿ flat price, real user interviews guarantee, alumni mentorship).
  - **LINE OA Pre-filled Deep Link Button**.

---

## 4. LINE OA Deep Link Integration

The primary CTA button opens LINE OA (`@passionseed`) with a dynamic, pre-formatted message:

```text
สวัสดีครับ/ค่ะ! ได้วางแผนโปรเจกต์บน PassionSeed อยากให้พี่ๆ ช่วยรีวิวแผนนี้ครับ:
🎯 สายงาน: [Chosen Radar Field]
🚀 โปรเจกต์: [Selected Project Seed]
⏱️ ไทม์ไลน์: [Target Timeline]
[ถ้าเลือกรวม ProjectSeed]: อยากสอบถามเรื่องเข้าร่วม ProjectSeed (2,990฿) ครับ
```

---

## 5. UI Design & Aesthetic Tokens

- **Theme**: Dawn Theme (`dawn-theme`) for student surfaces.
- **Color Palette**: Deep space blue (`#0f172a`), indigo (`#1e1b4b`), soft rose (`#f472b6`), and pale gold (`#fed95c`).
- **Typography**: Display/Headlines in **Kodchasan**; Body & UI Labels in **Bai Jamjuree**.
- **Cards & Effects**: `.ei-card` glassmorphism with `cubic-bezier(0.05, 0.7, 0.35, 0.99)` slow tension hover keyframes and `160ms` snap-out transitions.
- **Accessibility**: Full keyboard focus rings, touch targets $\ge 48\times 48\text{px}$, `prefers-reduced-motion` support.
