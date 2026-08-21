"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import {
  createLessonPlanAction,
  updateLessonPlanAction,
} from "@/lib/actions/curriculum";
import type { LessonPlan } from "@/lib/types";

export default function LessonPlanForm({
  curriculumId,
  initial,
  nextSortOrder = 0,
}: {
  curriculumId: string;
  initial?: LessonPlan;
  nextSortOrder?: number;
}) {
  const editing = Boolean(initial);

  return (
    <ActionForm
      action={editing ? updateLessonPlanAction : createLessonPlanAction}
      submitLabel={editing ? "Save lesson plan" : "Add lesson plan"}
      successMessage={editing ? "Lesson plan updated." : "Lesson plan added."}
      resetOnSuccess={!editing}
    >
      <input type="hidden" name="curriculum_id" value={curriculumId} />
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-3">
          <Field label="Title">
            <input
              name="title"
              required
              defaultValue={initial?.title ?? ""}
              placeholder="Passing & Dribbling Drills"
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Order">
          <input
            type="number"
            name="sort_order"
            min={0}
            defaultValue={initial?.sort_order ?? nextSortOrder}
            className={inputClass}
          />
        </Field>
      </div>
    </ActionForm>
  );
}
