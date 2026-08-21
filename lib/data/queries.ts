import { createClient } from "@/lib/supabase/server";
import {
  fillStatus,
  type Class,
  type ClassWithPlans,
  type Coach,
  type LessonPlan,
  type LessonPlanWithStatus,
  type ReportCard,
  type ReportCardRow,
  type Student,
} from "@/lib/types";

/**
 * Every DB read lives here. Pages/components never query Supabase inline.
 * Joins are assembled in JS rather than via nested selects so a missing FK
 * relationship never silently drops rows from the grid.
 */

export async function getCoaches(): Promise<Coach[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as Coach[];
}

export async function getClasses(): Promise<Class[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as Class[];
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

export async function getLessonPlans(classId: string): Promise<LessonPlan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_plans")
    .select("*")
    .eq("class_id", classId)
    .order("session_date1");
  if (error) throw new Error(error.message);
  return (data ?? []) as LessonPlan[];
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

/**
 * Classes with their coach, roster size, and every lesson plan tagged with a
 * fill-status badge. Optionally windowed to lesson plans whose sessions touch
 * [from, to] — used by the weekly view.
 */
export async function getClassesWithPlans(range?: {
  from: string;
  to: string;
}): Promise<ClassWithPlans[]> {
  const supabase = await createClient();

  const [classesRes, coachesRes, studentsRes, plansRes] = await Promise.all([
    supabase.from("classes").select("*").order("created_at"),
    supabase.from("coaches").select("*"),
    supabase.from("students").select("id, class_id"),
    (() => {
      const q = supabase.from("lesson_plans").select("*");
      // A plan is "in the week" if either of its two sessions falls inside it.
      return range
        ? q
            .or(
              `and(session_date1.gte.${range.from},session_date1.lte.${range.to}),` +
                `and(session_date2.gte.${range.from},session_date2.lte.${range.to})`,
            )
            .order("session_date1")
        : q.order("session_date1");
    })(),
  ]);

  for (const res of [classesRes, coachesRes, studentsRes, plansRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const classes = (classesRes.data ?? []) as Class[];
  const coaches = (coachesRes.data ?? []) as Coach[];
  const students = (studentsRes.data ?? []) as { id: string; class_id: string }[];
  const plans = (plansRes.data ?? []) as LessonPlan[];

  const planIds = plans.map((p) => p.id);
  let cards: { lesson_plan_id: string; student_id: string }[] = [];
  if (planIds.length > 0) {
    const { data, error } = await supabase
      .from("report_cards")
      .select("lesson_plan_id, student_id")
      .in("lesson_plan_id", planIds);
    if (error) throw new Error(error.message);
    cards = data ?? [];
  }

  const studentsByClass = new Map<string, number>();
  for (const s of students) {
    studentsByClass.set(s.class_id, (studentsByClass.get(s.class_id) ?? 0) + 1);
  }

  const cardsByPlan = new Map<string, number>();
  for (const c of cards) {
    cardsByPlan.set(c.lesson_plan_id, (cardsByPlan.get(c.lesson_plan_id) ?? 0) + 1);
  }

  const coachById = new Map(coaches.map((c) => [c.id, c]));

  return classes.map((cls) => {
    const studentCount = studentsByClass.get(cls.id) ?? 0;
    const clsPlans: LessonPlanWithStatus[] = plans
      .filter((p) => p.class_id === cls.id)
      .map((p) => {
        const filled = cardsByPlan.get(p.id) ?? 0;
        return {
          ...p,
          student_count: studentCount,
          filled_count: filled,
          status: fillStatus(studentCount, filled),
        };
      });

    return {
      ...cls,
      coach: cls.coach_id ? (coachById.get(cls.coach_id) ?? null) : null,
      student_count: studentCount,
      lesson_plans: clsPlans,
    };
  });
}

/**
 * The core read for the report card editor: every student in the lesson plan's
 * class, pre-filled with their saved card if one exists. Students without a
 * card get defaults so the coach can fill the whole roster in one pass.
 */
export async function getReportCardRows(
  lessonPlanId: string,
): Promise<{ plan: LessonPlan; cls: Class | null; rows: ReportCardRow[] } | null> {
  const plan = await getLessonPlan(lessonPlanId);
  if (!plan) return null;

  const supabase = await createClient();
  const [cls, students, cardsRes] = await Promise.all([
    getClass(plan.class_id),
    getStudents(plan.class_id),
    supabase.from("report_cards").select("*").eq("lesson_plan_id", lessonPlanId),
  ]);
  if (cardsRes.error) throw new Error(cardsRes.error.message);

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

  return { plan, cls, rows };
}

/** Admin reporting: every saved card, newest first, with names resolved. */
export async function getAllReportCards(): Promise<
  {
    card: ReportCard;
    student_name: string;
    plan_title: string;
    class_name: string;
    school: string;
    grade: string;
    coach_name: string | null;
  }[]
> {
  const supabase = await createClient();
  const [cardsRes, studentsRes, plansRes, classesRes, coachesRes] =
    await Promise.all([
      supabase.from("report_cards").select("*").order("updated_at", { ascending: false }),
      supabase.from("students").select("id, name"),
      supabase.from("lesson_plans").select("id, title, class_id"),
      supabase.from("classes").select("id, name, school, grade, coach_id"),
      supabase.from("coaches").select("id, name"),
    ]);

  for (const res of [cardsRes, studentsRes, plansRes, classesRes, coachesRes]) {
    if (res.error) throw new Error(res.error.message);
  }

  const studentById = new Map(
    ((studentsRes.data ?? []) as { id: string; name: string }[]).map((s) => [s.id, s]),
  );
  const planById = new Map(
    (
      (plansRes.data ?? []) as { id: string; title: string; class_id: string }[]
    ).map((p) => [p.id, p]),
  );
  const classById = new Map(
    (
      (classesRes.data ?? []) as {
        id: string;
        name: string;
        school: string;
        grade: string;
        coach_id: string | null;
      }[]
    ).map((c) => [c.id, c]),
  );
  const coachById = new Map(
    ((coachesRes.data ?? []) as { id: string; name: string }[]).map((c) => [c.id, c]),
  );

  return ((cardsRes.data ?? []) as ReportCard[]).map((card) => {
    const plan = planById.get(card.lesson_plan_id);
    const cls = plan ? classById.get(plan.class_id) : undefined;
    const coach = cls?.coach_id ? coachById.get(cls.coach_id) : undefined;
    return {
      card,
      student_name: studentById.get(card.student_id)?.name ?? "Unknown student",
      plan_title: plan?.title ?? "Unknown lesson plan",
      class_name: cls?.name ?? "Unknown class",
      school: cls?.school ?? "",
      grade: cls?.grade ?? "",
      coach_name: coach?.name ?? null,
    };
  });
}
