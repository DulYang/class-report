"use server";

import { revalidatePath } from "next/cache";
import { adminActor, logAudit } from "@/lib/audit";
import { getCurrentAdmin } from "@/lib/auth";
import {
  createStudent,
  createStudents,
  deleteStudent,
  updateStudent,
} from "@/lib/data/mutations";
import { getGrades, getSchoolGrades, getSchools } from "@/lib/data/queries";
import type { ActionResult } from "@/lib/types";

const DENIED = "Sign in as an admin to make this change.";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function refresh() {
  revalidatePath("/weekly");
  revalidatePath("/admin/students");
  revalidatePath("/reports");
}

type Parsed =
  | { valid: false; error: string }
  | { valid: true; input: { name: string; school_id: string; grade_id: string } };

function readStudent(formData: FormData): Parsed {
  const name = field(formData, "name");
  const schoolId = field(formData, "school_id");
  const gradeId = field(formData, "grade_id");

  if (!name) return { valid: false, error: "Student name is required." };
  if (!schoolId) return { valid: false, error: "Pick the student's school." };
  if (!gradeId) return { valid: false, error: "Pick the student's grade." };

  return {
    valid: true,
    input: { name, school_id: schoolId, grade_id: gradeId },
  };
}

export async function createStudentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: DENIED };

  const parsed = readStudent(formData);
  if (!parsed.valid) return { ok: false, error: parsed.error };

  try {
    await createStudent(parsed.input);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not add the student.",
    };
  }

  await logAudit({
    actor: adminActor(admin),
    action: "student.create",
    entityType: "student",
    summary: `Added student "${parsed.input.name}"`,
  });

  refresh();
  return { ok: true };
}

export async function updateStudentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: DENIED };

  const id = field(formData, "id");
  if (!id) return { ok: false, error: "Missing student id." };

  const parsed = readStudent(formData);
  if (!parsed.valid) return { ok: false, error: parsed.error };

  try {
    await updateStudent(id, parsed.input);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not update the student.",
    };
  }

  await logAudit({
    actor: adminActor(admin),
    action: "student.update",
    entityType: "student",
    entityId: id,
    summary: `Updated student "${parsed.input.name}"`,
  });

  refresh();
  return { ok: true };
}

/** Archives the student — their report cards for every session are untouched. */
export async function deleteStudentAction(formData: FormData): Promise<void> {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const id = field(formData, "id");
  if (!id) return;

  await deleteStudent(id);
  await logAudit({
    actor: adminActor(admin),
    action: "student.archive",
    entityType: "student",
    entityId: id,
    summary: "Archived a student",
  });

  refresh();
}

// ── bulk import (CSV) ───────────────────────────────────────────────────────

export type BulkImportRow = { name: string; school: string; grade: string };

export type BulkImportRowResult = {
  row: number;
  name: string;
  school: string;
  grade: string;
  status: "imported" | "skipped";
  reason?: string;
};

export type BulkImportResult =
  | { ok: true; created: number; results: BulkImportRowResult[] }
  | { ok: false; error: string };

/**
 * Resolves every row's school/grade against the current catalog — including
 * whether that grade is actually offered at that school — before inserting
 * anything. Rows that fail are skipped and reported; valid rows are still
 * imported in one batch.
 */
export async function bulkImportStudentsAction(
  rows: BulkImportRow[],
): Promise<BulkImportResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: DENIED };

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: "No rows to import." };
  }
  if (rows.length > 1000) {
    return { ok: false, error: "That's too many rows in one file (max 1000)." };
  }

  const [schools, grades, schoolGrades] = await Promise.all([
    getSchools(),
    getGrades(),
    getSchoolGrades(),
  ]);
  const schoolByName = new Map(
    schools.map((s) => [s.name.trim().toLowerCase(), s]),
  );
  const gradeByName = new Map(
    grades.map((g) => [g.name.trim().toLowerCase(), g]),
  );
  const offeredPairs = new Set(
    schoolGrades.map((sg) => `${sg.school_id}:${sg.grade_id}`),
  );

  const results: BulkImportRowResult[] = [];
  const toInsert: { school_id: string; grade_id: string; name: string }[] = [];

  rows.forEach((row, i) => {
    const rowNumber = i + 1;
    const name = (row.name ?? "").trim();
    const schoolText = (row.school ?? "").trim();
    const gradeText = (row.grade ?? "").trim();

    function skip(reason: string) {
      results.push({
        row: rowNumber,
        name,
        school: schoolText,
        grade: gradeText,
        status: "skipped",
        reason,
      });
    }

    if (!name) return skip("Missing student name.");
    if (!schoolText) return skip("Missing school.");
    if (!gradeText) return skip("Missing grade.");

    const school = schoolByName.get(schoolText.toLowerCase());
    if (!school) return skip(`Unknown school "${schoolText}".`);

    const grade = gradeByName.get(gradeText.toLowerCase());
    if (!grade) return skip(`Unknown grade "${gradeText}".`);

    if (!offeredPairs.has(`${school.id}:${grade.id}`)) {
      return skip(`${grade.name} is not offered at ${school.name}.`);
    }

    toInsert.push({ school_id: school.id, grade_id: grade.id, name });
    results.push({
      row: rowNumber,
      name,
      school: school.name,
      grade: grade.name,
      status: "imported",
    });
  });

  if (toInsert.length > 0) {
    try {
      await createStudents(toInsert);
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Could not import students.",
      };
    }

    await logAudit({
      actor: adminActor(admin),
      action: "student.bulk_import",
      entityType: "student",
      summary: `Bulk imported ${toInsert.length} student${toInsert.length === 1 ? "" : "s"} via CSV`,
    });

    refresh();
  }

  return { ok: true, created: toInsert.length, results };
}
