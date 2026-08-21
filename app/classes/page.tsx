import Link from "next/link";
import ClassForm from "@/components/forms/ClassForm";
import StatusBadge from "@/components/StatusBadge";
import { getClassesWithPlans, getCoaches } from "@/lib/data/queries";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  let classes;
  let coaches;
  try {
    [classes, coaches] = await Promise.all([getClassesWithPlans(), getCoaches()]);
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
          {classes.length} class{classes.length === 1 ? "" : "es"} · lesson plans
          and rosters live inside each one.
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">New class</h2>
        <ClassForm coaches={coaches} />
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
                    {cls.school} · {cls.grade} · {cls.student_count} student
                    {cls.student_count === 1 ? "" : "s"} ·{" "}
                    {cls.lesson_plans.length} lesson plan
                    {cls.lesson_plans.length === 1 ? "" : "s"}
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

              {cls.lesson_plans.length > 0 && (
                <ul className="divide-y divide-neutral-100 border-t border-neutral-200">
                  {cls.lesson_plans.map((plan) => (
                    <li key={plan.id}>
                      <Link
                        href={`/reports/${plan.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-neutral-50"
                      >
                        <span>
                          <span className="font-medium">{plan.title}</span>{" "}
                          <span className="text-xs text-neutral-500">
                            {formatDate(plan.session_date1)} ·{" "}
                            {formatDate(plan.session_date2)}
                          </span>
                        </span>
                        <StatusBadge status={plan.status} />
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
