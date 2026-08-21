"use server";

import { revalidatePath } from "next/cache";
import {
  createLessonPlan,
  deleteLessonPlan,
  updateLessonPlan,
} from "@/lib/data/mutations";
import type { ActionResult } from "@/lib/types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

type PlanInput = { title: string; session_date1: string; session_date2: string };

type Parsed =
  | { valid: false; error: string }
  | { valid: true; input: PlanInput };

function readPlanInput(formData: FormData): Parsed {
  const title = field(formData, "title");
  const d1 = field(formData, "session_date1");
  const d2 = field(formData, "session_date2");

  if (!title) return { valid: false, error: "Lesson plan title is required." };
  if (!DATE.test(d1)) return { valid: false, error: "Session 1 date is required." };
  if (!DATE.test(d2)) return { valid: false, error: "Session 2 date is required." };

  return { valid: true, input: { title, session_date1: d1, session_date2: d2 } };
}

function refresh(classId?: string) {
  revalidatePath("/weekly");
  revalidatePath("/classes");
  revalidatePath("/reports");
  if (classId) revalidatePath(`/classes/${classId}`);
}

export async function createLessonPlanAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const classId = field(formData, "class_id");
  if (!classId) return { ok: false, error: "Missing class." };

  const parsed = readPlanInput(formData);
  if (!parsed.valid) return { ok: false, error: parsed.error };

  try {
    await createLessonPlan({ class_id: classId, ...parsed.input });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Could not create the lesson plan.",
    };
  }

  refresh(classId);
  return { ok: true };
}

export async function updateLessonPlanAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = field(formData, "id");
  const classId = field(formData, "class_id");
  if (!id) return { ok: false, error: "Missing lesson plan id." };

  const parsed = readPlanInput(formData);
  if (!parsed.valid) return { ok: false, error: parsed.error };

  try {
    await updateLessonPlan(id, parsed.input);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Could not update the lesson plan.",
    };
  }

  refresh(classId);
  revalidatePath(`/reports/${id}`);
  return { ok: true };
}

export async function deleteLessonPlanAction(formData: FormData): Promise<void> {
  const id = field(formData, "id");
  const classId = field(formData, "class_id");
  if (!id) return;
  await deleteLessonPlan(id);
  refresh(classId);
}
