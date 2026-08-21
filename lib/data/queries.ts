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

export function getCoaches(): Promise<Coach[]> {
  return all<Coach>("coaches", "name");
}

export function getCoachAssignments(): Promise<CoachAssignment[]> {
  return all<CoachAssignment>("coach_assignments");
}

export function getCurricula(): Promise<Curriculum[]> {
  return all<Curriculum>("curricula", "name");
}

export function getLessonPlans(): Promise<LessonPlan[]> {
  return all<LessonPlan>("lesson_plans", "title");
}

export function getStudents(): Promise<Student[]> {
  return all<Student>("students", "name");
}

export async function getObjectives(
  lessonPlanId: string,
): Promise<AssessmentObjective[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessment_objectives")
    .select("*")
    .eq("lesson_plan_id", lessonPlanId)
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

// ── admin: curriculum ──────────────────────────────────────────────────────

/** One curriculum with its grade, school, lesson plans and their objectives. */
export async function getCurriculumDetail(id: string): Promise<{
  curriculum: Curriculum;
  grade: Grade | null;
  school: School | null;
  plans: (LessonPlan & { objectives: AssessmentObjective[] })[];
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("curricula")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const curriculum = data as Curriculum;

  const [gradeRes, plansRes] = await Promise.all([
    supabase.from("grades").select("*").eq("id", curriculum.grade_id).maybeSingle(),
    supabase
      .from("lesson_plans")
      .select("*")
      .eq("curriculum_id", id)
      .order("sort_order"),
  ]);
  if (gradeRes.error) throw new Error(gradeRes.error.message);
  if (plansRes.error) throw new Error(plansRes.error.message);

  const grade = (gradeRes.data as Grade) ?? null;
  const plans = (plansRes.data ?? []) as LessonPlan[];
  const school = grade ? await getSchool(grade.school_id) : null;

  let objectives: AssessmentObjective[] = [];
  if (plans.length > 0) {
    const objRes = await supabase
      .from("assessment_objectives")
      .select("*")
      .in(
        "lesson_plan_id",
        plans.map((p) => p.id),
      )
      .order("sort_order");
    if (objRes.error) throw new Error(objRes.error.message);
    objectives = (objRes.data ?? []) as AssessmentObjective[];
  }

  return {
    curriculum,
    grade,
    school,
    plans: plans.map((p) => ({
      ...p,
      objectives: objectives.filter((o) => o.lesson_plan_id === p.id),
    })),
  };
}

export type LessonPlanOption = {
  plan: LessonPlan;
  curriculum: Curriculum;
  grade: Grade | null;
  school: School | null;
};

/** Lesson plans across every curriculum, labelled with grade + school. */
export async function getLessonPlanOptions(): Promise<LessonPlanOption[]> {
  const [plans, curricula, grades, schools] = await Promise.all([
    getLessonPlans(),
    getCurricula(),
    getGrades(),
    getSchools(),
  ]);
  const curriculumById = new Map(curricula.map((c) => [c.id, c]));
  const gradeById = new Map(grades.map((g) => [g.id, g]));
  const schoolById = new Map(schools.map((s) => [s.id, s]));

  return plans.flatMap((plan) => {
    const curriculum = curriculumById.get(plan.curriculum_id);
    if (!curriculum) return [];
    const grade = gradeById.get(curriculum.grade_id) ?? null;
    return [
      {
        plan,
        curriculum,
        grade,
        school: grade ? (schoolById.get(grade.school_id) ?? null) : null,
      },
    ];
  });
}

/** A school's syllabus: which lesson plans are taught, and when. */
export async function getSyllabus(
  schoolId: string,
): Promise<
  { entry: SyllabusEntry; plan: LessonPlan | null; grade: Grade | null }[]
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("syllabus_entries")
    .select("*")
    .eq("school_id", schoolId)
    .order("session_date1");
  if (error) throw new Error(error.message);
  const entries = (data ?? []) as SyllabusEntry[];

  const [plans, curricula, grades] = await Promise.all([
    getLessonPlans(),
    getCurricula(),
    getGrades(),
  ]);
  const planById = new Map(plans.map((p) => [p.id, p]));
  const curriculumById = new Map(curricula.map((c) => [c.id, c]));
  const gradeById = new Map(grades.map((g) => [g.id, g]));

  return entries.map((entry) => {
    const plan = planById.get(entry.lesson_plan_id) ?? null;
    const curriculum = plan ? curriculumById.get(plan.curriculum_id) : undefined;
    return {
      entry,
      plan,
      grade: curriculum ? (gradeById.get(curriculum.grade_id) ?? null) : null,
    };
  });
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
 * The week's sessions, grouped by the coach who owns them. A session belongs to
 * a coach when it is scheduled at a school and its lesson plan sits in a
 * curriculum for a grade that coach is assigned to. Sessions nobody is assigned
 * to are collected under a null coach so they are never hidden.
 */
export async function getWeeklySchedule(range?: {
  from: string;
  to: string;
}): Promise<CoachSchedule[]> {
  const supabase = await createClient();

  const [coaches, schools, grades, curricula, plans, assignments, students] =
    await Promise.all([
      getCoaches(),
      getSchools(),
      getGrades(),
      getCurricula(),
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
  const curriculumById = new Map(curricula.map((c) => [c.id, c]));
  const planById = new Map(plans.map((p) => [p.id, p]));

  const rosterSize = new Map<string, number>();
  for (const s of students) {
    const key = `${s.school_id}:${s.grade_id}`;
    rosterSize.set(key, (rosterSize.get(key) ?? 0) + 1);
  }

  const filledByEntry = new Map<string, number>();
  for (const card of cards) {
    filledByEntry.set(
      card.syllabus_entry_id,
      (filledByEntry.get(card.syllabus_entry_id) ?? 0) + 1,
    );
  }

  /** The grade a syllabus entry targets, via its plan's curriculum. */
  function gradeOfEntry(entry: SyllabusEntry): string | null {
    const plan = planById.get(entry.lesson_plan_id);
    if (!plan) return null;
    return curriculumById.get(plan.curriculum_id)?.grade_id ?? null;
  }

  function toSession(entry: SyllabusEntry): ScheduledSession | null {
    const plan = planById.get(entry.lesson_plan_id);
    if (!plan) return null;
    const gradeId = gradeOfEntry(entry);
    const studentCount = gradeId
      ? (rosterSize.get(`${entry.school_id}:${gradeId}`) ?? 0)
      : 0;
    const filled = filledByEntry.get(entry.id) ?? 0;
    return {
      entry,
      lesson_plan: plan,
      school: schoolById.get(entry.school_id) ?? null,
      grade: gradeId ? (gradeById.get(gradeId) ?? null) : null,
      student_count: studentCount,
      filled_count: filled,
      status: fillStatus(studentCount, filled),
    };
  }

  const claimed = new Set<string>();
  const result: CoachSchedule[] = [];

  for (const coach of coaches) {
    const mine = assignments.filter((a) => a.coach_id === coach.id);
    if (mine.length === 0) continue;

    const owns = (entry: SyllabusEntry) => {
      const gradeId = gradeOfEntry(entry);
      return mine.some(
        (a) => a.school_id === entry.school_id && a.grade_id === gradeId,
      );
    };

    const sessions = entries.filter(owns).flatMap((e) => {
      claimed.add(e.id);
      const session = toSession(e);
      return session ? [session] : [];
    });

    result.push({
      coach,
      grades: mine.map((a) => ({
        school: schoolById.get(a.school_id) ?? null,
        grade: gradeById.get(a.grade_id) ?? null,
      })),
      sessions,
    });
  }

  const orphaned = entries.filter((e) => !claimed.has(e.id));
  if (orphaned.length > 0) {
    result.push({
      coach: null,
      grades: [],
      sessions: orphaned.flatMap((e) => {
        const session = toSession(e);
        return session ? [session] : [];
      }),
    });
  }

  return result;
}

/**
 * The core read for the report card editor: every student at the session's
 * school in the grade its lesson plan targets, pre-filled with their saved
 * card, plus the plan's assessment objectives so the coach sees the goal.
 */
export async function getReportCardRows(entryId: string): Promise<{
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

  const [planRes, cardsRes, school] = await Promise.all([
    supabase
      .from("lesson_plans")
      .select("*")
      .eq("id", entry.lesson_plan_id)
      .maybeSingle(),
    supabase.from("report_cards").select("*").eq("syllabus_entry_id", entryId),
    getSchool(entry.school_id),
  ]);
  if (planRes.error) throw new Error(planRes.error.message);
  if (cardsRes.error) throw new Error(cardsRes.error.message);

  const plan = (planRes.data as LessonPlan) ?? null;

  let grade: Grade | null = null;
  if (plan) {
    const curRes = await supabase
      .from("curricula")
      .select("grade_id")
      .eq("id", plan.curriculum_id)
      .maybeSingle();
    if (curRes.error) throw new Error(curRes.error.message);
    const gradeId = (curRes.data as { grade_id: string } | null)?.grade_id;
    if (gradeId) {
      const gradeRes = await supabase
        .from("grades")
        .select("*")
        .eq("id", gradeId)
        .maybeSingle();
      if (gradeRes.error) throw new Error(gradeRes.error.message);
      grade = (gradeRes.data as Grade) ?? null;
    }
  }

  let students: Student[] = [];
  if (grade) {
    const studentsRes = await supabase
      .from("students")
      .select("*")
      .eq("school_id", entry.school_id)
      .eq("grade_id", grade.id)
      .order("name");
    if (studentsRes.error) throw new Error(studentsRes.error.message);
    students = (studentsRes.data ?? []) as Student[];
  }

  let coaches: Coach[] = [];
  if (grade) {
    const [assignments, allCoaches] = await Promise.all([
      getCoachAssignments(),
      getCoaches(),
    ]);
    const ids = new Set(
      assignments
        .filter((a) => a.school_id === entry.school_id && a.grade_id === grade.id)
        .map((a) => a.coach_id),
    );
    coaches = allCoaches.filter((c) => ids.has(c.id));
  }

  const objectives = plan ? await getObjectives(plan.id) : [];

  const cardByStudent = new Map(
    ((cardsRes.data ?? []) as ReportCard[]).map((c) => [c.student_id, c]),
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
    school_id: string;
    school: string;
    grade: string;
  }[]
> {
  const supabase = await createClient();
  const [cardsRes, students, entries, plans, curricula, schools, grades] =
    await Promise.all([
      supabase
        .from("report_cards")
        .select("*")
        .order("updated_at", { ascending: false }),
      getStudents(),
      all<SyllabusEntry>("syllabus_entries"),
      getLessonPlans(),
      getCurricula(),
      getSchools(),
      getGrades(),
    ]);
  if (cardsRes.error) throw new Error(cardsRes.error.message);

  const studentById = new Map(students.map((s) => [s.id, s]));
  const entryById = new Map(entries.map((e) => [e.id, e]));
  const planById = new Map(plans.map((p) => [p.id, p]));
  const curriculumById = new Map(curricula.map((c) => [c.id, c]));
  const schoolById = new Map(schools.map((s) => [s.id, s]));
  const gradeById = new Map(grades.map((g) => [g.id, g]));

  return ((cardsRes.data ?? []) as ReportCard[]).map((card) => {
    const student = studentById.get(card.student_id);
    const entry = entryById.get(card.syllabus_entry_id);
    const plan = entry ? planById.get(entry.lesson_plan_id) : undefined;
    const curriculum = plan ? curriculumById.get(plan.curriculum_id) : undefined;

    return {
      card,
      student_name: student?.name ?? "Unknown student",
      plan_title: plan?.title ?? "Unknown lesson plan",
      entry_id: card.syllabus_entry_id,
      school_id: entry?.school_id ?? "",
      school: entry ? (schoolById.get(entry.school_id)?.name ?? "") : "",
      grade: curriculum
        ? (gradeById.get(curriculum.grade_id)?.name ?? "")
        : "",
    };
  });
}
