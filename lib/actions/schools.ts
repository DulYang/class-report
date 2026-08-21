"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminGuard } from "@/lib/auth";
import {
  createGrade,
  createSchool,
  deleteGrade,
  deleteSchool,
  updateGrade,
  updateSchool,
} from "@/lib/data/mutations";
import type { ActionResult } from "@/lib/types";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function refresh(schoolId?: string) {
  revalidatePath("/admin/schools");
  revalidatePath("/admin/syllabus");
  revalidatePath("/classes");
  revalidatePath("/weekly");
  if (schoolId) revalidatePath(`/admin/schools/${schoolId}`);
}

function fail(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

// ── schools ────────────────────────────────────────────────────────────────

export async function createSchoolAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const name = field(formData, "name");
  if (!name) return { ok: false, error: "School name is required." };

  try {
    await createSchool({
      name,
      pic_name: field(formData, "pic_name") || null,
      pic_phone: field(formData, "pic_phone") || null,
    });
  } catch (err) {
    return fail(err, "Could not create the school.");
  }

  refresh();
  return { ok: true };
}

export async function updateSchoolAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const id = field(formData, "id");
  const name = field(formData, "name");
  if (!id) return { ok: false, error: "Missing school id." };
  if (!name) return { ok: false, error: "School name is required." };

  try {
    await updateSchool(id, {
      name,
      pic_name: field(formData, "pic_name") || null,
      pic_phone: field(formData, "pic_phone") || null,
    });
  } catch (err) {
    return fail(err, "Could not update the school.");
  }

  refresh(id);
  return { ok: true };
}

/** Cascades to the school's grades, curricula, syllabus and report cards. */
export async function deleteSchoolAction(formData: FormData): Promise<void> {
  if (await adminGuard()) return;
  const id = field(formData, "id");
  if (!id) return;
  await deleteSchool(id);
  refresh();
  redirect("/admin/schools");
}

// ── grades ─────────────────────────────────────────────────────────────────

export async function createGradeAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const schoolId = field(formData, "school_id");
  const name = field(formData, "name");
  if (!schoolId) return { ok: false, error: "Pick a school for this grade." };
  if (!name) return { ok: false, error: "Grade name is required." };

  try {
    await createGrade({ school_id: schoolId, name });
  } catch (err) {
    return fail(err, "Could not add the grade.");
  }

  refresh(schoolId);
  return { ok: true };
}

export async function updateGradeAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const id = field(formData, "id");
  const name = field(formData, "name");
  if (!id) return { ok: false, error: "Missing grade id." };
  if (!name) return { ok: false, error: "Grade name is required." };

  try {
    await updateGrade(id, name);
  } catch (err) {
    return fail(err, "Could not rename the grade.");
  }

  refresh(field(formData, "school_id"));
  return { ok: true };
}

export async function deleteGradeAction(formData: FormData): Promise<void> {
  if (await adminGuard()) return;
  const id = field(formData, "id");
  if (!id) return;
  await deleteGrade(id);
  refresh(field(formData, "school_id"));
}
