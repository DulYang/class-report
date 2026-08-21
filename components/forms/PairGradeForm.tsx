"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import { pairGradeAction } from "@/lib/actions/curriculum";
import type { Grade, School } from "@/lib/types";

/** Pairs this lesson plan with a grade so it can carry grade-specific objectives. */
export default function PairGradeForm({
  lessonPlanId,
  gradeOptions,
}: {
  lessonPlanId: string;
  gradeOptions: { grade: Grade; school: School | null }[];
}) {
  if (gradeOptions.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        No grades exist yet — add a school and a grade first.
      </p>
    );
  }

  return (
    <ActionForm
      action={pairGradeAction}
      submitLabel="Pair with grade"
      successMessage="Paired."
      resetOnSuccess
    >
      <input type="hidden" name="lesson_plan_id" value={lessonPlanId} />
      <Field label="Grade">
        <select
          name="grade_id"
          required
          defaultValue=""
          className={`${inputClass} max-w-sm`}
        >
          <option value="" disabled>
            Choose a grade…
          </option>
          {gradeOptions.map(({ grade, school }) => (
            <option key={grade.id} value={grade.id}>
              {school ? `${school.name} — ` : ""}
              {grade.name}
            </option>
          ))}
        </select>
      </Field>
    </ActionForm>
  );
}
