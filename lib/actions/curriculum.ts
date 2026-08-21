"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminGuard } from "@/lib/auth";
import {
  createCurriculum,
  createLessonPlan,
  createObjective,
  deleteCurriculum,
  deleteLessonPlan,
  deleteObjective,
  updateCurriculum,
  updateLessonPlan,
  updateObjective,
} from "@/lib/data/mutations";
import type { ActionResult } from "@/lib/types";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function intField(formData: FormData, name: string): number {
  const parsed = Number.parseInt(field(formData, name), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function refresh(curriculumId?: string) {
  revalidatePath("/admin/curriculum");
  revalidatePath("/admin/syllabus");
  revalidatePath("/weekly");
  revalidatePath("/reports");
  if (curriculumId) revalidatePath(`/admin/curriculum/${curriculumId}`);
}

function fail(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

// ── curricula ──────────────────────────────────────────────────────────────

export async function createCurriculumAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const name = field(formData, "name");
  const gradeId = field(formData, "grade_id");
  if (!name) return { ok: false, error: "Curriculum name is required." };
  if (!gradeId) return { ok: false, error: "Pick the grade this curriculum is for." };

  try {
    await createCurriculum({ name, grade_id: gradeId });
  } catch (err) {
    return fail(err, "Could not create the curriculum.");
  }

  refresh();
  return { ok: true };
}

export async function updateCurriculumAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const id = field(formData, "id");
  const name = field(formData, "name");
  const gradeId = field(formData, "grade_id");
  if (!id) return { ok: false, error: "Missing curriculum id." };
  if (!name) return { ok: false, error: "Curriculum name is required." };
  if (!gradeId) return { ok: false, error: "Pick the grade this curriculum is for." };

  try {
    await updateCurriculum(id, { name, grade_id: gradeId });
  } catch (err) {
    return fail(err, "Could not update the curriculum.");
  }

  refresh(id);
  return { ok: true };
}

export async function deleteCurriculumAction(formData: FormData): Promise<void> {
  if (await adminGuard()) return;
  const id = field(formData, "id");
  if (!id) return;
  await deleteCurriculum(id);
  refresh();
  redirect("/admin/curriculum");
}

// ── lesson plans ───────────────────────────────────────────────────────────

export async function createLessonPlanAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const curriculumId = field(formData, "curriculum_id");
  const title = field(formData, "title");
  if (!curriculumId) return { ok: false, error: "Missing curriculum." };
  if (!title) return { ok: false, error: "Lesson plan title is required." };

  try {
    await createLessonPlan({
      curriculum_id: curriculumId,
      title,
      sort_order: intField(formData, "sort_order"),
    });
  } catch (err) {
    return fail(err, "Could not add the lesson plan.");
  }

  refresh(curriculumId);
  return { ok: true };
}

export async function updateLessonPlanAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const id = field(formData, "id");
  const title = field(formData, "title");
  if (!id) return { ok: false, error: "Missing lesson plan id." };
  if (!title) return { ok: false, error: "Lesson plan title is required." };

  try {
    await updateLessonPlan(id, { title, sort_order: intField(formData, "sort_order") });
  } catch (err) {
    return fail(err, "Could not update the lesson plan.");
  }

  refresh(field(formData, "curriculum_id"));
  return { ok: true };
}

/** Cascades to the plan's objectives and every syllabus entry using it. */
export async function deleteLessonPlanAction(formData: FormData): Promise<void> {
  if (await adminGuard()) return;
  const id = field(formData, "id");
  if (!id) return;
  await deleteLessonPlan(id);
  refresh(field(formData, "curriculum_id"));
}

// ── assessment objectives ──────────────────────────────────────────────────

export async function createObjectiveAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const lessonPlanId = field(formData, "lesson_plan_id");
  const title = field(formData, "title");
  if (!lessonPlanId) return { ok: false, error: "Missing lesson plan." };
  if (!title) return { ok: false, error: "Objective is required." };

  try {
    await createObjective({
      lesson_plan_id: lessonPlanId,
      title,
      description: field(formData, "description") || null,
      sort_order: intField(formData, "sort_order"),
    });
  } catch (err) {
    return fail(err, "Could not add the objective.");
  }

  refresh(field(formData, "curriculum_id"));
  return { ok: true };
}

export async function updateObjectiveAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const id = field(formData, "id");
  const title = field(formData, "title");
  if (!id) return { ok: false, error: "Missing objective id." };
  if (!title) return { ok: false, error: "Objective is required." };

  try {
    await updateObjective(id, {
      title,
      description: field(formData, "description") || null,
    });
  } catch (err) {
    return fail(err, "Could not update the objective.");
  }

  refresh(field(formData, "curriculum_id"));
  return { ok: true };
}

export async function deleteObjectiveAction(formData: FormData): Promise<void> {
  if (await adminGuard()) return;
  const id = field(formData, "id");
  if (!id) return;
  await deleteObjective(id);
  refresh(field(formData, "curriculum_id"));
}
