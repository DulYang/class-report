import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteButton from "@/components/DeleteButton";
import ClassForm from "@/components/forms/ClassForm";
import StatusBadge from "@/components/StatusBadge";
import { deleteClassAction } from "@/lib/actions/classes";
import {
  getClassesWithSchedule,
  getCoachSchools,
  getCoaches,
  getGrades,
  getSchools,
  getStudents,
} from "@/lib/data/queries";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  let classes;
  let coaches;
  let schools;
  let grades;
  let students;
  let coachSchools;
  try {
    [classes, coaches, schools, grades, students, coachSchools] =
      await Promise.all([
        getClassesWithSchedule(),
        getCoaches(),
        getSchools(),
        getGrades(),
        getStudents(classId),
        getCoachSchools(),
      ]);
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load this class</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  const cls = classes.find((c) => c.id === classId);
  if (!cls) notFound();

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <Link
          href="/classes"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Classes
        </Link>
        <p className="text-sm font-semibold text-neutral-500">
          {cls.coach ? cls.coach.name : "No coach assigned"}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{cls.name}</h1>
        <p className="text-sm text-neutral-600">
          {cls.school?.name ?? "Unknown school"} ·{" "}
          {cls.grade?.name ?? "Unknown grade"}
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Class details</h2>
        <ClassForm
          coaches={coaches}
          schools={schools}
          grades={grades}
          coachSchools={coachSchools}
          initial={cls}
        />
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <DeleteButton
            action={deleteClassAction}
            hidden={{ id: cls.id }}
            label="Delete this class"
            confirmMessage={`Delete "${cls.name}"? Its students and their report cards will be deleted. The syllabus is not affected.`}
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="font-semibold">
            Scheduled lessons{" "}
            <span className="text-sm font-normal text-neutral-500">
              ({cls.lessons.length})
            </span>
          </h2>
          <p className="text-xs text-neutral-500">
            From {cls.school?.name ?? "the school"}&apos;s syllabus for{" "}
            {cls.grade?.name ?? "this grade"} — admins schedule these.
          </p>
        </div>

        {cls.lessons.length === 0 ? (
          <p className="px-4 py-4 text-sm text-neutral-500">
            Nothing scheduled for this grade yet. An admin adds lesson plans to
            the school&apos;s syllabus.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {cls.lessons.map((lesson) => (
              <li key={lesson.entry.id}>
                <Link
                  href={`/reports/${cls.id}/${lesson.entry.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50"
                >
                  <div>
                    <p className="font-medium">{lesson.lesson_plan.title}</p>
                    <p className="text-xs text-neutral-500">
                      {formatDate(lesson.entry.session_date1)}
                      {lesson.entry.session_date2
                        ? ` · ${formatDate(lesson.entry.session_date2)}`
                        : ""}{" "}
                      · {lesson.filled_count}/{lesson.student_count} filled
                    </p>
                  </div>
                  <StatusBadge status={lesson.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="font-semibold">
            Students{" "}
            <span className="text-sm font-normal text-neutral-500">
              ({students.length})
            </span>
          </h2>
          <p className="text-xs text-neutral-500">
            Read-only — admins manage the roster.
          </p>
        </div>

        {students.length === 0 ? (
          <p className="px-4 py-4 text-sm text-neutral-500">
            No students yet. An admin adds them on the Students page.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {students.map((s) => (
              <li key={s.id} className="px-4 py-2.5 font-medium">
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
