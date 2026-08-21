import Link from "next/link";
import LessonPlanForm from "@/components/forms/LessonPlanForm";
import { getLessonPlansWithGrades } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function AdminCurriculumPage() {
  let plans;
  try {
    plans = await getLessonPlansWithGrades();
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load lesson plans</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Admin
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Curriculum</h1>
        <p className="text-sm text-neutral-600">
          A curriculum is a lesson plan paired with a grade, with objectives for
          that grade. The same lesson plan can pair with several grades, each
          with different objectives.
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">New lesson plan</h2>
        <LessonPlanForm />
      </section>

      {plans.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
          No lesson plans yet — create the first one above.
        </p>
      ) : (
        <div className="space-y-3">
          {plans.map(({ plan, grades }) => (
            <div
              key={plan.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3"
            >
              <div>
                <Link
                  href={`/admin/curriculum/${plan.id}`}
                  className="font-semibold hover:underline"
                >
                  {plan.title}
                </Link>
                <p className="text-xs text-neutral-500">
                  {grades.length === 0
                    ? "Not paired with any grade yet"
                    : grades
                        .map((g) => g.grade?.name ?? "Unknown grade")
                        .join(", ")}
                </p>
              </div>
              <Link
                href={`/admin/curriculum/${plan.id}`}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
              >
                Manage
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
