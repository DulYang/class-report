"use client";

import { useState } from "react";
import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import { createClassAction, updateClassAction } from "@/lib/actions/classes";
import type { Class, Coach, Grade, School } from "@/lib/types";

export default function ClassForm({
  coaches,
  schools,
  grades,
  initial,
}: {
  coaches: Coach[];
  schools: School[];
  grades: Grade[];
  initial?: Class;
}) {
  const editing = Boolean(initial);
  const [schoolId, setSchoolId] = useState(initial?.school_id ?? "");

  // Grades belong to a school, so the second picker follows the first.
  const gradeOptions = grades.filter((g) => g.school_id === schoolId);

  return (
    <ActionForm
      action={editing ? updateClassAction : createClassAction}
      submitLabel={editing ? "Save changes" : "Create class"}
      successMessage={editing ? "Class updated." : "Class created."}
      resetOnSuccess={!editing}
    >
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Class name">
          <input
            name="name"
            required
            defaultValue={initial?.name ?? ""}
            placeholder="Tuesday Basketball"
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
        <Field label="Coach">
          <select
            name="coach_id"
            defaultValue={initial?.coach_id ?? ""}
            className={inputClass}
          >
            <option value="">Unassigned</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.role === "admin" ? " (admin)" : ""}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {schools.length === 0 && (
        <p className="text-sm text-amber-700">
          No schools exist yet — an admin needs to create one before classes can
          be added.
        </p>
      )}
    </ActionForm>
  );
}
