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

      {/* Mobile: one card per student — a table this wide is unusable on a
          phone, and filling these in on a phone is the coach's whole job. */}
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div
            key={row.student_id}
            className="space-y-3 rounded-lg border border-neutral-200 bg-white p-3"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold text-neutral-900">
                {row.student_name}
              </span>
              {!row.saved && (
                <span className="shrink-0 text-xs text-amber-600">
                  Not filled yet
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FieldBlock label={session1Date}>
                <AttendanceButtons
                  value={row.attendance_session1}
                  label={`${row.student_name} attendance for ${session1Date}`}
                  onChange={(v) =>
                    update(row.student_id, { attendance_session1: v })
                  }
                  full
                />
              </FieldBlock>
              {session2Date && (
                <FieldBlock label={session2Date}>
                  <AttendanceButtons
                    value={row.attendance_session2}
                    label={`${row.student_name} attendance for ${session2Date}`}
                    onChange={(v) =>
                      update(row.student_id, { attendance_session2: v })
                    }
                    full
                  />
                </FieldBlock>
              )}
              <FieldBlock label="Assessment">
                <ScoreButtons
                  value={row.assessment}
                  label={`${row.student_name} assessment`}
                  onChange={(v) => update(row.student_id, { assessment: v })}
                  full
                />
              </FieldBlock>
              <FieldBlock label="Right behaviour">
                <ScoreButtons
                  value={row.right_behavior}
                  label={`${row.student_name} right behaviour`}
                  onChange={(v) => update(row.student_id, { right_behavior: v })}
                  full
                />
              </FieldBlock>
            </div>

            <FieldBlock label="Notes">
              <textarea
                aria-label={`${row.student_name} notes`}
                value={row.notes}
                placeholder="Notes"
                rows={2}
                onChange={(e) => update(row.student_id, { notes: e.target.value })}
                className="w-full resize-y rounded-md border border-neutral-300 px-2 py-2 text-base focus:border-neutral-500 focus:outline-none"
              />
            </FieldBlock>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-neutral-200 md:block">
        <table className="w-full min-w-[960px] border-collapse text-sm">
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
                  <AttendanceButtons
                    value={row.attendance_session1}
                    label={`${row.student_name} attendance for ${session1Date}`}
                    onChange={(v) => update(row.student_id, { attendance_session1: v })}
                  />
                </td>
                {session2Date && (
                  <td className="px-3 py-2 align-top">
                    <AttendanceButtons
                      value={row.attendance_session2}
                      label={`${row.student_name} attendance for ${session2Date}`}
                      onChange={(v) =>
                        update(row.student_id, { attendance_session2: v })
                      }
                    />
                  </td>
                )}
                <td className="px-3 py-2 align-top">
                  <ScoreButtons
                    value={row.assessment}
                    label={`${row.student_name} assessment`}
                    onChange={(v) => update(row.student_id, { assessment: v })}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <ScoreButtons
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

      {/* Sticky on mobile so a coach part-way down a long roster can always
          save without scrolling to the bottom. */}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="min-h-11 flex-1 rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300 sm:flex-none"
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

/** Labelled field wrapper for the mobile card layout. */
function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      {children}
    </label>
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

/**
 * A segmented group of buttons, one tap per choice. These were dropdowns; on a
 * phone that cost three interactions (open, scroll, pick) for what is a
 * two-to-four-way choice a coach makes for every student on the roster.
 */
function Segmented<T extends string | number>({
  options,
  value,
  label,
  onChange,
  toneFor,
  full,
}: {
  options: readonly T[];
  value: T;
  label: string;
  onChange: (v: T) => void;
  /** Classes for the selected button — carries the P/A and 1–4 colour coding. */
  toneFor: (option: T) => string;
  /** Fill the container with touch-sized buttons — the mobile layout. */
  full?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`inline-flex overflow-hidden rounded-md border border-neutral-300 ${
        full ? "w-full" : ""
      }`}
    >
      {options.map((option, i) => {
        const selected = option === value;
        return (
          <button
            key={String(option)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={`min-h-11 px-3 text-sm font-semibold transition-colors md:min-h-0 md:py-1.5 ${
              full ? "flex-1" : ""
            } ${i > 0 ? "border-l border-neutral-300" : ""} ${
              selected
                ? toneFor(option)
                : "bg-white text-neutral-500 hover:bg-neutral-50"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

const ATTENDANCE_OPTIONS: readonly Attendance[] = ["P", "A"];

function AttendanceButtons({
  value,
  label,
  onChange,
  full = false,
}: {
  value: Attendance;
  label: string;
  onChange: (v: Attendance) => void;
  full?: boolean;
}) {
  return (
    <Segmented
      options={ATTENDANCE_OPTIONS}
      value={value}
      label={label}
      onChange={onChange}
      full={full}
      toneFor={(option) =>
        option === "A"
          ? "bg-red-600 text-white"
          : "bg-emerald-600 text-white"
      }
    />
  );
}

/** Shades from 1 (lowest) to 4 (highest) so a filled grid reads at a glance. */
const SCORE_TONE: Record<Score, string> = {
  1: "bg-neutral-500 text-white",
  2: "bg-sky-600 text-white",
  3: "bg-indigo-600 text-white",
  4: "bg-emerald-600 text-white",
};

function ScoreButtons({
  value,
  label,
  onChange,
  full = false,
}: {
  value: Score;
  label: string;
  onChange: (v: Score) => void;
  full?: boolean;
}) {
  return (
    <Segmented
      options={SCORES}
      value={value}
      label={label}
      onChange={(v) => onChange(toScore(v))}
      full={full}
      toneFor={(option) => SCORE_TONE[option]}
    />
  );
}

