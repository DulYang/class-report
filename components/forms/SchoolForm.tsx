"use client";

import ActionForm, { Field, inputClass } from "@/components/forms/ActionForm";
import { createSchoolAction, updateSchoolAction } from "@/lib/actions/schools";
import type { School } from "@/lib/types";

export default function SchoolForm({ initial }: { initial?: School }) {
  const editing = Boolean(initial);

  return (
    <ActionForm
      action={editing ? updateSchoolAction : createSchoolAction}
      submitLabel={editing ? "Save school" : "Create school"}
      successMessage={editing ? "School updated." : "School created."}
      resetOnSuccess={!editing}
    >
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="School name">
          <input
            name="name"
            required
            defaultValue={initial?.name ?? ""}
            placeholder="Riverside Elementary"
            className={inputClass}
          />
        </Field>
        <Field label="PIC name">
          <input
            name="pic_name"
            defaultValue={initial?.pic_name ?? ""}
            placeholder="Person in charge"
            className={inputClass}
          />
        </Field>
        <Field label="PIC phone number">
          <input
            name="pic_phone"
            type="tel"
            defaultValue={initial?.pic_phone ?? ""}
            placeholder="+60 12-345 6789"
            className={inputClass}
          />
        </Field>
      </div>
    </ActionForm>
  );
}
