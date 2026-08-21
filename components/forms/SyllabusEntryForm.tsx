"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import {
  createSyllabusEntryAction,
  updateSyllabusEntryAction,
} from "@/lib/actions/syllabus";
import type { LessonPlanOption } from "@/lib/data/queries";
import type { SyllabusEntry } from "@/lib/types";

export default function SyllabusEntryForm({
  schoolId,
  options,
  initial,
  defaultDates,
}: {
  schoolId: string;
  options: LessonPlanOption[];
  initial?: SyllabusEntry;
  defaultDates?: { first: string; second: string };
}) {
  const editing = Boolean(initial);

  return (
    <ActionForm
      action={editing ? updateSyllabusEntryAction : createSyllabusEntryAction}
      submitLabel={editing ? "Save entry" : "Schedule lesson plan"}
      successMessage={editing ? "Syllabus entry updated." : "Scheduled."}
      resetOnSuccess={!editing}
    >
      <input type="hidden" name="school_id" value={schoolId} />
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Field label="Lesson plan">
            <select
              name="lesson_plan_id"
              required
              defaultValue={initial?.lesson_plan_id ?? ""}
              className={inputClass}
            >
              <option value="" disabled>
                Choose a lesson plan…
              </option>
              {options.map(({ plan, curriculum, grade }) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title} — {curriculum.name}
                  {grade ? ` (${grade.name})` : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>
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
        <Field label="Session 2 date (optional)">
          <input
            type="date"
            name="session_date2"
            defaultValue={
              initial?.session_date2?.slice(0, 10) ?? defaultDates?.second ?? ""
            }
            className={inputClass}
          />
        </Field>
      </div>
    </ActionForm>
  );
}
