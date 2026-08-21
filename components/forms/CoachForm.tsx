"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import { createCoachAction, updateCoachAction } from "@/lib/actions/coaches";
import type { Coach } from "@/lib/types";

export default function CoachForm({ initial }: { initial?: Coach }) {
  const editing = Boolean(initial);

  return (
    <ActionForm
      action={editing ? updateCoachAction : createCoachAction}
      submitLabel={editing ? "Save coach" : "Add coach"}
      successMessage={editing ? "Coach updated." : "Coach added."}
      resetOnSuccess={!editing}
    >
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name">
          <input
            name="name"
            required
            defaultValue={initial?.name ?? ""}
            placeholder="Coach Sarah Mitchell"
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={initial?.email ?? ""}
            placeholder="sarah@school.edu"
            className={inputClass}
          />
        </Field>
        <Field label="Role">
          <select
            name="role"
            defaultValue={initial?.role ?? "coach"}
            className={inputClass}
          >
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
      </div>
    </ActionForm>
  );
}
