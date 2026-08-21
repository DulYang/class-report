"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClass, deleteClass, updateClass } from "@/lib/data/mutations";
import type { ActionResult } from "@/lib/types";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

type ClassInput = {
  name: string;
  school_id: string;
  grade_id: string;
  coach_id: string | null;
};

type Parsed =
  | { valid: false; error: string }
  | { valid: true; input: ClassInput };

function readClassInput(formData: FormData): Parsed {
  const name = field(formData, "name");
  const schoolId = field(formData, "school_id");
  const gradeId = field(formData, "grade_id");
  const coachId = field(formData, "coach_id");

  if (!name) return { valid: false, error: "Class name is required." };
  if (!schoolId) return { valid: false, error: "Pick a school." };
  if (!gradeId) return { valid: false, error: "Pick a grade." };

  return {
    valid: true,
    input: {
      name,
      school_id: schoolId,
      grade_id: gradeId,
      coach_id: coachId || null,
    },
  };
}

function refresh() {
  revalidatePath("/weekly");
  revalidatePath("/classes");
  revalidatePath("/students");
  revalidatePath("/reports");
}

export async function createClassAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = readClassInput(formData);
  if (!parsed.valid) return { ok: false, error: parsed.error };

  try {
    await createClass(parsed.input);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not create the class.",
    };
  }

  refresh();
  return { ok: true };
}

export async function updateClassAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = field(formData, "id");
  if (!id) return { ok: false, error: "Missing class id." };

  const parsed = readClassInput(formData);
  if (!parsed.valid) return { ok: false, error: parsed.error };

  try {
    await updateClass(id, parsed.input);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not update the class.",
    };
  }

  refresh();
  revalidatePath(`/classes/${id}`);
  return { ok: true };
}

/** Deleting a class cascades to its students and their report cards. */
export async function deleteClassAction(formData: FormData): Promise<void> {
  const id = field(formData, "id");
  if (!id) return;
  await deleteClass(id);
  refresh();
  redirect("/classes");
}
