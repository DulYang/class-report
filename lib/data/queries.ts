import { createClient } from "@/lib/supabase/server";
import {
  fillStatus,
  type AssessmentObjective,
  type Class,
  type ClassWithSchedule,
  type Coach,
  type Curriculum,
  type Grade,
  type LessonPlan,
  type ReportCard,
  type ReportCardRow,
  type ScheduledLesson,
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

// ── admin domain ───────────────────────────────────────────────────────────

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

export function getCurricula(): Promise<Curriculum[]> {
  return all<Curriculum>("curricula", "name");
}

export function getClasses(): Promise<Class[]> {
  return all<Class>("classes", "created_at");
}

export function getLessonPlans(): Promise<LessonPlan[]> {
  return all<LessonPlan>("lesson_plans", "title");
}

export async function getClass(id: string): Promise<Class | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Class) ?? null;
}

export async function getStudents(classId: string): Promise<Student[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("class_id", classId)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Student[];
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

/** Grades decorated with the school they belong to, for admin pickers. */
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

// ── coach domain ───────────────────────────────────────────────────────────

/**
 * Classes with the syllabus entries that apply to them. An entry applies when
 * it is scheduled at the class's school AND its lesson plan sits in a
 * curriculum for the class's grade. Optionally windowed to a week.
 */
export async function getClassesWithSchedule(range?: {
  from: string;
  to: string;
}): Promise<ClassWithSchedule[]> {
  const supabase = await createClient();

  const [classes, coaches, schools, grades, curricula, plans] = await Promise.all([
    getClasses(),
    getCoaches(),
    getSchools(),
    getGrades(),
    getCurricula(),
    getLessonPlans(),
  ]);

  const studentsRes = await supabase.from("students").select("id, class_id");
  if (studentsRes.error) throw new Error(studentsRes.error.message);
  const students = (studentsRes.data ?? []) as { id: string; class_id: string }[];

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

  const coachById = new Map(coaches.map((c) => [c.id, c]));
  const schoolById = new Map(schools.map((s) => [s.id, s]));
  const gradeById = new Map(grades.map((g) => [g.id, g]));
  const curriculumById = new Map(curricula.map((c) => [c.id, c]));
  const planById = new Map(plans.map((p) => [p.id, p]));

  const classOfStudent = new Map(students.map((s) => [s.id, s.class_id]));
  const studentsByClass = new Map<string, number>();
  for (const s of students) {
    studentsByClass.set(s.class_id, (studentsByClass.get(s.class_id) ?? 0) + 1);
  }

  // Cards counted per (entry, class) — several classes can share one entry.
  const filledByEntryClass = new Map<string, number>();
  for (const card of cards) {
    const classId = classOfStudent.get(card.student_id);
    if (!classId) continue;
    const key = `${card.syllabus_entry_id}:${classId}`;
    filledByEntryClass.set(key, (filledByEntryClass.get(key) ?? 0) + 1);
  }

  /** The grade a syllabus entry targets, via its plan's curriculum. */
  function gradeOfEntry(entry: SyllabusEntry): string | null {
    const plan = planById.get(entry.lesson_plan_id);
    if (!plan) return null;
    return curriculumById.get(plan.curriculum_id)?.grade_id ?? null;
  }

  return classes.map((cls) => {
    const studentCount = studentsByClass.get(cls.id) ?? 0;

    const lessons: ScheduledLesson[] = entries
      .filter(
        (e) => e.school_id === cls.school_id && gradeOfEntry(e) === cls.grade_id,
      )
      .flatMap((entry) => {
        const plan = planById.get(entry.lesson_plan_id);
        if (!plan) return [];
        const filled = filledByEntryClass.get(`${entry.id}:${cls.id}`) ?? 0;
        return [
          {
            entry,
            lesson_plan: plan,
            student_count: studentCount,
            filled_count: filled,
            status: fillStatus(studentCount, filled),
          },
        ];
      });

    return {
      ...cls,
      coach: cls.coach_id ? (coachById.get(cls.coach_id) ?? null) : null,
      school: schoolById.get(cls.school_id) ?? null,
      grade: gradeById.get(cls.grade_id) ?? null,
      student_count: studentCount,
      lessons,
    };
  });
}

/**
 * The core read for the report card editor: every student in the class,
 * pre-filled with their saved card for this scheduled session, plus the
 * lesson plan's assessment objectives so the coach sees the goal.
 */
export async function getReportCardRows(
  classId: string,
  entryId: string,
): Promise<{
  entry: SyllabusEntry;
  plan: LessonPlan | null;
  objectives: AssessmentObjective[];
  cls: Class | null;
  school: School | null;
  grade: Grade | null;
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

  const [cls, students, cardsRes, planRes] = await Promise.all([
    getClass(classId),
    getStudents(classId),
    supabase.from("report_cards").select("*").eq("syllabus_entry_id", entryId),
    supabase
      .from("lesson_plans")
      .select("*")
      .eq("id", entry.lesson_plan_id)
      .maybeSingle(),
  ]);
  if (cardsRes.error) throw new Error(cardsRes.error.message);
  if (planRes.error) throw new Error(planRes.error.message);
  if (!cls) return null;

  const plan = (planRes.data as LessonPlan) ?? null;

  const gradeRes = await supabase
    .from("grades")
    .select("*")
    .eq("id", cls.grade_id)
    .maybeSingle();
  if (gradeRes.error) throw new Error(gradeRes.error.message);

  const [objectives, school] = await Promise.all([
    plan ? getObjectives(plan.id) : Promise.resolve<AssessmentObjective[]>([]),
    getSchool(cls.school_id),
  ]);

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
      assessment: card?.assessment ?? "",
      right_behavior: card?.right_behavior ?? "",
      notes: card?.notes ?? "",
      saved: Boolean(card),
    };
  });

  return {
    entry,
    plan,
    objectives,
    cls,
    school,
    grade: (gradeRes.data as Grade) ?? null,
    rows,
  };
}

/** Admin reporting: every saved card, newest first, with names resolved. */
export async function getAllReportCards(): Promise<
  {
    card: ReportCard;
    student_name: string;
    plan_title: string;
    class_id: string | null;
    class_name: string;
    school: string;
    grade: string;
    coach_name: string | null;
  }[]
> {
  const supabase = await createClient();
  const [cardsRes, students, entries, plans, classes, schools, grades, coaches] =
    await Promise.all([
      supabase
        .from("report_cards")
        .select("*")
        .order("updated_at", { ascending: false }),
      all<Student>("students"),
      all<SyllabusEntry>("syllabus_entries"),
      getLessonPlans(),
      getClasses(),
      getSchools(),
      getGrades(),
      getCoaches(),
    ]);
  if (cardsRes.error) throw new Error(cardsRes.error.message);

  const studentById = new Map(students.map((s) => [s.id, s]));
  const entryById = new Map(entries.map((e) => [e.id, e]));
  const planById = new Map(plans.map((p) => [p.id, p]));
  const classById = new Map(classes.map((c) => [c.id, c]));
  const schoolById = new Map(schools.map((s) => [s.id, s]));
  const gradeById = new Map(grades.map((g) => [g.id, g]));
  const coachById = new Map(coaches.map((c) => [c.id, c]));

  return ((cardsRes.data ?? []) as ReportCard[]).map((card) => {
    const student = studentById.get(card.student_id);
    const cls = student ? classById.get(student.class_id) : undefined;
    const entry = entryById.get(card.syllabus_entry_id);
    const plan = entry ? planById.get(entry.lesson_plan_id) : undefined;
    const coach = cls?.coach_id ? coachById.get(cls.coach_id) : undefined;

    return {
      card,
      student_name: student?.name ?? "Unknown student",
      plan_title: plan?.title ?? "Unknown lesson plan",
      class_id: cls?.id ?? null,
      class_name: cls?.name ?? "Unknown class",
      school: cls ? (schoolById.get(cls.school_id)?.name ?? "") : "",
      grade: cls ? (gradeById.get(cls.grade_id)?.name ?? "") : "",
      coach_name: coach?.name ?? null,
    };
  });
}
