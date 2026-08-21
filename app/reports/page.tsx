import Link from "next/link";
import { getAllReportCards, getSchools } from "@/lib/data/queries";
import { formatDate, semesterRange } from "@/lib/format";
import type { Score } from "@/lib/types";

export const dynamic = "force-dynamic";

const SORTS = [
  { value: "date_desc", label: "Date (newest first)" },
  { value: "date_asc", label: "Date (oldest first)" },
  { value: "student", label: "Student name" },
  { value: "school", label: "School / grade" },
  { value: "plan", label: "Lesson plan" },
] as const;
type Sort = (typeof SORTS)[number]["value"];

function isSort(value: string | undefined): value is Sort {
  return SORTS.some((s) => s.value === value);
}

type Row = Awaited<ReturnType<typeof getAllReportCards>>[number];

function compareRows(a: Row, b: Row, sort: Sort): number {
  switch (sort) {
    case "date_asc":
      return (a.session_date ?? "").localeCompare(b.session_date ?? "");
    case "student":
      return a.student_name.localeCompare(b.student_name);
    case "school":
      return (
        a.school.localeCompare(b.school) ||
        a.grade.localeCompare(b.grade) ||
        a.student_name.localeCompare(b.student_name)
      );
    case "plan":
      return a.plan_title.localeCompare(b.plan_title);
    case "date_desc":
    default:
      return (b.session_date ?? "").localeCompare(a.session_date ?? "");
  }
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    school?: string;
    from?: string;
    to?: string;
    sort?: string;
  }>;
}) {
  const {
    school: schoolFilter,
    from: fromParam,
    to: toParam,
    sort: sortParam,
  } = await searchParams;

  const defaultRange = semesterRange(new Date());
  const from = fromParam || defaultRange.from;
  const to = toParam || defaultRange.to;
  const sort: Sort = isSort(sortParam) ? sortParam : "date_desc";

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

  const visible = cards
    .filter((row) => !selected || row.school_id === selected.id)
    .filter((row) => {
      if (!row.session_date) return true;
      return row.session_date >= from && row.session_date <= to;
    })
    .sort((a, b) => compareRows(a, b, sort));

  // Every school-filter link keeps the current date range and sort.
  function schoolHref(schoolId?: string) {
    const params = new URLSearchParams();
    if (schoolId) params.set("school", schoolId);
    if (fromParam) params.set("from", fromParam);
    if (toParam) params.set("to", toParam);
    if (sortParam) params.set("sort", sortParam);
    const qs = params.toString();
    return qs ? `/reports?${qs}` : "/reports";
  }

  const isDefaultRange = !fromParam && !toParam;

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
          href={schoolHref()}
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
            href={schoolHref(s.id)}
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

      <form
        method="get"
        className="flex flex-wrap items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4 text-sm"
      >
        {schoolFilter && <input type="hidden" name="school" value={schoolFilter} />}

        <label className="space-y-1">
          <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            From
          </span>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-md border border-neutral-300 px-2 py-1.5"
          />
        </label>

        <label className="space-y-1">
          <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            To
          </span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-md border border-neutral-300 px-2 py-1.5"
          />
        </label>

        <label className="space-y-1">
          <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Sort by
          </span>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-md border border-neutral-300 px-2 py-1.5"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-3 py-1.5 font-medium text-white"
        >
          Apply
        </button>

        {!isDefaultRange && (
          <Link
            href={schoolHref(schoolFilter)}
            className="text-neutral-500 underline hover:text-neutral-900"
          >
            Reset to this semester
          </Link>
        )}
      </form>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
          No report cards in this range. Fill one in from the{" "}
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
                <th className="px-3 py-2 font-semibold">Date</th>
                <th className="px-3 py-2 font-semibold">Student</th>
                <th className="px-3 py-2 font-semibold">School / grade</th>
                <th className="px-3 py-2 font-semibold">Lesson plan</th>
                <th className="px-3 py-2 font-semibold">S1</th>
                <th className="px-3 py-2 font-semibold">S2</th>
                <th className="px-3 py-2 font-semibold">Assessment</th>
                <th className="px-3 py-2 font-semibold">Right behaviour</th>
                <th className="px-3 py-2 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.card.id} className="border-t border-neutral-200">
                  <td className="px-3 py-2 whitespace-nowrap text-neutral-600">
                    {row.session_date ? formatDate(row.session_date) : "—"}
                  </td>
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
