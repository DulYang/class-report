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

function refresh(classId?: string) {
  revalidatePath("/weekly");
  revalidatePath("/classes");
  revalidatePath("/admin/students");
  revalidatePath("/reports");
  if (classId) revalidatePath(`/classes/${classId}`);
}

export async function createStudentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const classId = field(formData, "class_id");
  const name = field(formData, "name");
  if (!classId) return { ok: false, error: "Pick a class for this student." };
  if (!name) return { ok: false, error: "Student name is required." };

  try {
    await createStudent({ class_id: classId, name });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not add the student.",
    };
  }

  refresh(classId);
  return { ok: true };
}

export async function updateStudentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const id = field(formData, "id");
  const classId = field(formData, "class_id");
  const name = field(formData, "name");
  if (!id) return { ok: false, error: "Missing student id." };
  if (!name) return { ok: false, error: "Student name is required." };

  try {
    await updateStudent(id, name);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not rename the student.",
    };
  }

  refresh(classId);
  return { ok: true };
}

/** Removing a student cascades to their report cards for every lesson plan. */
export async function deleteStudentAction(formData: FormData): Promise<void> {
  if (await adminGuard()) return;
  const id = field(formData, "id");
  const classId = field(formData, "class_id");
  if (!id) return;
  await deleteStudent(id);
  refresh(classId);
}
