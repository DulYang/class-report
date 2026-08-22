"use client";

import { useState, useTransition } from "react";
import DeleteButton from "@/components/DeleteButton";
import { deleteGradeAction, updateGradeAction } from "@/lib/actions/schools";
import type { Grade } from "@/lib/types";

/** One grade of a school: rename in place, or remove it. */
export default function GradeRow({ grade }: { grade: Grade }) {
  const [name, setName] = useState(grade.name);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", grade.id);
      formData.set("name", name);
      const result = await updateGradeAction(null, formData);
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
                setName(grade.name);
                setEditing(false);
              }
            }}
            aria-label={`Rename ${grade.name}`}
            className="min-h-11 w-full max-w-xs rounded-md border border-neutral-300 px-2 py-1 text-base sm:min-h-0 sm:text-sm"
          />
        ) : (
          <span className="font-medium">{grade.name}</span>
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
              className="min-h-11 rounded-md bg-neutral-900 px-2.5 py-1 text-sm font-medium text-white disabled:bg-neutral-300 sm:min-h-0"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setName(grade.name);
                setEditing(false);
                setError(null);
              }}
              className="min-h-11 rounded-md border border-neutral-300 px-2.5 py-1 text-sm font-medium text-neutral-700 sm:min-h-0"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="min-h-11 rounded-md border border-neutral-300 px-2.5 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50 sm:min-h-0"
          >
            Rename
          </button>
        )}
        <DeleteButton
          action={deleteGradeAction}
          hidden={{ id: grade.id }}
          label="Remove"
          confirmMessage={`Archive ${grade.name}? It disappears from every school offering it, and its curriculum pairings and coach assignments are removed. Its students are archived too, but their report cards already filled stay visible in Reports.`}
        />
      </div>
    </li>
  );
}
