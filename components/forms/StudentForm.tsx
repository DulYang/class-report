"use client";

import { useState } from "react";
import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import {
  createStudentAction,
  updateStudentAction,
} from "@/lib/actions/students";
import type { Grade, School, Student } from "@/lib/types";

/**
 * A student belongs to a school and a grade — there is no class. Grades belong
 * to a school, so the second picker follows the first.
 */
export default function StudentForm({
  schools,
  grades,
  initial,
}: {
  schools: School[];
  grades: Grade[];
  initial?: Student;
}) {
  const editing = Boolean(initial);
  const [schoolId, setSchoolId] = useState(initial?.school_id ?? "");
  const gradeOptions = grades.filter((g) => g.school_id === schoolId);

  return (
    <ActionForm
      action={editing ? updateStudentAction : createStudentAction}
      submitLabel={editing ? "Save student" : "Add student"}
      successMessage={editing ? "Student updated." : "Student added."}
      resetOnSuccess={!editing}
    >
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Student name">
          <input
            name="name"
            required
            defaultValue={initial?.name ?? ""}
            placeholder="Emma Johnson"
            className={inputClass}
          />
        </Field>
        <Field label="School">
          <select
            name="school_id"
            required
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Choose a school…
            </option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Grade">
          <select
            name="grade_id"
            required
            defaultValue={initial?.grade_id ?? ""}
            key={schoolId}
            disabled={!schoolId}
            className={inputClass}
          >
            <option value="" disabled>
              {schoolId ? "Choose a grade…" : "Pick a school first"}
            </option>
            {gradeOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </ActionForm>
  );
}
