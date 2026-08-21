"use client";

import { useState } from "react";
import DeleteButton from "@/components/DeleteButton";
import StudentForm from "@/components/forms/StudentForm";
import { deleteStudentAction } from "@/lib/actions/students";
import type { Grade, School, SchoolGrade, Student } from "@/lib/types";

/** One roster row: edit name/school/grade in place, or remove the student. */
export default function StudentRow({
  student,
  schools,
  grades,
  schoolGrades,
}: {
  student: Student;
  schools: School[];
  grades: Grade[];
  schoolGrades: SchoolGrade[];
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{student.name}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="min-h-11 rounded-md border border-neutral-300 px-2.5 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50 sm:min-h-0"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <DeleteButton
            action={deleteStudentAction}
            hidden={{ id: student.id }}
            label="Remove"
            confirmMessage={`Remove ${student.name}? Their report cards for every session will be deleted too.`}
          />
        </div>
      </div>

      {editing && (
        <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <StudentForm
            schools={schools}
            grades={grades}
            schoolGrades={schoolGrades}
            initial={student}
          />
        </div>
      )}
    </li>
  );
}
