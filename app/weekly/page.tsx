import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { getClassesWithPlans } from "@/lib/data/queries";
import { addWeeks, formatDate, formatRange, weekRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WeeklyPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const { week } = await searchParams;
  const today = new Date();
  const current = weekRange(today);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(week ?? "") ? week! : current.from;
  const range = weekRange(new Date(`${from}T00:00:00`));

  let classes;
  try {
    classes = await getClassesWithPlans(range);
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load the weekly view</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  const planCount = classes.reduce((n, c) => n + c.lesson_plans.length, 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Weekly View</h1>
          <p className="text-sm text-neutral-600">
            {formatRange(range.from, range.to)} · {planCount} lesson plan
            {planCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/weekly?week=${addWeeks(range.from, -1)}`}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 font-medium hover:bg-neutral-50"
          >
            ← Previous
          </Link>
          <Link
            href="/weekly"
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 font-medium hover:bg-neutral-50"
          >
            This week
          </Link>
          <Link
            href={`/weekly?week=${addWeeks(range.from, 1)}`}
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 font-medium hover:bg-neutral-50"
          >
            Next →
          </Link>
        </div>
      </header>

      {classes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="font-medium">No classes yet</p>
          <p className="mt-1 text-sm text-neutral-600">
            Create your first class to start recording report cards.
          </p>
          <Link
            href="/classes"
            className="mt-4 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Go to Classes
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => (
            <section
              key={cls.id}
              className="rounded-lg border border-neutral-200 bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
                <div>
                  <Link
                    href={`/classes/${cls.id}`}
                    className="font-semibold hover:underline"
                  >
                    {cls.name}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    {cls.school} · {cls.grade} · {cls.student_count} student
                    {cls.student_count === 1 ? "" : "s"}
                    {cls.coach ? ` · ${cls.coach.name}` : ""}
                  </p>
                </div>
                <Link
                  href={`/classes/${cls.id}`}
                  className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Manage
                </Link>
              </div>

              {cls.lesson_plans.length === 0 ? (
                <p className="px-4 py-4 text-sm text-neutral-500">
                  No lesson plans this week.{" "}
                  <Link
                    href={`/classes/${cls.id}`}
                    className="font-medium text-neutral-900 underline"
                  >
                    Add one
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {cls.lesson_plans.map((plan) => (
                    <li key={plan.id}>
                      <Link
                        href={`/reports/${plan.id}`}
                        className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50"
                      >
                        <div>
                          <div className="font-medium">{plan.title}</div>
                          <div className="text-xs text-neutral-500">
                            {formatDate(plan.session_date1)} ·{" "}
                            {formatDate(plan.session_date2)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-neutral-500">
                            {plan.filled_count}/{plan.student_count} filled
                          </span>
                          <StatusBadge status={plan.status} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
