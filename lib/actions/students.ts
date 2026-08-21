"use server";

import { revalidatePath } from "next/cache";
import { adminActor, logAudit } from "@/lib/audit";
import { getCurrentAdmin } from "@/lib/auth";
import {
  createStudent,
  deleteStudent,
  updateStudent,
} from "@/lib/data/mutations";
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

/** Removing a student cascades to their report cards for every session. */
export async function deleteStudentAction(formData: FormData): Promise<void> {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const id = field(formData, "id");
  if (!id) return;

  await deleteStudent(id);
  await logAudit({
    actor: adminActor(admin),
    action: "student.delete",
    entityType: "student",
    entityId: id,
    summary: "Deleted a student",
  });

  refresh();
}
