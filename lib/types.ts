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

export type School = {
  id: string;
  name: string;
  pic_name: string | null;
  pic_phone: string | null;
  created_at: string;
};

export type Grade = {
  id: string;
  school_id: string;
  name: string;
  created_at: string;
};

/** A curriculum targets one grade of one school and owns its lesson plans. */
export type Curriculum = {
  id: string;
  name: string;
  grade_id: string;
  created_at: string;
};

/** Reusable admin-authored content. Scheduling lives on syllabus_entries. */
export type LessonPlan = {
  id: string;
  curriculum_id: string;
  title: string;
  sort_order: number;
  user_id: string | null;
  created_at: string;
};

/** Shown read-only on the report card so the coach knows the goal. */
export type AssessmentObjective = {
  id: string;
  lesson_plan_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
};

/** One scheduled teaching of a lesson plan at a school. */
export type SyllabusEntry = {
  id: string;
  school_id: string;
  lesson_plan_id: string;
  session_date1: string;
  session_date2: string | null;
  created_at: string;
};

/** Which coaches work at which school. Admin-assigned only. */
export type CoachSchool = {
  id: string;
  coach_id: string;
  school_id: string;
  created_at: string;
};

export type Class = {
  id: string;
  coach_id: string | null;
  name: string;
  school_id: string;
  grade_id: string;
  user_id: string | null;
  created_at: string;
};

export type ReportCard = {
  id: string;
  syllabus_entry_id: string;
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

export type Student = {
  id: string;
  class_id: string;
  name: string;
  user_id: string | null;
  created_at: string;
};

export type FillStatus = "empty" | "partial" | "complete";

/** A syllabus entry as it applies to one particular class. */
export type ScheduledLesson = {
  entry: SyllabusEntry;
  lesson_plan: LessonPlan;
  student_count: number;
  filled_count: number;
  status: FillStatus;
};

export type ClassWithSchedule = Class & {
  coach: Coach | null;
  school: School | null;
  grade: Grade | null;
  student_count: number;
  lessons: ScheduledLesson[];
};

export type ReportCardRow = {
  student_id: string;
  student_name: string;
  attendance_session1: Attendance;
  attendance_session2: Attendance;
  assessment: string;
  right_behavior: string;
  notes: string;
  saved: boolean;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export function fillStatus(studentCount: number, filledCount: number): FillStatus {
  if (studentCount === 0 || filledCount === 0) return "empty";
  if (filledCount >= studentCount) return "complete";
  return "partial";
}
