"use server";

import { revalidatePath } from "next/cache";
import { adminGuard } from "@/lib/auth";
import {
  createLessonPlan,
  createObjective,
  deleteLessonPlan,
  deleteObjective,
  pairLessonPlanWithGrade,
  unpairLessonPlanFromGrade,
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

function refresh(lessonPlanId?: string) {
  revalidatePath("/admin/curriculum");
  revalidatePath("/admin/syllabus");
  revalidatePath("/weekly");
  revalidatePath("/reports");
  if (lessonPlanId) revalidatePath(`/admin/curriculum/${lessonPlanId}`);
}

function fail(err: unknown, fallback: string): ActionResult {
  return { ok: false, error: err instanceof Error ? err.message : fallback };
}

// ── lesson plans ───────────────────────────────────────────────────────────

export async function createLessonPlanAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const title = field(formData, "title");
  if (!title) return { ok: false, error: "Lesson plan title is required." };

  try {
    await createLessonPlan(title);
  } catch (err) {
    return fail(err, "Could not create the lesson plan.");
  }

  refresh();
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
    await updateLessonPlan(id, title);
  } catch (err) {
    return fail(err, "Could not update the lesson plan.");
  }

  refresh(id);
  return { ok: true };
}

/** Cascades to every grade pairing, its objectives, and syllabus use. */
export async function deleteLessonPlanAction(formData: FormData): Promise<void> {
  if (await adminGuard()) return;
  const id = field(formData, "id");
  if (!id) return;
  await deleteLessonPlan(id);
  refresh();
}

// ── curriculum: pairing a lesson plan with a grade ─────────────────────────

export async function pairGradeAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const lessonPlanId = field(formData, "lesson_plan_id");
  const gradeId = field(formData, "grade_id");
  if (!lessonPlanId) return { ok: false, error: "Missing lesson plan." };
  if (!gradeId) return { ok: false, error: "Pick a grade." };

  try {
    await pairLessonPlanWithGrade({
      lesson_plan_id: lessonPlanId,
      grade_id: gradeId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("duplicate key")) {
      return { ok: false, error: "This lesson plan is already paired with that grade." };
    }
    return fail(err, "Could not pair the grade.");
  }

  refresh(lessonPlanId);
  return { ok: true };
}

/** Cascades to that grade's objectives for this plan. */
export async function unpairGradeAction(formData: FormData): Promise<void> {
  if (await adminGuard()) return;
  const id = field(formData, "id");
  if (!id) return;
  await unpairLessonPlanFromGrade(id);
  refresh(field(formData, "lesson_plan_id"));
}

// ── assessment objectives ──────────────────────────────────────────────────

export async function createObjectiveAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const curriculumId = field(formData, "curriculum_id");
  const title = field(formData, "title");
  if (!curriculumId) return { ok: false, error: "Missing grade pairing." };
  if (!title) return { ok: false, error: "Objective is required." };

  try {
    await createObjective({
      curriculum_id: curriculumId,
      title,
      description: field(formData, "description") || null,
      sort_order: intField(formData, "sort_order"),
    });
  } catch (err) {
    return fail(err, "Could not add the objective.");
  }

  refresh(field(formData, "lesson_plan_id"));
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

  refresh(field(formData, "lesson_plan_id"));
  return { ok: true };
}

export async function deleteObjectiveAction(formData: FormData): Promise<void> {
  if (await adminGuard()) return;
  const id = field(formData, "id");
  if (!id) return;
  await deleteObjective(id);
  refresh(field(formData, "lesson_plan_id"));
}
