import { createClient } from "@/lib/supabase/server";
import type { Attendance, LessonPlan, Score, Student } from "@/lib/types";

/** Every DB write lives here. Server actions validate, then call into this. */

export type ReportCardInput = {
  student_id: string;
  attendance_session1: Attendance;
  attendance_session2: Attendance;
  assessment: Score;
  right_behavior: Score;
  notes: string;
};

/**
 * Save the whole grid in one round trip. Upsert on
 * (syllabus_entry_id, student_id) so a coach can fill a fresh roster and later
 * edit the same rows without caring which students already had a card.
 */
export async function saveReportCards(
  syllabusEntryId: string,
  rows: ReportCardInput[],
): Promise<void> {
  if (rows.length === 0) return;
  const supabase = await createClient();
  const now = new Date().toISOString();

  const payload = rows.map((r) => ({
    syllabus_entry_id: syllabusEntryId,
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
    .upsert(payload, { onConflict: "syllabus_entry_id,student_id" });
  if (error) throw new Error(error.message);
}

// ── schools (admin) ────────────────────────────────────────────────────────

export type SchoolInput = {
  name: string;
  pic_name: string | null;
  pic_phone: string | null;
};

export async function createSchool(input: SchoolInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("schools").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateSchool(id: string, input: SchoolInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("schools").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSchool(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("schools").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── grades (admin) ─────────────────────────────────────────────────────────

export async function createGrade(input: {
  school_id: string;
  name: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("grades").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateGrade(id: string, name: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("grades").update({ name }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteGrade(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("grades").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── coaches (admin) ────────────────────────────────────────────────────────

export type CoachInput = {
  name: string;
  email: string | null;
  role: string;
};

export async function createCoach(input: CoachInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("coaches").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateCoach(id: string, input: CoachInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("coaches").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteCoach(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("coaches").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Links a freshly signed-up auth user to an admin coach record. */
export async function claimAdminAccount(input: {
  name: string;
  email: string;
  user_id: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("coaches").insert({
    name: input.name,
    email: input.email,
    role: "admin",
    user_id: input.user_id,
  });
  if (error) throw new Error(error.message);
}

// ── coach ↔ (school, grade) assignment (admin) ─────────────────────────────

export async function assignCoachToGrade(input: {
  coach_id: string;
  school_id: string;
  grade_id: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("coach_assignments").insert(input);
  if (error) throw new Error(error.message);
}

export async function unassignCoachFromGrade(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("coach_assignments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── lesson plans (admin): a plain reusable catalog ──────────────────────────

export async function createLessonPlan(title: string): Promise<LessonPlan> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_plans")
    .insert({ title })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as LessonPlan;
}

export async function updateLessonPlan(id: string, title: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("lesson_plans")
    .update({ title })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteLessonPlan(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("lesson_plans").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── curriculum: pairing a lesson plan with a grade ─────────────────────────

export async function pairLessonPlanWithGrade(input: {
  lesson_plan_id: string;
  grade_id: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("curricula").insert(input);
  if (error) throw new Error(error.message);
}

export async function unpairLessonPlanFromGrade(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("curricula").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── assessment objectives: tied to a (lesson_plan, grade) pairing ─────────

export async function createObjective(input: {
  curriculum_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("assessment_objectives").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateObjective(
  id: string,
  input: { title: string; description: string | null },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("assessment_objectives")
    .update(input)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteObjective(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("assessment_objectives")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ── syllabus (admin) ───────────────────────────────────────────────────────

export type SyllabusInput = {
  school_id: string;
  lesson_plan_id: string;
  session_date1: string;
  session_date2: string | null;
};

export async function createSyllabusEntry(input: SyllabusInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("syllabus_entries").insert(input);
  if (error) throw new Error(error.message);
}

export async function updateSyllabusEntry(
  id: string,
  input: { lesson_plan_id: string; session_date1: string; session_date2: string | null },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("syllabus_entries").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSyllabusEntry(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("syllabus_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ── students (admin) ───────────────────────────────────────────────────────

export async function createStudent(input: {
  school_id: string;
  grade_id: string;
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

export async function updateStudent(
  id: string,
  input: { name: string; school_id: string; grade_id: string },
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("students").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteStudent(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
