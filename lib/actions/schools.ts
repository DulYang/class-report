"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminActor, logAudit } from "@/lib/audit";
import { getCurrentAdmin } from "@/lib/auth";
import {
  createGrade,
  createSchool,
  deleteGrade,
  deleteSchool,
  updateGrade,
  updateSchool,
} from "@/lib/data/mutations";
import type { ActionResult } from "@/lib/types";

const DENIED = "Sign in as an admin to make this change.";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function refresh(schoolId?: string) {
  revalidatePath("/admin/schools");
  revalidatePath("/admin/syllabus");
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
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: DENIED };

  const name = field(formData, "name");
  if (!name) return { ok: false, error: "School name is required." };
  const picName = field(formData, "pic_name") || null;
  const picPhone = field(formData, "pic_phone") || null;

  try {
    await createSchool({ name, pic_name: picName, pic_phone: picPhone });
  } catch (err) {
    return fail(err, "Could not create the school.");
  }

  await logAudit({
    actor: adminActor(admin),
    action: "school.create",
    entityType: "school",
    summary: `Created school "${name}"`,
  });

  refresh();
  return { ok: true };
}

export async function updateSchoolAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: DENIED };

  const id = field(formData, "id");
  const name = field(formData, "name");
  if (!id) return { ok: false, error: "Missing school id." };
  if (!name) return { ok: false, error: "School name is required." };
  const picName = field(formData, "pic_name") || null;
  const picPhone = field(formData, "pic_phone") || null;

  try {
    await updateSchool(id, { name, pic_name: picName, pic_phone: picPhone });
  } catch (err) {
    return fail(err, "Could not update the school.");
  }

  await logAudit({
    actor: adminActor(admin),
    action: "school.update",
    entityType: "school",
    entityId: id,
    summary: `Updated school "${name}"`,
  });

  refresh(id);
  return { ok: true };
}

/** Cascades to the school's grades, curricula, syllabus and report cards. */
export async function deleteSchoolAction(formData: FormData): Promise<void> {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const id = field(formData, "id");
  if (!id) return;

  await deleteSchool(id);
  await logAudit({
    actor: adminActor(admin),
    action: "school.delete",
    entityType: "school",
    entityId: id,
    summary: "Deleted a school",
  });

  refresh();
  redirect("/admin/schools");
}

// ── grades ─────────────────────────────────────────────────────────────────

export async function createGradeAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: DENIED };

  const schoolId = field(formData, "school_id");
  const name = field(formData, "name");
  if (!schoolId) return { ok: false, error: "Pick a school for this grade." };
  if (!name) return { ok: false, error: "Grade name is required." };

  try {
    await createGrade({ school_id: schoolId, name });
  } catch (err) {
    return fail(err, "Could not add the grade.");
  }

  await logAudit({
    actor: adminActor(admin),
    action: "grade.create",
    entityType: "grade",
    summary: `Added grade "${name}"`,
  });

  refresh(schoolId);
  return { ok: true };
}

export async function updateGradeAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: DENIED };

  const id = field(formData, "id");
  const name = field(formData, "name");
  if (!id) return { ok: false, error: "Missing grade id." };
  if (!name) return { ok: false, error: "Grade name is required." };

  try {
    await updateGrade(id, name);
  } catch (err) {
    return fail(err, "Could not rename the grade.");
  }

  await logAudit({
    actor: adminActor(admin),
    action: "grade.update",
    entityType: "grade",
    entityId: id,
    summary: `Renamed grade to "${name}"`,
  });

  refresh(field(formData, "school_id"));
  return { ok: true };
}

export async function deleteGradeAction(formData: FormData): Promise<void> {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const id = field(formData, "id");
  if (!id) return;

  await deleteGrade(id);
  await logAudit({
    actor: adminActor(admin),
    action: "grade.delete",
    entityType: "grade",
    entityId: id,
    summary: "Deleted a grade",
  });

  refresh(field(formData, "school_id"));
}
