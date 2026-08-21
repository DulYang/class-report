"use server";

import { revalidatePath } from "next/cache";
import { adminGuard } from "@/lib/auth";
import {
  createSyllabusEntry,
  deleteSyllabusEntry,
  updateSyllabusEntry,
} from "@/lib/data/mutations";
import type { ActionResult } from "@/lib/types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function refresh(schoolId?: string) {
  revalidatePath("/admin/syllabus");
  revalidatePath("/weekly");
  revalidatePath("/reports");
  if (schoolId) revalidatePath(`/admin/syllabus/${schoolId}`);
}

type Parsed =
  | { valid: false; error: string }
  | {
      valid: true;
      input: {
        lesson_plan_id: string;
        session_date1: string;
        session_date2: string | null;
      };
    };

function readEntry(formData: FormData): Parsed {
  const lessonPlanId = field(formData, "lesson_plan_id");
  const d1 = field(formData, "session_date1");
  const d2 = field(formData, "session_date2");

  if (!lessonPlanId) return { valid: false, error: "Pick a lesson plan." };
  if (!DATE.test(d1)) return { valid: false, error: "Session 1 date is required." };
  if (d2 && !DATE.test(d2)) {
    return { valid: false, error: "Session 2 date is not a valid date." };
  }

  return {
    valid: true,
    input: {
      lesson_plan_id: lessonPlanId,
      session_date1: d1,
      session_date2: d2 || null,
    },
  };
}

export async function createSyllabusEntryAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const schoolId = field(formData, "school_id");
  if (!schoolId) return { ok: false, error: "Missing school." };

  const parsed = readEntry(formData);
  if (!parsed.valid) return { ok: false, error: parsed.error };

  try {
    await createSyllabusEntry({ school_id: schoolId, ...parsed.input });
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Could not add the syllabus entry.",
    };
  }

  refresh(schoolId);
  return { ok: true };
}

export async function updateSyllabusEntryAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const id = field(formData, "id");
  if (!id) return { ok: false, error: "Missing syllabus entry id." };

  const parsed = readEntry(formData);
  if (!parsed.valid) return { ok: false, error: parsed.error };

  try {
    await updateSyllabusEntry(id, parsed.input);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Could not update the syllabus entry.",
    };
  }

  refresh(field(formData, "school_id"));
  return { ok: true };
}

/** Cascades to every report card filled against this scheduled session. */
export async function deleteSyllabusEntryAction(
  formData: FormData,
): Promise<void> {
  if (await adminGuard()) return;
  const id = field(formData, "id");
  if (!id) return;
  await deleteSyllabusEntry(id);
  refresh(field(formData, "school_id"));
}
