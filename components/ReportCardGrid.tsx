"use client";

import { useMemo, useState, useTransition } from "react";
import { saveReportCardGrid } from "@/lib/actions/report-cards";
import {
  SCORES,
  toScore,
  type Attendance,
  type ReportCardRow,
  type Score,
} from "@/lib/types";

type Props = {
  syllabusEntryId: string;
  initialRows: ReportCardRow[];
  session1Date: string;
  /** null when the entry only schedules one session. */
  session2Date: string | null;
  /** The coach who picked their name on the weekly view, for the audit log. */
  coach: { id: string; name: string } | null;
};

export default function ReportCardGrid({
  syllabusEntryId,
  initialRows,
  session1Date,
  session2Date,
  coach,
}: Props) {
  const [rows, setRows] = useState<ReportCardRow[]>(initialRows);
  const [baseline, setBaseline] = useState<ReportCardRow[]>(initialRows);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = useMemo(
    () => JSON.stringify(rows) !== JSON.stringify(baseline),
    [rows, baseline],
  );

  const filledCount = baseline.filter((r) => r.saved).length;

  function update(studentId: string, patch: Partial<ReportCardRow>) {
    setRows((prev) =>
      prev.map((r) => (r.student_id === studentId ? { ...r, ...patch } : r)),
    );
    setSavedAt(null);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await saveReportCardGrid(
        syllabusEntryId,
        rows.map((r) => ({
          student_id: r.student_id,
          attendance_session1: r.attendance_session1,
          attendance_session2: r.attendance_session2,
          assessment: r.assessment,
          right_behavior: r.right_behavior,
          notes: r.notes,
        })),
        coach ? { id: coach.id, name: coach.name } : undefined,
      );

      if (!result.ok) {
        setError(result.error);
        return;
      }

      const saved = rows.map((r) => ({ ...r, saved: true }));
      setRows(saved);
      setBaseline(saved);
      setSavedAt(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      );
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill filled={filledCount} total={rows.length} />
        <span className="text-xs text-neutral-500">
          Assessment and right behaviour are scored 1–4.
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
        >
          Couldn&apos;t save: {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-semibold">Student</th>
              <th className="px-3 py-2 font-semibold">{session1Date}</th>
              {session2Date && (
                <th className="px-3 py-2 font-semibold">{session2Date}</th>
              )}
              <th className="px-3 py-2 font-semibold">Assessment</th>
              <th className="px-3 py-2 font-semibold">Right behaviour</th>
              <th className="px-3 py-2 font-semibold">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.student_id} className="border-t border-neutral-200">
                <td className="px-3 py-2 align-top">
                  <div className="font-medium text-neutral-900">
                    {row.student_name}
                  </div>
                  {!row.saved && (
                    <div className="text-xs text-amber-600">Not filled yet</div>
                  )}
                </td>
                <td className="px-3 py-2 align-top">
                  <AttendanceSelect
                    value={row.attendance_session1}
                    label={`${row.student_name} attendance for ${session1Date}`}
                    onChange={(v) => update(row.student_id, { attendance_session1: v })}
                  />
                </td>
                {session2Date && (
                  <td className="px-3 py-2 align-top">
                    <AttendanceSelect
                      value={row.attendance_session2}
                      label={`${row.student_name} attendance for ${session2Date}`}
                      onChange={(v) =>
                        update(row.student_id, { attendance_session2: v })
                      }
                    />
                  </td>
                )}
                <td className="px-3 py-2 align-top">
                  <ScoreSelect
                    value={row.assessment}
                    label={`${row.student_name} assessment`}
                    onChange={(v) => update(row.student_id, { assessment: v })}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <ScoreSelect
                    value={row.right_behavior}
                    label={`${row.student_name} right behaviour`}
                    onChange={(v) => update(row.student_id, { right_behavior: v })}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <textarea
                    aria-label={`${row.student_name} notes`}
                    value={row.notes}
                    placeholder="Notes"
                    rows={2}
                    onChange={(e) =>
                      update(row.student_id, { notes: e.target.value })
                    }
                    className="w-full min-w-[200px] resize-y rounded-md border border-neutral-300 px-2 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {pending ? "Saving…" : "Save report cards"}
        </button>
        {dirty && !pending && (
          <span className="text-sm text-amber-600">Unsaved changes</span>
        )}
        {!dirty && savedAt && (
          <span className="text-sm text-emerald-700">Saved at {savedAt}</span>
        )}
        {!dirty && !savedAt && (
          <span className="text-sm text-neutral-500">No changes to save</span>
        )}
      </div>
    </div>
  );
}

function StatusPill({ filled, total }: { filled: number; total: number }) {
  const label =
    filled === 0 ? "Empty" : filled >= total ? "Complete" : "Partial";
  const tone =
    filled === 0
      ? "bg-neutral-100 text-neutral-600"
      : filled >= total
        ? "bg-emerald-100 text-emerald-800"
        : "bg-amber-100 text-amber-800";
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {label} — {filled}/{total} filled
    </span>
  );
}

function AttendanceSelect({
  value,
  label,
  onChange,
}: {
  value: Attendance;
  label: string;
  onChange: (v: Attendance) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value === "A" ? "A" : "P")}
      className={`w-20 rounded-md border px-2 py-1.5 font-medium ${
        value === "A"
          ? "border-red-300 bg-red-50 text-red-800"
          : "border-emerald-300 bg-emerald-50 text-emerald-800"
      }`}
    >
      <option value="P">P</option>
      <option value="A">A</option>
    </select>
  );
}

/** Shades from 1 (lowest) to 4 (highest) so a filled grid reads at a glance. */
const SCORE_TONE: Record<Score, string> = {
  1: "border-neutral-300 bg-white text-neutral-700",
  2: "border-sky-300 bg-sky-50 text-sky-800",
  3: "border-indigo-300 bg-indigo-50 text-indigo-800",
  4: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

function ScoreSelect({
  value,
  label,
  onChange,
}: {
  value: Score;
  label: string;
  onChange: (v: Score) => void;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(toScore(e.target.value))}
      className={`w-20 rounded-md border px-2 py-1.5 font-medium ${SCORE_TONE[value]}`}
    >
      {SCORES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
