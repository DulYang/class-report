"use client";

import Link from "next/link";
import { useState } from "react";
import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import { createClassAction, updateClassAction } from "@/lib/actions/classes";
import type { Class, Coach, CoachSchool, Grade, School } from "@/lib/types";

/**
 * The coach comes first: a class is defined by who teaches it. The school list
 * is then limited to schools that coach is assigned to, so creating a class can
 * never introduce a new coach-school pairing — only an admin can do that.
 */
export default function ClassForm({
  coaches,
  schools,
  grades,
  coachSchools,
  initial,
}: {
  coaches: Coach[];
  schools: School[];
  grades: Grade[];
  coachSchools: CoachSchool[];
  initial?: Class;
}) {
  const editing = Boolean(initial);
  const [coachId, setCoachId] = useState(initial?.coach_id ?? "");
  const [schoolId, setSchoolId] = useState(initial?.school_id ?? "");

  const assignedSchoolIds = new Set(
    coachSchools.filter((cs) => cs.coach_id === coachId).map((cs) => cs.school_id),
  );
  const schoolOptions = schools.filter((s) => assignedSchoolIds.has(s.id));
  const gradeOptions = grades.filter((g) => g.school_id === schoolId);

  const coachHasNoSchools = coachId !== "" && schoolOptions.length === 0;

  return (
    <ActionForm
      action={editing ? updateClassAction : createClassAction}
      submitLabel={editing ? "Save changes" : "Create class"}
      successMessage={editing ? "Class updated." : "Class created."}
      resetOnSuccess={!editing}
    >
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Coach">
          <select
            name="coach_id"
            required
            value={coachId}
            onChange={(e) => {
              setCoachId(e.target.value);
              setSchoolId("");
            }}
            className={inputClass}
          >
            <option value="" disabled>
              Choose a coach…
            </option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.role === "admin" ? " (admin)" : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label="School">
          <select
            name="school_id"
            required
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            disabled={!coachId}
            className={inputClass}
          >
            <option value="" disabled>
              {coachId ? "Choose a school…" : "Pick a coach first"}
            </option>
            {schoolOptions.map((s) => (
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

        <Field label="Class name">
          <input
            name="name"
            required
            defaultValue={initial?.name ?? ""}
            placeholder="Tuesday Basketball"
            className={inputClass}
          />
        </Field>
      </div>

      {coachHasNoSchools && (
        <p className="text-sm text-amber-700">
          This coach isn&apos;t assigned to any school yet. An admin assigns
          coaches to schools on the{" "}
          <Link href="/admin/schools" className="font-medium underline">
            Schools &amp; Grades
          </Link>{" "}
          page.
        </p>
      )}

      {coaches.length === 0 && (
        <p className="text-sm text-amber-700">
          No coaches exist yet — an admin needs to add one first.
        </p>
      )}
    </ActionForm>
  );
}
