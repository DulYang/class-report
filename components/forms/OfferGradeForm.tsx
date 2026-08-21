"use client";

import Link from "next/link";
import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import { addSchoolGradeAction } from "@/lib/actions/schools";
import type { Grade } from "@/lib/types";

/** Offers an existing (global) grade at this school. */
export default function OfferGradeForm({
  schoolId,
  gradeOptions,
}: {
  schoolId: string;
  gradeOptions: Grade[];
}) {
  if (gradeOptions.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        Every grade is already offered here — add a new one on the{" "}
        <Link href="/admin/grades" className="font-medium underline">
          Grades
        </Link>{" "}
        page.
      </p>
    );
  }

  return (
    <ActionForm
      action={addSchoolGradeAction}
      submitLabel="Offer grade"
      successMessage="Grade offered."
      resetOnSuccess
    >
      <input type="hidden" name="school_id" value={schoolId} />
      <Field label="Grade">
        <select
          name="grade_id"
          required
          defaultValue=""
          className={`${inputClass} max-w-xs`}
        >
          <option value="" disabled>
            Choose a grade…
          </option>
          {gradeOptions.map((grade) => (
            <option key={grade.id} value={grade.id}>
              {grade.name}
            </option>
          ))}
        </select>
      </Field>
    </ActionForm>
  );
}
