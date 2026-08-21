"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import {
  createLessonPlanAction,
  updateLessonPlanAction,
} from "@/lib/actions/lesson-plans";
import type { LessonPlan } from "@/lib/types";

export default function LessonPlanForm({
  classId,
  initial,
  defaultDates,
}: {
  classId: string;
  initial?: LessonPlan;
  defaultDates?: { first: string; second: string };
}) {
  const editing = Boolean(initial);

  return (
    <ActionForm
      action={editing ? updateLessonPlanAction : createLessonPlanAction}
      submitLabel={editing ? "Save lesson plan" : "Add lesson plan"}
      successMessage={editing ? "Lesson plan updated." : "Lesson plan added."}
      resetOnSuccess={!editing}
    >
      <input type="hidden" name="class_id" value={classId} />
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Title">
          <input
            name="title"
            required
            defaultValue={initial?.title ?? ""}
            placeholder="Passing & Dribbling Drills"
            className={inputClass}
          />
        </Field>
        <Field label="Session 1 date">
          <input
            type="date"
            name="session_date1"
            required
            defaultValue={
              initial?.session_date1.slice(0, 10) ?? defaultDates?.first ?? ""
            }
            className={inputClass}
          />
        </Field>
        <Field label="Session 2 date">
          <input
            type="date"
            name="session_date2"
            required
            defaultValue={
              initial?.session_date2.slice(0, 10) ?? defaultDates?.second ?? ""
            }
            className={inputClass}
          />
        </Field>
      </div>
    </ActionForm>
  );
}
