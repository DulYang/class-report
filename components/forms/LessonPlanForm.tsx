"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import {
  createLessonPlanAction,
  updateLessonPlanAction,
} from "@/lib/actions/curriculum";
import type { LessonPlan } from "@/lib/types";

/** A lesson plan is just a title — a reusable catalog entry, grade-agnostic. */
export default function LessonPlanForm({ initial }: { initial?: LessonPlan }) {
  const editing = Boolean(initial);

  return (
    <ActionForm
      action={editing ? updateLessonPlanAction : createLessonPlanAction}
      submitLabel={editing ? "Save title" : "Create lesson plan"}
      successMessage={editing ? "Lesson plan updated." : "Lesson plan created."}
      resetOnSuccess={!editing}
    >
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <Field label="Title">
        <input
          name="title"
          required
          defaultValue={initial?.title ?? ""}
          placeholder="Passing & Dribbling Drills"
          className={inputClass}
        />
      </Field>
    </ActionForm>
  );
}
