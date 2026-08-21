import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { getWeeklySchedule } from "@/lib/data/queries";
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

  // A grade can have more than one coach, so the same session appears under
  // each of them — count distinct sessions, not rows.
  const sessionCount = new Set(
    schedule.flatMap((c) => c.sessions.map((s) => s.entry.id)),
  ).size;
  const withSessions = schedule.filter((c) => c.sessions.length > 0);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Weekly View</h1>
          <p className="text-sm text-neutral-600">
            {formatRange(range.from, range.to)} · {sessionCount} session
            {sessionCount === 1 ? "" : "s"}
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

      {sessionCount === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center">
          <p className="font-medium">Nothing scheduled this week</p>
          <p className="mt-1 text-sm text-neutral-600">
            Sessions come from each school&apos;s syllabus, which admins manage.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {withSessions.map((entry) => (
            <section
              key={entry.coach?.id ?? "unassigned"}
              className="rounded-lg border border-neutral-200 bg-white"
            >
              <div className="border-b border-neutral-200 px-4 py-3">
                <h2 className="font-semibold">
                  {entry.coach?.name ?? "No coach assigned"}
                </h2>
                <p className="text-xs text-neutral-500">
                  {entry.coach
                    ? entry.grades
                        .map(
                          (g) =>
                            `${g.school?.name ?? "Unknown school"} · ${g.grade?.name ?? "Unknown grade"}`,
                        )
                        .join(" — ")
                    : "No coach is assigned to these school/grade pairs yet"}
                </p>
              </div>

              <ul className="divide-y divide-neutral-100">
                {entry.sessions.map((session) => (
                  <li key={session.entry.id}>
                    <Link
                      href={`/reports/${session.entry.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50"
                    >
                      <div>
                        <div className="font-medium">
                          {session.lesson_plan.title}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {session.school?.name ?? "Unknown school"} ·{" "}
                          {session.grade?.name ?? "Unknown grade"} ·{" "}
                          {formatDate(session.entry.session_date1)}
                          {session.entry.session_date2
                            ? ` · ${formatDate(session.entry.session_date2)}`
                            : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-neutral-500">
                          {session.filled_count}/{session.student_count} filled
                        </span>
                        <StatusBadge status={session.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
