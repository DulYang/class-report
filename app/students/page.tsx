import Link from "next/link";
import StudentForm from "@/components/forms/StudentForm";
import StudentRow from "@/components/StudentRow";
import { createClient } from "@/lib/supabase/server";
import { getClasses, getGrades, getSchools } from "@/lib/data/queries";
import type { Student } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  let classes;
  let students: Student[];
  let schools;
  let grades;
  try {
    const supabase = await createClient();
    const [classesResult, studentsResult, schoolList, gradeList] =
      await Promise.all([
        getClasses(),
        supabase.from("students").select("*").order("name"),
        getSchools(),
        getGrades(),
      ]);
    if (studentsResult.error) throw new Error(studentsResult.error.message);
    classes = classesResult;
    students = (studentsResult.data ?? []) as Student[];
    schools = schoolList;
    grades = gradeList;
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load students</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  const classById = new Map(classes.map((c) => [c.id, c]));
  const schoolById = new Map(schools.map((s) => [s.id, s]));
  const gradeById = new Map(grades.map((g) => [g.id, g]));
  const byClass = classes
    .map((cls) => ({
      cls,
      students: students.filter((s) => s.class_id === cls.id),
    }))
    .filter((group) => group.students.length > 0);

  const orphaned = students.filter((s) => !classById.has(s.class_id));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Students</h1>
        <p className="text-sm text-neutral-600">
          {students.length} student{students.length === 1 ? "" : "s"} across{" "}
          {classes.length} class{classes.length === 1 ? "" : "es"}.
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Add a student</h2>
        {classes.length === 0 ? (
          <p className="text-sm text-neutral-600">
            Create a class first —{" "}
            <Link href="/classes" className="font-medium underline">
              go to Classes
            </Link>
            .
          </p>
        ) : (
          <StudentForm classes={classes} />
        )}
      </section>

      {students.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
          No students yet.
        </p>
      ) : (
        <div className="space-y-3">
          {byClass.map(({ cls, students: roster }) => (
            <div
              key={cls.id}
              className="rounded-lg border border-neutral-200 bg-white"
            >
              <div className="border-b border-neutral-200 px-4 py-3">
                <Link
                  href={`/classes/${cls.id}`}
                  className="font-semibold hover:underline"
                >
                  {cls.name}
                </Link>
                <p className="text-xs text-neutral-500">
                  {schoolById.get(cls.school_id)?.name ?? "Unknown school"} ·{" "}
                  {gradeById.get(cls.grade_id)?.name ?? "Unknown grade"} ·{" "}
                  {roster.length} student
                  {roster.length === 1 ? "" : "s"}
                </p>
              </div>
              <ul className="divide-y divide-neutral-100">
                {roster.map((s) => (
                  <StudentRow key={s.id} student={s} />
                ))}
              </ul>
            </div>
          ))}

          {orphaned.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">
                {orphaned.length} student
                {orphaned.length === 1 ? "" : "s"} with no matching class
              </p>
              <ul className="mt-2 divide-y divide-amber-200">
                {orphaned.map((s) => (
                  <StudentRow key={s.id} student={s} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
