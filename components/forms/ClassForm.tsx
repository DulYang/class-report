"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import { createClassAction, updateClassAction } from "@/lib/actions/classes";
import type { Class, Coach } from "@/lib/types";

export default function ClassForm({
  coaches,
  initial,
}: {
  coaches: Coach[];
  initial?: Class;
}) {
  const editing = Boolean(initial);

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
          <input
            name="school"
            required
            defaultValue={initial?.school ?? ""}
            placeholder="Riverside Elementary"
            className={inputClass}
          />
        </Field>
        <Field label="Grade">
          <input
            name="grade"
            required
            defaultValue={initial?.grade ?? ""}
            placeholder="Grade 5"
            className={inputClass}
          />
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
    </ActionForm>
  );
}
