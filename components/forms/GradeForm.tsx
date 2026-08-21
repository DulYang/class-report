"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import { createGradeAction } from "@/lib/actions/schools";

export default function GradeForm({ schoolId }: { schoolId: string }) {
  return (
    <ActionForm
      action={createGradeAction}
      submitLabel="Add grade"
      successMessage="Grade added."
      resetOnSuccess
    >
      <input type="hidden" name="school_id" value={schoolId} />
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
