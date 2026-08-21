"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import { assignCoachAction } from "@/lib/actions/coach-schools";
import type { Coach } from "@/lib/types";

export default function CoachAssignmentForm({
  schoolId,
  available,
}: {
  schoolId: string;
  available: Coach[];
}) {
  if (available.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        Every coach is already assigned to this school.
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
      <Field label="Coach">
        <select
          name="coach_id"
          required
          defaultValue=""
          className={`${inputClass} max-w-sm`}
        >
          <option value="" disabled>
            Choose a coach…
          </option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.role === "admin" ? " (admin)" : ""}
            </option>
          ))}
        </select>
      </Field>
    </ActionForm>
  );
}
