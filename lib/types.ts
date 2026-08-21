export type Attendance = "P" | "A";

export type Role = "coach" | "admin";

export type Coach = {
  id: string;
  name: string;
  email: string | null;
  role: Role;
  user_id: string | null;
  created_at: string;
};

export type Class = {
  id: string;
  coach_id: string | null;
  name: string;
  school: string;
  grade: string;
  user_id: string | null;
  created_at: string;
};

export type LessonPlan = {
  id: string;
  class_id: string;
  title: string;
  session_date1: string;
  session_date2: string;
  user_id: string | null;
  created_at: string;
};

export type Student = {
  id: string;
  class_id: string;
  name: string;
  user_id: string | null;
  created_at: string;
};

export type ReportCard = {
  id: string;
  lesson_plan_id: string;
  student_id: string;
  attendance_session1: Attendance;
  attendance_session2: Attendance;
  assessment: string | null;
  right_behavior: string | null;
  notes: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

/** How much of a lesson plan's roster has been filled in. */
export type FillStatus = "empty" | "partial" | "complete";

export type LessonPlanWithStatus = LessonPlan & {
  student_count: number;
  filled_count: number;
  status: FillStatus;
};

export type ClassWithPlans = Class & {
  coach: Coach | null;
  student_count: number;
  lesson_plans: LessonPlanWithStatus[];
};

/** One editable row in the report card grid. */
export type ReportCardRow = {
  student_id: string;
  student_name: string;
  attendance_session1: Attendance;
  attendance_session2: Attendance;
  assessment: string;
  right_behavior: string;
  notes: string;
  /** false when no report_cards row exists yet for this student */
  saved: boolean;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * A report card counts as "filled" once attendance has been recorded for it —
 * i.e. a row exists. Remarks are optional per the PRD.
 */
export function fillStatus(studentCount: number, filledCount: number): FillStatus {
  if (studentCount === 0 || filledCount === 0) return "empty";
  if (filledCount >= studentCount) return "complete";
  return "partial";
}
