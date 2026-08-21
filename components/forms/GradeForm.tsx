"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import { createGradeAction } from "@/lib/actions/schools";

export default function GradeForm() {
  return (
    <ActionForm
      action={createGradeAction}
      submitLabel="Add grade"
      successMessage="Grade added."
      resetOnSuccess
    >
      <Field label="Grade name">
        <input
          name="name"
          required
          placeholder="Grade 5"
          className={`${inputClass} max-w-xs`}
        />
      </Field>
    </ActionForm>
  );
}
