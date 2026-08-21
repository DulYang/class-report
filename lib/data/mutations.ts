import { createClient } from "@/lib/supabase/server";
import type { Attendance, Class, LessonPlan, Student } from "@/lib/types";

/** Every DB write lives here. Server actions validate, then call into this. */

export type ReportCardInput = {
  student_id: string;
  attendance_session1: Attendance;
  attendance_session2: Attendance;
  assessment: string;
  right_behavior: string;
  notes: string;
};

/**
 * Save the whole grid in one round trip. Upsert on (lesson_plan_id, student_id)
 * so a coach can fill a fresh roster and later edit the same rows without
 * caring which students already had a card.
 */
export async function saveReportCards(
  lessonPlanId: string,
  rows: ReportCardInput[],
): Promise<void> {
  if (rows.length === 0) return;
  const supabase = await createClient();
  const now = new Date().toISOString();

  const payload = rows.map((r) => ({
    lesson_plan_id: lessonPlanId,
    student_id: r.student_id,
    attendance_session1: r.attendance_session1,
    attendance_session2: r.attendance_session2,
    assessment: r.assessment,
    right_behavior: r.right_behavior,
    notes: r.notes,
    updated_at: now,
  }));

  const { error } = await supabase
    .from("report_cards")
    .upsert(payload, { onConflict: "lesson_plan_id,student_id" });
  if (error) throw new Error(error.message);
}

// ── classes ────────────────────────────────────────────────────────────────

export async function createClass(input: {
  name: string;
  school: string;
  grade: string;
  coach_id: string | null;
}): Promise<Class> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Class;
}

export async function updateClass(
  id: string,
  input: { name: string; school: string; grade: string; coach_id: string | null },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("classes").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteClass(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── lesson plans ───────────────────────────────────────────────────────────

export async function createLessonPlan(input: {
  class_id: string;
  title: string;
  session_date1: string;
  session_date2: string;
}): Promise<LessonPlan> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_plans")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as LessonPlan;
}

export async function updateLessonPlan(
  id: string,
  input: { title: string; session_date1: string; session_date2: string },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("lesson_plans").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteLessonPlan(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("lesson_plans").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── students ───────────────────────────────────────────────────────────────

export async function createStudent(input: {
  class_id: string;
  name: string;
}): Promise<Student> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Student;
}

export async function updateStudent(id: string, name: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("students").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteStudent(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── coaches ────────────────────────────────────────────────────────────────

export async function createCoach(input: {
  name: string;
  email: string | null;
  role: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("coaches").insert(input);
  if (error) throw new Error(error.message);
}
