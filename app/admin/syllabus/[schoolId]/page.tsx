import Link from "next/link";
import { notFound } from "next/navigation";
import SyllabusEntryForm from "@/components/forms/SyllabusEntryForm";
import SyllabusEntryRow from "@/components/SyllabusEntryRow";
import {
  getLessonPlanOptions,
  getSchool,
  getSyllabus,
} from "@/lib/data/queries";
import { toDateInput, weekRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminSchoolSyllabus({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;

  let school;
  let entries;
  let options;
  try {
    [school, entries, options] = await Promise.all([
      getSchool(schoolId),
      getSyllabus(schoolId),
      getLessonPlanOptions(),
    ]);
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load this syllabus</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  if (!school) notFound();

  // Only plans whose curriculum targets a grade at THIS school can be taught here.
  const relevant = options.filter((o) => o.school?.id === school.id);

  const today = new Date();
  const week = weekRange(today);
  const second = new Date(today);
  second.setDate(second.getDate() + 2);

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <Link
          href="/admin/syllabus"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Syllabus
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{school.name}</h1>
        <p className="text-sm text-neutral-600">
          {entries.length} scheduled session{entries.length === 1 ? "" : "s"}
          {school.pic_name ? ` · PIC ${school.pic_name}` : ""}
          {school.pic_phone ? ` · ${school.pic_phone}` : ""}
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="font-semibold">Scheduled lesson plans</h2>
        </div>

        {entries.length === 0 ? (
          <p className="px-4 py-4 text-sm text-neutral-500">
            Nothing scheduled yet. Coaches at this school will see an empty
            weekly view until something is added.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {entries.map(({ entry, plan, grade }) => (
              <SyllabusEntryRow
                key={entry.id}
                entry={entry}
                plan={plan}
                grade={grade}
                options={relevant}
              />
            ))}
          </ul>
        )}

        <div className="border-t border-neutral-200 bg-neutral-50 p-4">
          <h3 className="mb-3 text-sm font-semibold">Schedule a lesson plan</h3>
          {relevant.length === 0 ? (
            <p className="text-sm text-neutral-600">
              No lesson plans exist for this school&apos;s grades yet. Build a{" "}
              <Link href="/admin/curriculum" className="font-medium underline">
                curriculum
              </Link>{" "}
              for one of them first.
            </p>
          ) : (
            <SyllabusEntryForm
              schoolId={school.id}
              options={relevant}
              defaultDates={{ first: week.from, second: toDateInput(second) }}
            />
          )}
        </div>
      </section>
    </div>
  );
}
