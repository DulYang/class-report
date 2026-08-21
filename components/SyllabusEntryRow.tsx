"use client";

import { useState } from "react";
import DeleteButton from "@/components/DeleteButton";
import SyllabusEntryForm from "@/components/forms/SyllabusEntryForm";
import { deleteSyllabusEntryAction } from "@/lib/actions/syllabus";
import { formatDate } from "@/lib/format";
import type { LessonPlan, SyllabusEntry } from "@/lib/types";

export default function SyllabusEntryRow({
  entry,
  plan,
  lessonPlans,
}: {
  entry: SyllabusEntry;
  plan: LessonPlan | null;
  lessonPlans: LessonPlan[];
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{plan?.title ?? "Lesson plan missing"}</p>
          <p className="text-xs text-neutral-500">
            {formatDate(entry.session_date1)}
            {entry.session_date2
              ? ` · ${formatDate(entry.session_date2)}`
              : " · one session"}{" "}
            · every grade at this school
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="min-h-11 rounded-md border border-neutral-300 px-2.5 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50 sm:min-h-0"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <DeleteButton
            action={deleteSyllabusEntryAction}
            hidden={{ id: entry.id, school_id: entry.school_id }}
            confirmMessage={`Unschedule "${plan?.title ?? "this lesson plan"}"? Every report card filled for this session, across every grade, will be deleted.`}
          />
        </div>
      </div>

      {editing && (
        <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <SyllabusEntryForm
            schoolId={entry.school_id}
            lessonPlans={lessonPlans}
            initial={entry}
          />
        </div>
      )}
    </li>
  );
}
