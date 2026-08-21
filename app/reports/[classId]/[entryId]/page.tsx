import Link from "next/link";
import { notFound } from "next/navigation";
import ObjectivesPanel from "@/components/ObjectivesPanel";
import ReportCardGrid from "@/components/ReportCardGrid";
import { getReportCardRows } from "@/lib/data/queries";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReportCardPage({
  params,
}: {
  params: Promise<{ classId: string; entryId: string }>;
}) {
  const { classId, entryId } = await params;

  let result;
  try {
    result = await getReportCardRows(classId, entryId);
  } catch (err) {
    return (
      <ErrorState message={err instanceof Error ? err.message : "Unknown error"} />
    );
  }

  if (!result) notFound();
  const { entry, plan, objectives, cls, school, grade, rows } = result;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Link
          href="/weekly"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Weekly view
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {plan?.title ?? "Lesson plan missing"}
        </h1>
        <p className="text-sm text-neutral-600">
          {cls && (
            <>
              <Link
                href={`/classes/${cls.id}`}
                className="font-medium text-neutral-900 hover:underline"
              >
                {cls.name}
              </Link>{" "}
              · {school?.name ?? "Unknown school"} ·{" "}
              {grade?.name ?? "Unknown grade"} ·{" "}
            </>
          )}
          Session 1 {formatDate(entry.session_date1)}
          {entry.session_date2
            ? ` · Session 2 ${formatDate(entry.session_date2)}`
            : ""}
        </p>
      </header>

      <ObjectivesPanel objectives={objectives} />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
          <p className="font-medium text-neutral-900">No students in this class yet</p>
          <p className="mt-1 text-sm text-neutral-600">
            Add students before you can fill out report cards.
          </p>
          {cls && (
            <Link
              href={`/classes/${cls.id}`}
              className="mt-4 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Add students to {cls.name}
            </Link>
          )}
        </div>
      ) : (
        <ReportCardGrid
          syllabusEntryId={entry.id}
          initialRows={rows}
          hasSecondSession={Boolean(entry.session_date2)}
        />
      )}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
    >
      <p className="font-semibold">Could not load this report card</p>
      <p className="mt-1 text-sm">{message}</p>
      <Link href="/weekly" className="mt-3 inline-block text-sm underline">
        Back to weekly view
      </Link>
    </div>
  );
}
