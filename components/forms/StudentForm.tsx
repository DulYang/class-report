"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import { createStudentAction } from "@/lib/actions/students";
import type { Class } from "@/lib/types";

/**
 * Add a student. When `classId` is fixed (class detail page) the picker is
 * hidden; on the Students page the coach chooses the class.
 */
export default function StudentForm({
  classId,
  classes,
}: {
  classId?: string;
  classes?: Class[];
}) {
  return (
    <ActionForm
      action={createStudentAction}
      submitLabel="Add student"
      successMessage="Student added."
      resetOnSuccess
    >
      {classId && <input type="hidden" name="class_id" value={classId} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Student name">
          <input
            name="name"
            required
            placeholder="Emma Johnson"
            className={inputClass}
          />
        </Field>
        {!classId && (
          <Field label="Class">
            <select name="class_id" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Choose a class…
              </option>
              {(classes ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.grade}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
    </ActionForm>
  );
}
