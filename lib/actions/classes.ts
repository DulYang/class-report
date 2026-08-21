"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClass, deleteClass, updateClass } from "@/lib/data/mutations";
import { getCoachSchools } from "@/lib/data/queries";
import type { ActionResult } from "@/lib/types";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

type ClassInput = {
  name: string;
  school_id: string;
  grade_id: string;
  coach_id: string;
};

type Parsed =
  | { valid: false; error: string }
  | { valid: true; input: ClassInput };

function readClassInput(formData: FormData): Parsed {
  const name = field(formData, "name");
  const schoolId = field(formData, "school_id");
  const gradeId = field(formData, "grade_id");
  const coachId = field(formData, "coach_id");

  if (!coachId) return { valid: false, error: "Pick the coach for this class." };
  if (!schoolId) return { valid: false, error: "Pick a school." };
  if (!gradeId) return { valid: false, error: "Pick a grade." };
  if (!name) return { valid: false, error: "Class name is required." };

  return {
    valid: true,
    input: { name, school_id: schoolId, grade_id: gradeId, coach_id: coachId },
  };
}

/**
 * The form only offers assigned schools, but that is a UI convenience — this is
 * the check that actually holds. Only an admin can create a coach-school
 * assignment, so a class must reuse one that already exists.
 */
async function assignmentMissing(input: ClassInput): Promise<string | null> {
  try {
    const assignments = await getCoachSchools();
    const ok = assignments.some(
      (a) => a.coach_id === input.coach_id && a.school_id === input.school_id,
    );
    return ok
      ? null
      : "That coach isn't assigned to that school. An admin assigns coaches to schools.";
  } catch (err) {
    return err instanceof Error
      ? err.message
      : "Could not check the coach's school assignment.";
  }
}

function refresh() {
  revalidatePath("/weekly");
  revalidatePath("/classes");
  revalidatePath("/admin/students");
  revalidatePath("/reports");
}

export async function createClassAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = readClassInput(formData);
  if (!parsed.valid) return { ok: false, error: parsed.error };

  const denied = await assignmentMissing(parsed.input);
  if (denied) return { ok: false, error: denied };

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

  const denied = await assignmentMissing(parsed.input);
  if (denied) return { ok: false, error: denied };

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
