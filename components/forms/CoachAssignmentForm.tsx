"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import { assignCoachAction } from "@/lib/actions/coach-assignments";
import type { Coach, Grade } from "@/lib/types";

/**
 * A coach is assigned to a grade at a school, and inherits every session
 * scheduled for it — that is what puts the session in their weekly view.
 */
export default function CoachAssignmentForm({
  schoolId,
  coaches,
  grades,
}: {
  schoolId: string;
  coaches: Coach[];
  grades: Grade[];
}) {
  if (grades.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        Add a grade to this school first — a coach is assigned to a grade, not
        the whole school.
      </p>
    );
  }

  if (coaches.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        No coaches exist yet — add one on the Coaches page.
      </p>
    );
  }

  return (
    <ActionForm
      action={assignCoachAction}
      submitLabel="Assign coach"
      successMessage="Coach assigned."
      resetOnSuccess
    >
      <input type="hidden" name="school_id" value={schoolId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Coach">
          <select name="coach_id" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose a coach…
            </option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.role === "admin" ? " (admin)" : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Grade">
          <select name="grade_id" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose a grade…
            </option>
            {grades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </ActionForm>
  );
}
