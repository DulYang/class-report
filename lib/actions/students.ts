"use server";

import { revalidatePath } from "next/cache";
import { adminGuard } from "@/lib/auth";
import {
  createStudent,
  deleteStudent,
  updateStudent,
} from "@/lib/data/mutations";
import type { ActionResult } from "@/lib/types";

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
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

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

  refresh();
  return { ok: true };
}

export async function updateStudentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

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

  refresh();
  return { ok: true };
}

/** Removing a student cascades to their report cards for every session. */
export async function deleteStudentAction(formData: FormData): Promise<void> {
  if (await adminGuard()) return;
  const id = field(formData, "id");
  if (!id) return;
  await deleteStudent(id);
  refresh();
}
