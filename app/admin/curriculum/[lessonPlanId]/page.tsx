import Link from "next/link";
import { notFound } from "next/navigation";
import CurriculumGradeRow from "@/components/CurriculumGradeRow";
import DeleteButton from "@/components/DeleteButton";
import LessonPlanForm from "@/components/forms/LessonPlanForm";
import PairGradeForm from "@/components/forms/PairGradeForm";
import { deleteLessonPlanAction } from "@/lib/actions/curriculum";
import { getGrades, getLessonPlanDetail } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function AdminLessonPlanDetail({
  params,
}: {
  params: Promise<{ lessonPlanId: string }>;
}) {
  const { lessonPlanId } = await params;

  let detail;
  let gradeOptions;
  try {
    [detail, gradeOptions] = await Promise.all([
      getLessonPlanDetail(lessonPlanId),
      getGrades(),
    ]);
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load this lesson plan</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  if (!detail) notFound();
  const { plan, pairings } = detail;

  const pairedGradeIds = new Set(pairings.map((p) => p.grade?.id));
  const availableGrades = gradeOptions.filter((g) => !pairedGradeIds.has(g.id));

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <Link
          href="/admin/curriculum"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Curriculum
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{plan.title}</h1>
        <p className="text-sm text-neutral-600">
          Paired with {pairings.length} grade{pairings.length === 1 ? "" : "s"}
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Lesson plan title</h2>
        <LessonPlanForm initial={plan} />
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <DeleteButton
            action={deleteLessonPlanAction}
            hidden={{ id: plan.id }}
            label="Delete this lesson plan"
            confirmMessage={`Delete "${plan.title}"? Every grade pairing, its objectives, and any scheduled use — including saved report cards — will be deleted.`}
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="font-semibold">Grades &amp; objectives</h2>
          <p className="text-xs text-neutral-500">
            Objectives here are what a coach sees as the goal on the report
            card for that grade.
          </p>
        </div>

        {pairings.length === 0 ? (
          <p className="px-4 py-4 text-sm text-neutral-500">
            Not paired with any grade yet — pair it below.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {pairings.map(({ curriculum, grade, objectives }) => (
              <CurriculumGradeRow
                key={curriculum.id}
                lessonPlanId={plan.id}
                curriculum={curriculum}
                grade={grade}
                objectives={objectives}
              />
            ))}
          </ul>
        )}

        <div className="border-t border-neutral-200 bg-neutral-50 p-4">
          <h3 className="mb-3 text-sm font-semibold">Pair with another grade</h3>
          <PairGradeForm lessonPlanId={plan.id} gradeOptions={availableGrades} />
        </div>
      </section>

      <p className="text-sm text-neutral-600">
        Schedule this lesson plan on a school&apos;s{" "}
        <Link href="/admin/syllabus" className="font-medium underline">
          syllabus
        </Link>{" "}
        to put it in front of coaches — every grade at that school studies it
        on the scheduled dates.
      </p>
    </div>
  );
}
