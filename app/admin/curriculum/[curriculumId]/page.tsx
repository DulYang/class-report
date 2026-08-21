import Link from "next/link";
import { notFound } from "next/navigation";
import CurriculumPlanRow from "@/components/CurriculumPlanRow";
import DeleteButton from "@/components/DeleteButton";
import CurriculumForm from "@/components/forms/CurriculumForm";
import LessonPlanForm from "@/components/forms/LessonPlanForm";
import { deleteCurriculumAction } from "@/lib/actions/curriculum";
import { getCurriculumDetail, getGradesWithSchool } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function AdminCurriculumDetail({
  params,
}: {
  params: Promise<{ curriculumId: string }>;
}) {
  const { curriculumId } = await params;

  let detail;
  let gradeOptions;
  try {
    [detail, gradeOptions] = await Promise.all([
      getCurriculumDetail(curriculumId),
      getGradesWithSchool(),
    ]);
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load this curriculum</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  if (!detail) notFound();
  const { curriculum, grade, school, plans } = detail;

  const nextSort =
    plans.reduce((max, p) => Math.max(max, p.sort_order), -1) + 1;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <Link
          href="/admin/curriculum"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Curriculum
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{curriculum.name}</h1>
        <p className="text-sm text-neutral-600">
          {school?.name ?? "Unknown school"} · {grade?.name ?? "Unknown grade"} ·{" "}
          {plans.length} lesson plan{plans.length === 1 ? "" : "s"}
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Curriculum details</h2>
        <CurriculumForm gradeOptions={gradeOptions} initial={curriculum} />
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <DeleteButton
            action={deleteCurriculumAction}
            hidden={{ id: curriculum.id }}
            label="Delete this curriculum"
            confirmMessage={`Delete "${curriculum.name}"? Its lesson plans, objectives, scheduled sessions and saved report cards will be deleted.`}
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="font-semibold">Lesson plans</h2>
          <p className="text-xs text-neutral-500">
            Objectives here are what a coach sees as the goal on the report card.
          </p>
        </div>

        {plans.length === 0 ? (
          <p className="px-4 py-4 text-sm text-neutral-500">
            No lesson plans yet — add the first one below.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {plans.map((plan) => (
              <CurriculumPlanRow
                key={plan.id}
                plan={plan}
                curriculumId={curriculum.id}
              />
            ))}
          </ul>
        )}

        <div className="border-t border-neutral-200 bg-neutral-50 p-4">
          <h3 className="mb-3 text-sm font-semibold">Add a lesson plan</h3>
          <LessonPlanForm
            curriculumId={curriculum.id}
            nextSortOrder={nextSort}
          />
        </div>
      </section>

      {school && (
        <p className="text-sm text-neutral-600">
          Schedule these onto dates in{" "}
          <Link
            href={`/admin/syllabus/${school.id}`}
            className="font-medium underline"
          >
            {school.name}&apos;s syllabus
          </Link>
          .
        </p>
      )}
    </div>
  );
}
