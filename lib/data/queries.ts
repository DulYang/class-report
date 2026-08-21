import { createClient } from "@/lib/supabase/server";
import {
  fillStatus,
  toScore,
  type AssessmentObjective,
  type Coach,
  type CoachAssignment,
  type CoachSchedule,
  type Curriculum,
  type Grade,
  type LessonPlan,
  type ReportCard,
  type ReportCardRow,
  type ScheduledSession,
  type School,
  type Student,
  type SyllabusEntry,
} from "@/lib/types";

/**
 * Every DB read lives here. Pages/components never query Supabase inline.
 * Joins are assembled in JS rather than via nested selects so a missing FK
 * relationship never silently drops rows from a roster or a schedule.
 */

async function all<T>(table: string, order?: string): Promise<T[]> {
  const supabase = await createClient();
  const query = supabase.from(table).select("*");
  const { data, error } = order ? await query.order(order) : await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

// ── core tables ────────────────────────────────────────────────────────────

export function getSchools(): Promise<School[]> {
  return all<School>("schools", "name");
}

export async function getSchool(id: string): Promise<School | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as School) ?? null;
}

export function getGrades(): Promise<Grade[]> {
  return all<Grade>("grades", "name");
}

export async function getGrade(id: string): Promise<Grade | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("grades")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Grade) ?? null;
}

export function getCoaches(): Promise<Coach[]> {
  return all<Coach>("coaches", "name");
}

export function getCoachAssignments(): Promise<CoachAssignment[]> {
  return all<CoachAssignment>("coach_assignments");
}

/** The (lesson_plan, grade) pairings — this is the whole of "curriculum". */
export function getCurricula(): Promise<Curriculum[]> {
  return all<Curriculum>("curricula");
}

export function getLessonPlans(): Promise<LessonPlan[]> {
  return all<LessonPlan>("lesson_plans", "title");
}

export async function getLessonPlan(id: string): Promise<LessonPlan | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as LessonPlan) ?? null;
}

export function getStudents(): Promise<Student[]> {
  return all<Student>("students", "name");
}

export async function getObjectives(
  curriculumId: string,
): Promise<AssessmentObjective[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessment_objectives")
    .select("*")
    .eq("curriculum_id", curriculumId)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as AssessmentObjective[];
}

/** Grades decorated with the school they belong to, for pickers. */
export async function getGradesWithSchool(): Promise<
  { grade: Grade; school: School | null }[]
> {
  const [grades, schools] = await Promise.all([getGrades(), getSchools()]);
  const schoolById = new Map(schools.map((s) => [s.id, s]));
  return grades.map((grade) => ({
    grade,
    school: schoolById.get(grade.school_id) ?? null,
  }));
}

// ── admin: curriculum (lesson plan × grade × objectives) ──────────────────

export type LessonPlanWithGrades = {
  plan: LessonPlan;
  grades: { curriculum: Curriculum; grade: Grade | null; school: School | null }[];
};

/** Every lesson plan with the grades it's paired to, for the index list. */
export async function getLessonPlansWithGrades(): Promise<LessonPlanWithGrades[]> {
  const [plans, curricula, grades, schools] = await Promise.all([
    getLessonPlans(),
    getCurricula(),
    getGrades(),
    getSchools(),
  ]);
  const gradeById = new Map(grades.map((g) => [g.id, g]));
  const schoolById = new Map(schools.map((s) => [s.id, s]));

  return plans.map((plan) => ({
    plan,
    grades: curricula
      .filter((c) => c.lesson_plan_id === plan.id)
      .map((curriculum) => {
        const grade = gradeById.get(curriculum.grade_id) ?? null;
        return {
          curriculum,
          grade,
          school: grade ? (schoolById.get(grade.school_id) ?? null) : null,
        };
      }),
  }));
}

/** One lesson plan with every grade it's paired to, each with its objectives. */
export async function getLessonPlanDetail(id: string): Promise<{
  plan: LessonPlan;
  pairings: {
    curriculum: Curriculum;
    grade: Grade | null;
    school: School | null;
    objectives: AssessmentObjective[];
  }[];
} | null> {
  const plan = await getLessonPlan(id);
  if (!plan) return null;

  const supabase = await createClient();
  const [curriculaRes, grades, schools] = await Promise.all([
    supabase.from("curricula").select("*").eq("lesson_plan_id", id),
    getGrades(),
    getSchools(),
  ]);
  if (curriculaRes.error) throw new Error(curriculaRes.error.message);

  const curricula = (curriculaRes.data ?? []) as Curriculum[];
  const gradeById = new Map(grades.map((g) => [g.id, g]));
  const schoolById = new Map(schools.map((s) => [s.id, s]));

  let objectives: AssessmentObjective[] = [];
  if (curricula.length > 0) {
    const objRes = await supabase
      .from("assessment_objectives")
      .select("*")
      .in(
        "curriculum_id",
        curricula.map((c) => c.id),
      )
      .order("sort_order");
    if (objRes.error) throw new Error(objRes.error.message);
    objectives = (objRes.data ?? []) as AssessmentObjective[];
  }

  return {
    plan,
    pairings: curricula.map((curriculum) => {
      const grade = gradeById.get(curriculum.grade_id) ?? null;
      return {
        curriculum,
        grade,
        school: grade ? (schoolById.get(grade.school_id) ?? null) : null,
        objectives: objectives.filter((o) => o.curriculum_id === curriculum.id),
      };
    }),
  };
}

/** A school's syllabus: which lesson plans are taught, and when. Applies to every grade at the school. */
export async function getSyllabus(
  schoolId: string,
): Promise<{ entry: SyllabusEntry; plan: LessonPlan | null }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("syllabus_entries")
    .select("*")
    .eq("school_id", schoolId)
    .order("session_date1");
  if (error) throw new Error(error.message);
  const entries = (data ?? []) as SyllabusEntry[];

  const plans = await getLessonPlans();
  const planById = new Map(plans.map((p) => [p.id, p]));

  return entries.map((entry) => ({
    entry,
    plan: planById.get(entry.lesson_plan_id) ?? null,
  }));
}

/** Every student with the school and grade they sit in — admin roster. */
export async function getRoster(): Promise<
  { student: Student; school: School | null; grade: Grade | null }[]
> {
  const [students, schools, grades] = await Promise.all([
    getStudents(),
    getSchools(),
    getGrades(),
  ]);
  const schoolById = new Map(schools.map((s) => [s.id, s]));
  const gradeById = new Map(grades.map((g) => [g.id, g]));

  return students.map((student) => ({
    student,
    school: schoolById.get(student.school_id) ?? null,
    grade: gradeById.get(student.grade_id) ?? null,
  }));
}

// ── coach domain ───────────────────────────────────────────────────────────

/**
 * The week's sessions, grouped by the coach who owns them. Scheduling a lesson
 * plan at a school covers every grade there, so one syllabus entry can produce
 * several sessions — one per grade — each with its own roster and fill count.
 * A session belongs to a coach when that coach is assigned to its (school,
 * grade) pair. Pairs nobody is assigned to are collected under a null coach so
 * they are never hidden.
 */
export async function getWeeklySchedule(range?: {
  from: string;
  to: string;
}): Promise<CoachSchedule[]> {
  const supabase = await createClient();

  const [coaches, schools, grades, plans, assignments, students] =
    await Promise.all([
      getCoaches(),
      getSchools(),
      getGrades(),
      getLessonPlans(),
      getCoachAssignments(),
      getStudents(),
    ]);

  let entriesQuery = supabase.from("syllabus_entries").select("*");
  if (range) {
    // In the window if either session lands inside it.
    entriesQuery = entriesQuery.or(
      [
        `and(session_date1.gte.${range.from},session_date1.lte.${range.to})`,
        `and(session_date2.gte.${range.from},session_date2.lte.${range.to})`,
      ].join(","),
    );
  }
  const entriesRes = await entriesQuery.order("session_date1");
  if (entriesRes.error) throw new Error(entriesRes.error.message);
  const entries = (entriesRes.data ?? []) as SyllabusEntry[];

  let cards: { syllabus_entry_id: string; student_id: string }[] = [];
  if (entries.length > 0) {
    const cardsRes = await supabase
      .from("report_cards")
      .select("syllabus_entry_id, student_id")
      .in(
        "syllabus_entry_id",
        entries.map((e) => e.id),
      );
    if (cardsRes.error) throw new Error(cardsRes.error.message);
    cards = cardsRes.data ?? [];
  }

  const schoolById = new Map(schools.map((s) => [s.id, s]));
  const gradeById = new Map(grades.map((g) => [g.id, g]));
  const planById = new Map(plans.map((p) => [p.id, p]));
  const studentGradeById = new Map(students.map((s) => [s.id, s.grade_id]));

  const gradesBySchool = new Map<string, Grade[]>();
  for (const g of grades) {
    const arr = gradesBySchool.get(g.school_id) ?? [];
    arr.push(g);
    gradesBySchool.set(g.school_id, arr);
  }

  const rosterSize = new Map<string, number>();
  for (const s of students) {
    const key = `${s.school_id}:${s.grade_id}`;
    rosterSize.set(key, (rosterSize.get(key) ?? 0) + 1);
  }

  const filledByEntryGrade = new Map<string, number>();
  for (const card of cards) {
    const gradeId = studentGradeById.get(card.student_id);
    if (!gradeId) continue;
    const key = `${card.syllabus_entry_id}:${gradeId}`;
    filledByEntryGrade.set(key, (filledByEntryGrade.get(key) ?? 0) + 1);
  }

  function toSession(entry: SyllabusEntry, grade: Grade): ScheduledSession | null {
    const plan = planById.get(entry.lesson_plan_id);
    if (!plan) return null;
    const studentCount = rosterSize.get(`${entry.school_id}:${grade.id}`) ?? 0;
    const filled = filledByEntryGrade.get(`${entry.id}:${grade.id}`) ?? 0;
    return {
      entry,
      lesson_plan: plan,
      school: schoolById.get(entry.school_id) ?? null,
      grade,
      student_count: studentCount,
      filled_count: filled,
      status: fillStatus(studentCount, filled),
    };
  }

  const result: CoachSchedule[] = [];

  for (const coach of coaches) {
    const mine = assignments.filter((a) => a.coach_id === coach.id);
    if (mine.length === 0) continue;

    const sessions: ScheduledSession[] = [];
    for (const a of mine) {
      const grade = gradeById.get(a.grade_id);
      if (!grade) continue;
      for (const entry of entries) {
        if (entry.school_id !== a.school_id) continue;
        const session = toSession(entry, grade);
        if (session) sessions.push(session);
      }
    }

    result.push({
      coach,
      grades: mine.map((a) => ({
        school: schoolById.get(a.school_id) ?? null,
        grade: gradeById.get(a.grade_id) ?? null,
      })),
      sessions,
    });
  }

  // (school, grade) pairs nobody is assigned to still need their sessions shown.
  const assignedPairs = new Set(
    assignments.map((a) => `${a.school_id}:${a.grade_id}`),
  );
  const orphanSessions: ScheduledSession[] = [];
  for (const entry of entries) {
    const gradesHere = gradesBySchool.get(entry.school_id) ?? [];
    for (const grade of gradesHere) {
      if (assignedPairs.has(`${entry.school_id}:${grade.id}`)) continue;
      const session = toSession(entry, grade);
      if (session) orphanSessions.push(session);
    }
  }
  if (orphanSessions.length > 0) {
    result.push({ coach: null, grades: [], sessions: orphanSessions });
  }

  return result;
}

/**
 * The core read for the report card editor: every student at the session's
 * school in the given grade, pre-filled with their saved card, plus that
 * (lesson plan, grade) pairing's assessment objectives so the coach sees the
 * goal — the same lesson plan can carry different objectives per grade.
 */
export async function getReportCardRows(
  entryId: string,
  gradeId: string,
): Promise<{
  entry: SyllabusEntry;
  plan: LessonPlan | null;
  objectives: AssessmentObjective[];
  school: School | null;
  grade: Grade | null;
  coaches: Coach[];
  rows: ReportCardRow[];
} | null> {
  const supabase = await createClient();

  const entryRes = await supabase
    .from("syllabus_entries")
    .select("*")
    .eq("id", entryId)
    .maybeSingle();
  if (entryRes.error) throw new Error(entryRes.error.message);
  if (!entryRes.data) return null;
  const entry = entryRes.data as SyllabusEntry;

  const [planRes, cardsRes, school, grade, studentsRes] = await Promise.all([
    supabase
      .from("lesson_plans")
      .select("*")
      .eq("id", entry.lesson_plan_id)
      .maybeSingle(),
    supabase.from("report_cards").select("*").eq("syllabus_entry_id", entryId),
    getSchool(entry.school_id),
    getGrade(gradeId),
    supabase
      .from("students")
      .select("*")
      .eq("school_id", entry.school_id)
      .eq("grade_id", gradeId)
      .order("name"),
  ]);
  if (planRes.error) throw new Error(planRes.error.message);
  if (cardsRes.error) throw new Error(cardsRes.error.message);
  if (studentsRes.error) throw new Error(studentsRes.error.message);
  if (!grade) return null;

  const plan = (planRes.data as LessonPlan) ?? null;
  const students = (studentsRes.data ?? []) as Student[];

  let objectives: AssessmentObjective[] = [];
  if (plan) {
    const curRes = await supabase
      .from("curricula")
      .select("id")
      .eq("lesson_plan_id", plan.id)
      .eq("grade_id", gradeId)
      .maybeSingle();
    if (curRes.error) throw new Error(curRes.error.message);
    const curriculumId = (curRes.data as { id: string } | null)?.id;
    if (curriculumId) objectives = await getObjectives(curriculumId);
  }

  const [assignments, allCoaches] = await Promise.all([
    getCoachAssignments(),
    getCoaches(),
  ]);
  const coachIds = new Set(
    assignments
      .filter((a) => a.school_id === entry.school_id && a.grade_id === gradeId)
      .map((a) => a.coach_id),
  );
  const coaches = allCoaches.filter((c) => coachIds.has(c.id));

  const studentIds = new Set(students.map((s) => s.id));
  const cardByStudent = new Map(
    ((cardsRes.data ?? []) as ReportCard[])
      .filter((c) => studentIds.has(c.student_id))
      .map((c) => [c.student_id, c]),
  );

  const rows: ReportCardRow[] = students.map((s) => {
    const card = cardByStudent.get(s.id);
    return {
      student_id: s.id,
      student_name: s.name,
      attendance_session1: card?.attendance_session1 ?? "P",
      attendance_session2: card?.attendance_session2 ?? "P",
      assessment: toScore(card?.assessment),
      right_behavior: toScore(card?.right_behavior),
      notes: card?.notes ?? "",
      saved: Boolean(card),
    };
  });

  return { entry, plan, objectives, school, grade, coaches, rows };
}

/** Admin reporting: every saved card, newest first, with names resolved. */
export async function getAllReportCards(): Promise<
  {
    card: ReportCard;
    student_name: string;
    plan_title: string;
    entry_id: string;
    grade_id: string;
    school_id: string;
    school: string;
    grade: string;
  }[]
> {
  const supabase = await createClient();
  const [cardsRes, students, entries, plans, schools, grades] = await Promise.all(
    [
      supabase
        .from("report_cards")
        .select("*")
        .order("updated_at", { ascending: false }),
      getStudents(),
      all<SyllabusEntry>("syllabus_entries"),
      getLessonPlans(),
      getSchools(),
      getGrades(),
    ],
  );
  if (cardsRes.error) throw new Error(cardsRes.error.message);

  const studentById = new Map(students.map((s) => [s.id, s]));
  const entryById = new Map(entries.map((e) => [e.id, e]));
  const planById = new Map(plans.map((p) => [p.id, p]));
  const schoolById = new Map(schools.map((s) => [s.id, s]));
  const gradeById = new Map(grades.map((g) => [g.id, g]));

  return ((cardsRes.data ?? []) as ReportCard[]).map((card) => {
    const student = studentById.get(card.student_id);
    const entry = entryById.get(card.syllabus_entry_id);
    const plan = entry ? planById.get(entry.lesson_plan_id) : undefined;

    return {
      card,
      student_name: student?.name ?? "Unknown student",
      plan_title: plan?.title ?? "Unknown lesson plan",
      entry_id: card.syllabus_entry_id,
      grade_id: student?.grade_id ?? "",
      school_id: entry?.school_id ?? "",
      school: entry ? (schoolById.get(entry.school_id)?.name ?? "") : "",
      grade: student ? (gradeById.get(student.grade_id)?.name ?? "") : "",
    };
  });
}
