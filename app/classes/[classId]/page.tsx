import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteButton from "@/components/DeleteButton";
import ClassForm from "@/components/forms/ClassForm";
import LessonPlanForm from "@/components/forms/LessonPlanForm";
import StudentForm from "@/components/forms/StudentForm";
import LessonPlanRow from "@/components/LessonPlanRow";
import StudentRow from "@/components/StudentRow";
import { deleteClassAction } from "@/lib/actions/classes";
import { getClassesWithPlans, getCoaches, getStudents } from "@/lib/data/queries";
import { toDateInput, weekRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  let classes;
  let coaches;
  let students;
  try {
    [classes, coaches, students] = await Promise.all([
      getClassesWithPlans(),
      getCoaches(),
      getStudents(classId),
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

  const today = new Date();
  const week = weekRange(today);
  const second = new Date(today);
  second.setDate(second.getDate() + 2);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <Link
          href="/classes"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Classes
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{cls.name}</h1>
        <p className="text-sm text-neutral-600">
          {cls.school} · {cls.grade} ·{" "}
          {cls.coach ? cls.coach.name : "No coach assigned"}
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Class details</h2>
        <ClassForm coaches={coaches} initial={cls} />
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <DeleteButton
            action={deleteClassAction}
            hidden={{ id: cls.id }}
            label="Delete this class"
            confirmMessage={`Delete "${cls.name}"? Its lesson plans, students and report cards will all be deleted.`}
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="font-semibold">
            Lesson plans{" "}
            <span className="text-sm font-normal text-neutral-500">
              ({cls.lesson_plans.length})
            </span>
          </h2>
        </div>

        {cls.lesson_plans.length === 0 ? (
          <p className="px-4 py-4 text-sm text-neutral-500">
            No lesson plans yet — add the first one below.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {cls.lesson_plans.map((plan) => (
              <LessonPlanRow key={plan.id} plan={plan} />
            ))}
          </ul>
        )}

        <div className="border-t border-neutral-200 bg-neutral-50 p-4">
          <h3 className="mb-3 text-sm font-semibold">Add a lesson plan</h3>
          <LessonPlanForm
            classId={cls.id}
            defaultDates={{ first: week.from, second: toDateInput(second) }}
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="font-semibold">
            Students{" "}
            <span className="text-sm font-normal text-neutral-500">
              ({students.length})
            </span>
          </h2>
        </div>

        {students.length === 0 ? (
          <p className="px-4 py-4 text-sm text-neutral-500">
            No students yet. Add them below so report cards have a roster.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {students.map((s) => (
              <StudentRow key={s.id} student={s} />
            ))}
          </ul>
        )}

        <div className="border-t border-neutral-200 bg-neutral-50 p-4">
          <h3 className="mb-3 text-sm font-semibold">Add a student</h3>
          <StudentForm classId={cls.id} />
        </div>
      </section>
    </div>
  );
}
