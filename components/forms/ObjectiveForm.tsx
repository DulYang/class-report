"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import {
  createObjectiveAction,
  updateObjectiveAction,
} from "@/lib/actions/curriculum";
import type { AssessmentObjective } from "@/lib/types";

/**
 * Assessment objectives are admin-only content. Coaches see them read-only on
 * the report card so they know the goal for the class.
 */
export default function ObjectiveForm({
  lessonPlanId,
  curriculumId,
  initial,
  nextSortOrder = 0,
}: {
  lessonPlanId: string;
  curriculumId: string;
  initial?: AssessmentObjective;
  nextSortOrder?: number;
}) {
  const editing = Boolean(initial);

  return (
    <ActionForm
      action={editing ? updateObjectiveAction : createObjectiveAction}
      submitLabel={editing ? "Save objective" : "Add objective"}
      successMessage={editing ? "Objective updated." : "Objective added."}
      resetOnSuccess={!editing}
    >
      <input type="hidden" name="lesson_plan_id" value={lessonPlanId} />
      <input type="hidden" name="curriculum_id" value={curriculumId} />
      {initial && <input type="hidden" name="id" value={initial.id} />}
      {!editing && (
        <input type="hidden" name="sort_order" value={nextSortOrder} />
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Objective">
          <input
            name="title"
            required
            defaultValue={initial?.title ?? ""}
            placeholder="Complete 10 chest passes without a drop"
            className={inputClass}
          />
        </Field>
        <Field label="Detail (optional)">
          <input
            name="description"
            defaultValue={initial?.description ?? ""}
            placeholder="How the coach should judge it"
            className={inputClass}
          />
        </Field>
      </div>
    </ActionForm>
  );
}
