import Link from "next/link";
import { getAllReportCards, getSchools } from "@/lib/data/queries";
import type { Score } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ school?: string }>;
}) {
  const { school: schoolFilter } = await searchParams;

  let cards;
  let schools;
  try {
    [cards, schools] = await Promise.all([getAllReportCards(), getSchools()]);
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

  const selected = schools.find((s) => s.id === schoolFilter);
  const visible = selected
    ? cards.filter((row) => row.school_id === selected.id)
    : cards;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-neutral-600">
          Every saved report card, read-only. {visible.length} card
          {visible.length === 1 ? "" : "s"}. Assessment and right behaviour are
          scored 1–4.
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
          All schools
        </Link>
        {schools.map((s) => (
          <Link
            key={s.id}
            href={`/reports?school=${s.id}`}
            className={`rounded-md border px-3 py-1.5 font-medium ${
              selected?.id === s.id
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white hover:bg-neutral-50"
            }`}
          >
            {s.name}
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
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Student</th>
                <th className="px-3 py-2 font-semibold">School / grade</th>
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
                    {row.school}
                    <div className="text-xs text-neutral-400">{row.grade}</div>
                  </td>
                  <td className="px-3 py-2 text-neutral-600">{row.plan_title}</td>
                  <td className="px-3 py-2">
                    <Attendance value={row.card.attendance_session1} />
                  </td>
                  <td className="px-3 py-2">
                    <Attendance value={row.card.attendance_session2} />
                  </td>
                  <td className="px-3 py-2">
                    <ScorePill value={row.card.assessment} />
                  </td>
                  <td className="px-3 py-2">
                    <ScorePill value={row.card.right_behavior} />
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
                    {row.card.notes || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/reports/${row.entry_id}`}
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

const SCORE_TONE: Record<Score, string> = {
  1: "bg-neutral-100 text-neutral-700",
  2: "bg-sky-100 text-sky-800",
  3: "bg-indigo-100 text-indigo-800",
  4: "bg-emerald-100 text-emerald-800",
};

function ScorePill({ value }: { value: Score }) {
  return (
    <span
      className={`inline-block w-6 rounded text-center text-xs font-semibold ${SCORE_TONE[value] ?? SCORE_TONE[1]}`}
    >
      {value}
    </span>
  );
}
