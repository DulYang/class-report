"use client";

import Link from "next/link";
import { useState } from "react";
import DeleteButton from "@/components/DeleteButton";
import LessonPlanForm from "@/components/forms/LessonPlanForm";
import StatusBadge from "@/components/StatusBadge";
import { deleteLessonPlanAction } from "@/lib/actions/lesson-plans";
import { formatDate } from "@/lib/format";
import type { LessonPlanWithStatus } from "@/lib/types";

export default function LessonPlanRow({ plan }: { plan: LessonPlanWithStatus }) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/reports/${plan.id}`}
            className="font-medium hover:underline"
          >
            {plan.title}
          </Link>
          <p className="text-xs text-neutral-500">
            {formatDate(plan.session_date1)} · {formatDate(plan.session_date2)} ·{" "}
            {plan.filled_count}/{plan.student_count} filled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={plan.status} />
          <Link
            href={`/reports/${plan.id}`}
            className="rounded-md bg-neutral-900 px-2.5 py-1 text-sm font-medium text-white"
          >
            Report cards
          </Link>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <DeleteButton
            action={deleteLessonPlanAction}
            hidden={{ id: plan.id, class_id: plan.class_id }}
            confirmMessage={`Delete "${plan.title}"? Its report cards will be deleted too.`}
          />
        </div>
      </div>

      {editing && (
        <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <LessonPlanForm classId={plan.class_id} initial={plan} />
        </div>
      )}
    </li>
  );
}
