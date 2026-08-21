"use client";

import { useState, useTransition } from "react";
import DeleteButton from "@/components/DeleteButton";
import { deleteStudentAction, updateStudentAction } from "@/lib/actions/students";
import type { Student } from "@/lib/types";

/** One roster row: rename in place, or remove the student from the class. */
export default function StudentRow({
  student,
  classLabel,
}: {
  student: Student;
  classLabel?: string;
}) {
  const [name, setName] = useState(student.name);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", student.id);
      formData.set("class_id", student.class_id);
      formData.set("name", name);
      const result = await updateStudentAction(null, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEditing(false);
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            value={name}
            autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") {
                setName(student.name);
                setEditing(false);
              }
            }}
            aria-label={`Rename ${student.name}`}
            className="w-full max-w-xs rounded-md border border-neutral-300 px-2 py-1 text-sm"
          />
        ) : (
          <span className="font-medium">{student.name}</span>
        )}
        {classLabel && (
          <span className="ml-2 text-xs text-neutral-500">{classLabel}</span>
        )}
        {error && (
          <p role="alert" className="text-xs text-red-700">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={save}
              disabled={pending || !name.trim()}
              className="rounded-md bg-neutral-900 px-2.5 py-1 text-sm font-medium text-white disabled:bg-neutral-300"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setName(student.name);
                setEditing(false);
                setError(null);
              }}
              className="rounded-md border border-neutral-300 px-2.5 py-1 text-sm font-medium text-neutral-700"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Rename
          </button>
        )}
        <DeleteButton
          action={deleteStudentAction}
          hidden={{ id: student.id, class_id: student.class_id }}
          label="Remove"
          confirmMessage={`Remove ${student.name}? Their report cards for every lesson plan in this class will be deleted too.`}
        />
      </div>
    </li>
  );
}
