export interface PlanPriorityItem {
  rank: number;
  title: string;
  stars: number; // 1 to 5
  description: string;
  tag?: string; // e.g. 'โปรเจกต์จริง', 'การแข่งขัน', 'ค่ายมหาลัย'
}

export interface PlanTimelineItem {
  month: string; // e.g. 'ส.ค. 69', 'ต.ค. 69'
  title: string;
  deadline: string; // e.g. 'ปิด 30 ก.ย. 69' or 'ช่วงเปิดเทอม 1'
  weight: number; // 1 to 5 stars
  url?: string | null;
  notes?: string | null;
  isVerified?: boolean;
}

export interface PlanStepOneAction {
  title: string;
  subtitle?: string;
  duration: string; // e.g. '5 วัน'
  price: number; // 299
  cohortDate?: string; // e.g. '24 ส.ค. 69' or 'รอบเปิดตัวเร็วๆ นี้'
  isPresell: boolean;
  keyDeliverables: string[];
}

export interface StudentPlan {
  id: string;
  token: string;
  conversation_id: string | null;
  student_name: string;
  grade_level: string; // 'ม.4' | 'ม.5' | 'ม.6'
  target_field: string;
  readiness_score: number; // 1..8
  ranked_priorities: PlanPriorityItem[];
  timeline: PlanTimelineItem[];
  step_one_action: PlanStepOneAction;
  parent_notes?: string | null;
  custom_advice?: string | null;
  view_count: number;
  last_viewed_at?: string | null;
  qr_scan_count: number;
  last_qr_scanned_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateStudentPlanInput {
  /** Reuse the draft token so poster QR codes keep pointing at the saved plan. */
  token?: string;
  conversation_id?: string | null;
  student_name: string;
  grade_level: string;
  target_field: string;
  readiness_score?: number;
  ranked_priorities: PlanPriorityItem[];
  timeline: PlanTimelineItem[];
  step_one_action: PlanStepOneAction;
  parent_notes?: string | null;
  custom_advice?: string | null;
}

export interface PlanDraftRequest {
  studentName: string;
  gradeLevel: string;
  targetField: string;
  interests?: string[];
  conversationId?: string;
  /** Admin-assessed portfolio readiness (1–8) based on the DM conversation. */
  readinessScore?: number;
}

export interface GeneratedPlanDraft {
  token: string;
  studentName: string;
  gradeLevel: string;
  targetField: string;
  readinessScore: number;
  rankedPriorities: PlanPriorityItem[];
  timeline: PlanTimelineItem[];
  stepOneAction: PlanStepOneAction;
  parentNotes: string;
  customAdvice: string;
  dmCopy: string;
  isPresell: boolean;
}
