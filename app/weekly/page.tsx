import Link from "next/link";
import CoachPicker from "@/components/CoachPicker";
import StatusBadge from "@/components/StatusBadge";
import { getWeeklySchedule } from "@/lib/data/queries";
import { addWeeks, formatDate, formatRange, weekRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function WeeklyPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; coach?: string }>;
}) {
  const { week, coach: coachId } = await searchParams;
  const today = new Date();
  const current = weekRange(today);
  const from = /^\d{4}-\d{2}-\d{2}$/.test(week ?? "") ? week! : current.from;
  const range = weekRange(new Date(`${from}T00:00:00`));

  let schedule;
  try {
    schedule = await getWeeklySchedule(range);
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

  // Only coaches who actually have a grade assigned appear in the picker.
  const coaches = schedule.flatMap((c) => (c.coach ? [c.coach] : []));
  const selected = schedule.find((c) => c.coach?.id === coachId);

  const weekNav = (
    <div className="flex items-center gap-2 text-sm">
      <Link
        href={`/weekly?week=${addWeeks(range.from, -1)}${coachId ? `&coach=${coachId}` : ""}`}
        className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 font-medium hover:bg-neutral-50"
      >
        ← Previous
      </Link>
      <Link
        href={`/weekly${coachId ? `?coach=${coachId}` : ""}`}
        className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 font-medium hover:bg-neutral-50"
      >
        This week
      </Link>
      <Link
        href={`/weekly?week=${addWeeks(range.from, 1)}${coachId ? `&coach=${coachId}` : ""}`}
        className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 font-medium hover:bg-neutral-50"
      >
        Next →
      </Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Weekly View</h1>
          <p className="text-sm text-neutral-600">
            {formatRange(range.from, range.to)}
          </p>
        </div>
        {weekNav}
      </header>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <CoachPicker coaches={coaches} selectedId={coachId ?? ""} />
      </div>

      {!coachId ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="font-medium">Pick your name to see your sessions</p>
          <p className="mt-1 text-sm text-neutral-600">
            Not listed? An admin assigns coaches to a school and grade on the
            Schools &amp; Grades page.
          </p>
        </div>
      ) : !selected ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="font-medium">That coach has no grade assignments</p>
          <p className="mt-1 text-sm text-neutral-600">
            An admin needs to assign a school and grade before sessions show up
            here.
          </p>
        </div>
      ) : selected.sessions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="font-medium">Nothing scheduled this week</p>
          <p className="mt-1 text-sm text-neutral-600">
            {selected.coach!.name} teaches{" "}
            {selected.grades
              .map(
                (g) =>
                  `${g.school?.name ?? "Unknown school"} · ${g.grade?.name ?? "Unknown grade"}`,
              )
              .join(", ")}
            . Sessions come from each school&apos;s syllabus.
          </p>
        </div>
      ) : (
        <section className="space-y-3">
          <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            {selected.coach!.name}&apos;s classes this week — pick one
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {selected.sessions.map((session) => (
              <Link
                key={`${session.entry.id}:${session.grade?.id}`}
                href={`/reports/${session.entry.id}/${session.grade?.id ?? ""}?coach=${coachId}`}
                className="flex flex-col gap-2 rounded-lg border-2 border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold">{session.lesson_plan.title}</span>
                  <StatusBadge status={session.status} />
                </div>
                <p className="text-sm text-neutral-600">
                  {session.school?.name ?? "Unknown school"} ·{" "}
                  {session.grade?.name ?? "Unknown grade"}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatDate(session.entry.session_date1)}
                  {session.entry.session_date2
                    ? ` · ${formatDate(session.entry.session_date2)}`
                    : ""}{" "}
                  · {session.filled_count}/{session.student_count} filled
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
