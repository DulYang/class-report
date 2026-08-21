import Link from "next/link";
import ClassForm from "@/components/forms/ClassForm";
import StatusBadge from "@/components/StatusBadge";
import {
  getClassesWithSchedule,
  getCoaches,
  getGrades,
  getSchools,
} from "@/lib/data/queries";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  let classes;
  let coaches;
  let schools;
  let grades;
  try {
    [classes, coaches, schools, grades] = await Promise.all([
      getClassesWithSchedule(),
      getCoaches(),
      getSchools(),
      getGrades(),
    ]);
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load classes</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
        <p className="text-sm text-neutral-600">
          {classes.length} class{classes.length === 1 ? "" : "es"}. Lesson plans
          come from the school&apos;s syllabus, which admins manage.
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">New class</h2>
        <ClassForm coaches={coaches} schools={schools} grades={grades} />
      </section>

      {classes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
          No classes yet — create one above to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="rounded-lg border border-neutral-200 bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <Link
                    href={`/classes/${cls.id}`}
                    className="font-semibold hover:underline"
                  >
                    {cls.name}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    {cls.school?.name ?? "Unknown school"} ·{" "}
                    {cls.grade?.name ?? "Unknown grade"} · {cls.student_count}{" "}
                    student{cls.student_count === 1 ? "" : "s"} ·{" "}
                    {cls.lessons.length} scheduled lesson
                    {cls.lessons.length === 1 ? "" : "s"}
                    {cls.coach ? ` · ${cls.coach.name}` : " · Unassigned"}
                  </p>
                </div>
                <Link
                  href={`/classes/${cls.id}`}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
                >
                  Manage
                </Link>
              </div>

              {cls.lessons.length > 0 && (
                <ul className="divide-y divide-neutral-100 border-t border-neutral-200">
                  {cls.lessons.map((lesson) => (
                    <li key={lesson.entry.id}>
                      <Link
                        href={`/reports/${cls.id}/${lesson.entry.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-neutral-50"
                      >
                        <span>
                          <span className="font-medium">
                            {lesson.lesson_plan.title}
                          </span>{" "}
                          <span className="text-xs text-neutral-500">
                            {formatDate(lesson.entry.session_date1)}
                            {lesson.entry.session_date2
                              ? ` · ${formatDate(lesson.entry.session_date2)}`
                              : ""}
                          </span>
                        </span>
                        <StatusBadge status={lesson.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
