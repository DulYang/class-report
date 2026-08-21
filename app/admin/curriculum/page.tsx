import Link from "next/link";
import CurriculumForm from "@/components/forms/CurriculumForm";
import {
  getCurricula,
  getGradesWithSchool,
  getLessonPlans,
} from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function AdminCurriculumPage() {
  let curricula;
  let gradeOptions;
  let plans;
  try {
    [curricula, gradeOptions, plans] = await Promise.all([
      getCurricula(),
      getGradesWithSchool(),
      getLessonPlans(),
    ]);
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load curricula</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  const gradeById = new Map(gradeOptions.map((g) => [g.grade.id, g]));
  const planCount = new Map<string, number>();
  for (const p of plans) {
    planCount.set(p.curriculum_id, (planCount.get(p.curriculum_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Admin
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Curriculum</h1>
        <p className="text-sm text-neutral-600">
          A curriculum targets one grade and holds the lesson plans for it, each
          with its own assessment objectives.
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">New curriculum</h2>
        {gradeOptions.length === 0 ? (
          <p className="text-sm text-neutral-600">
            Add a school and at least one grade first —{" "}
            <Link href="/admin/schools" className="font-medium underline">
              Schools & Grades
            </Link>
            .
          </p>
        ) : (
          <CurriculumForm gradeOptions={gradeOptions} />
        )}
      </section>

      {curricula.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
          No curricula yet.
        </p>
      ) : (
        <div className="space-y-3">
          {curricula.map((curriculum) => {
            const target = gradeById.get(curriculum.grade_id);
            return (
              <div
                key={curriculum.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3"
              >
                <div>
                  <Link
                    href={`/admin/curriculum/${curriculum.id}`}
                    className="font-semibold hover:underline"
                  >
                    {curriculum.name}
                  </Link>
                  <p className="text-xs text-neutral-500">
                    {target
                      ? `${target.school?.name ?? "Unknown school"} · ${target.grade.name}`
                      : "Grade missing"}{" "}
                    · {planCount.get(curriculum.id) ?? 0} lesson plan
                    {(planCount.get(curriculum.id) ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
                <Link
                  href={`/admin/curriculum/${curriculum.id}`}
                  className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:bg-neutral-50"
                >
                  Manage
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
