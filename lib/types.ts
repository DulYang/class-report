export type Attendance = "P" | "A";

/** Assessment and right behaviour are scored 1–4. 1 is the default. */
export type Score = 1 | 2 | 3 | 4;

export const SCORES: Score[] = [1, 2, 3, 4];
export const DEFAULT_SCORE: Score = 1;

export function toScore(value: unknown): Score {
  const n = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return n === 2 || n === 3 || n === 4 ? n : DEFAULT_SCORE;
}

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
  name: string;
  created_at: string;
};

/** Which grades a school runs — admin-managed, independent of enrollment. */
export type SchoolGrade = {
  id: string;
  school_id: string;
  grade_id: string;
  created_at: string;
};

/** A coach owns a grade at a school and inherits every session scheduled for it. */
export type CoachAssignment = {
  id: string;
  coach_id: string;
  school_id: string;
  grade_id: string;
  created_at: string;
};

/**
 * A curriculum is just the pairing of one lesson plan with one grade — the
 * same lesson plan can pair with several grades, each with its own objectives.
 */
export type Curriculum = {
  id: string;
  lesson_plan_id: string;
  grade_id: string;
  created_at: string;
};

/**
 * A reusable, grade-agnostic catalog entry. Which grades it applies to, and
 * what its objectives are per grade, lives on curricula/assessment_objectives.
 * Scheduling lives on syllabus_entries.
 */
export type LessonPlan = {
  id: string;
  title: string;
  created_at: string;
};

/**
 * Tied to a (lesson_plan, grade) pairing — the same lesson plan can carry
 * different objectives per grade. Shown read-only on the report card so the
 * coach knows the goal.
 */
export type AssessmentObjective = {
  id: string;
  curriculum_id: string;
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

/** Students belong to a school and a grade — there is no class. */
export type Student = {
  id: string;
  school_id: string;
  grade_id: string;
  name: string;
  created_at: string;
};

export type ReportCard = {
  id: string;
  syllabus_entry_id: string;
  student_id: string;
  attendance_session1: Attendance;
  attendance_session2: Attendance;
  assessment: Score;
  right_behavior: Score;
  created_at: string;
  updated_at: string;
};

/**
 * One shared note per (syllabus entry, grade) — the whole class session, not
 * a single student. Written on the first class, editable again on the
 * second.
 */
export type SessionNotes = {
  id: string;
  syllabus_entry_id: string;
  grade_id: string;
  notes: string;
  updated_at: string;
};

export type FillStatus = "empty" | "partial" | "complete";

/** A syllabus entry resolved to the school + grade whose students it covers. */
export type ScheduledSession = {
  entry: SyllabusEntry;
  lesson_plan: LessonPlan;
  school: School | null;
  grade: Grade | null;
  student_count: number;
  filled_count: number;
  status: FillStatus;
};

/** The weekly view is organised by coach, via their grade assignments. */
export type CoachSchedule = {
  coach: Coach | null;
  grades: { school: School | null; grade: Grade | null }[];
  sessions: ScheduledSession[];
};

export type ReportCardRow = {
  student_id: string;
  student_name: string;
  attendance_session1: Attendance;
  attendance_session2: Attendance;
  assessment: Score;
  right_behavior: Score;
  saved: boolean;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export function fillStatus(studentCount: number, filledCount: number): FillStatus {
  if (studentCount === 0 || filledCount === 0) return "empty";
  if (filledCount >= studentCount) return "complete";
  return "partial";
}

/** One row of the audit trail. Insert is open; only admins can read it. */
export type AuditLogEntry = {
  id: string;
  actor_type: "admin" | "coach" | "system";
  actor_id: string | null;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  created_at: string;
};
