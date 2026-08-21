import Link from "next/link";
import { notFound } from "next/navigation";
import ObjectivesPanel from "@/components/ObjectivesPanel";
import ReportCardGrid from "@/components/ReportCardGrid";
import { getReportCardRows } from "@/lib/data/queries";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReportCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ entryId: string; gradeId: string }>;
  searchParams: Promise<{ coach?: string }>;
}) {
  const { entryId, gradeId } = await params;
  const { coach: coachIdParam } = await searchParams;

  let result;
  try {
    result = await getReportCardRows(entryId, gradeId);
  } catch (err) {
    return (
      <ErrorState message={err instanceof Error ? err.message : "Unknown error"} />
    );
  }

  if (!result) notFound();
  const { entry, plan, objectives, school, grade, coaches, rows } = result;

  // The coach picked their name on the weekly view; carry that identity
  // through so the save is attributed to them in the audit log.
  const actingCoach = coaches.find((c) => c.id === coachIdParam) ?? null;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Link
          href={`/weekly${coachIdParam ? `?coach=${coachIdParam}` : ""}`}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Weekly view
        </Link>
        {actingCoach ? (
          <p className="text-sm font-semibold text-neutral-500">
            {actingCoach.name}
          </p>
        ) : (
          coaches.length > 0 && (
            <p className="text-sm font-semibold text-neutral-500">
              {coaches.map((c) => c.name).join(", ")}
            </p>
          )
        )}
        <h1 className="text-2xl font-bold tracking-tight">
          {plan?.title ?? "Lesson plan missing"}
        </h1>
        <p className="text-sm text-neutral-600">
          {school?.name ?? "Unknown school"} · {grade?.name ?? "Unknown grade"}
        </p>
      </header>

      <ObjectivesPanel objectives={objectives} />

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
          <p className="font-medium text-neutral-900">
            No students in {grade?.name ?? "this grade"} at{" "}
            {school?.name ?? "this school"}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            An admin adds students on the Students page before report cards can
            be filled.
          </p>
        </div>
      ) : (
        <ReportCardGrid
          syllabusEntryId={entry.id}
          initialRows={rows}
          session1Date={formatDate(entry.session_date1)}
          session2Date={
            entry.session_date2 ? formatDate(entry.session_date2) : null
          }
          coach={
            actingCoach ? { id: actingCoach.id, name: actingCoach.name } : null
          }
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
