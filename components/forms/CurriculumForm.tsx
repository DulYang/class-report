"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import {
  createCurriculumAction,
  updateCurriculumAction,
} from "@/lib/actions/curriculum";
import type { Curriculum, Grade, School } from "@/lib/types";

export default function CurriculumForm({
  gradeOptions,
  initial,
}: {
  gradeOptions: { grade: Grade; school: School | null }[];
  initial?: Curriculum;
}) {
  const editing = Boolean(initial);

  return (
    <ActionForm
      action={editing ? updateCurriculumAction : createCurriculumAction}
      submitLabel={editing ? "Save curriculum" : "Create curriculum"}
      successMessage={editing ? "Curriculum updated." : "Curriculum created."}
      resetOnSuccess={!editing}
    >
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Curriculum name">
          <input
            name="name"
            required
            defaultValue={initial?.name ?? ""}
            placeholder="Grade 5 Basketball"
            className={inputClass}
          />
        </Field>
        <Field label="Grade">
          <select
            name="grade_id"
            required
            defaultValue={initial?.grade_id ?? ""}
            className={inputClass}
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
      </div>
    </ActionForm>
  );
}
