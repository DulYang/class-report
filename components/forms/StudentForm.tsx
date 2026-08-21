"use client";

import { useState } from "react";
import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import {
  createStudentAction,
  updateStudentAction,
} from "@/lib/actions/students";
import type { Grade, School, SchoolGrade, Student } from "@/lib/types";

/**
 * A student belongs to a school and a grade — there is no class. The grade
 * picker offers only the grades that school is set up to offer.
 */
export default function StudentForm({
  schools,
  grades,
  schoolGrades,
  initial,
}: {
  schools: School[];
  grades: Grade[];
  schoolGrades: SchoolGrade[];
  initial?: Student;
}) {
  const editing = Boolean(initial);
  const [schoolId, setSchoolId] = useState(initial?.school_id ?? "");
  const offeredGradeIds = new Set(
    schoolGrades.filter((sg) => sg.school_id === schoolId).map((sg) => sg.grade_id),
  );
  const gradeOptions = grades.filter((g) => offeredGradeIds.has(g.id));

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
