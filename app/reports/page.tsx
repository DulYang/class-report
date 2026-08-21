import Link from "next/link";
import { getAllReportCards, getClasses } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const { class: classFilter } = await searchParams;

  let cards;
  let classes;
  try {
    [cards, classes] = await Promise.all([getAllReportCards(), getClasses()]);
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load reports</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  const selected = classes.find((c) => c.id === classFilter);
  const visible = selected
    ? cards.filter((row) => row.class_name === selected.name)
    : cards;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-neutral-600">
          Admin view — every saved report card, read-only. {visible.length} card
          {visible.length === 1 ? "" : "s"}.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/reports"
          className={`rounded-md border px-3 py-1.5 font-medium ${
            selected
              ? "border-neutral-300 bg-white hover:bg-neutral-50"
              : "border-neutral-900 bg-neutral-900 text-white"
          }`}
        >
          All classes
        </Link>
        {classes.map((c) => (
          <Link
            key={c.id}
            href={`/reports?class=${c.id}`}
            className={`rounded-md border px-3 py-1.5 font-medium ${
              selected?.id === c.id
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white hover:bg-neutral-50"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
          No report cards saved yet. Fill one in from the{" "}
          <Link href="/weekly" className="font-medium underline">
            weekly view
          </Link>
          .
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Student</th>
                <th className="px-3 py-2 font-semibold">Class</th>
                <th className="px-3 py-2 font-semibold">Lesson plan</th>
                <th className="px-3 py-2 font-semibold">S1</th>
                <th className="px-3 py-2 font-semibold">S2</th>
                <th className="px-3 py-2 font-semibold">Assessment</th>
                <th className="px-3 py-2 font-semibold">Right behaviour</th>
                <th className="px-3 py-2 font-semibold">Notes</th>
                <th className="px-3 py-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.card.id} className="border-t border-neutral-200">
                  <td className="px-3 py-2 font-medium">{row.student_name}</td>
                  <td className="px-3 py-2 text-neutral-600">
                    {row.class_name}
                    <div className="text-xs text-neutral-400">
                      {row.school} · {row.grade}
                      {row.coach_name ? ` · ${row.coach_name}` : ""}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-neutral-600">{row.plan_title}</td>
                  <td className="px-3 py-2">
                    <Attendance value={row.card.attendance_session1} />
                  </td>
                  <td className="px-3 py-2">
                    <Attendance value={row.card.attendance_session2} />
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
                    {row.card.assessment || "—"}
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
                    {row.card.right_behavior || "—"}
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
                    {row.card.notes || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/reports/${row.card.lesson_plan_id}`}
                      className="text-xs font-medium text-neutral-600 underline hover:text-neutral-900"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Attendance({ value }: { value: string }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
        value === "A"
          ? "bg-red-100 text-red-800"
          : "bg-emerald-100 text-emerald-800"
      }`}
    >
      {value}
    </span>
  );
}
