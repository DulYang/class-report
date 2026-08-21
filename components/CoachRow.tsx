"use client";

import { useState } from "react";
import DeleteButton from "@/components/DeleteButton";
import CoachForm from "@/components/forms/CoachForm";
import { deleteCoachAction } from "@/lib/actions/coaches";
import type { Coach } from "@/lib/types";

export default function CoachRow({
  coach,
  gradeCount,
  isYou,
}: {
  coach: Coach;
  gradeCount: number;
  isYou: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {coach.name}
            {isYou && (
              <span className="ml-2 rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">
                You
              </span>
            )}
          </p>
          <p className="text-xs text-neutral-500">
            {coach.email || "No email"} · {gradeCount} grade
            {gradeCount === 1 ? "" : "s"} assigned
            {coach.user_id ? " · has a login" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              coach.role === "admin"
                ? "bg-indigo-100 text-indigo-800"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {coach.role === "admin" ? "Admin" : "Coach"}
          </span>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          {!isYou && (
            <DeleteButton
              action={deleteCoachAction}
              hidden={{ id: coach.id }}
              confirmMessage={`Delete ${coach.name}? Their grade assignments go with them, and those sessions become unassigned.`}
            />
          )}
        </div>
      </div>

      {editing && (
        <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <CoachForm initial={coach} />
        </div>
      )}
    </li>
  );
}
