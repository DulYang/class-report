"use server";

import { revalidatePath } from "next/cache";
import { adminGuard } from "@/lib/auth";
import {
  assignCoachToGrade,
  unassignCoachFromGrade,
} from "@/lib/data/mutations";
import type { ActionResult } from "@/lib/types";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function refresh(schoolId?: string) {
  revalidatePath("/admin/schools");
  revalidatePath("/admin/coaches");
  revalidatePath("/weekly");
  if (schoolId) revalidatePath(`/admin/schools/${schoolId}`);
}

/**
 * A coach owns a grade at a school and inherits every session scheduled for it.
 * Admin-only — this is what decides whose weekly view a session appears in.
 */
export async function assignCoachAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const coachId = field(formData, "coach_id");
  const schoolId = field(formData, "school_id");
  const gradeId = field(formData, "grade_id");
  if (!coachId) return { ok: false, error: "Pick a coach to assign." };
  if (!schoolId) return { ok: false, error: "Missing school." };
  if (!gradeId) return { ok: false, error: "Pick the grade they coach." };

  try {
    await assignCoachToGrade({
      coach_id: coachId,
      school_id: schoolId,
      grade_id: gradeId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("duplicate key")) {
      return { ok: false, error: "That coach already has this grade." };
    }
    return { ok: false, error: message || "Could not assign the coach." };
  }

  refresh(schoolId);
  return { ok: true };
}

export async function unassignCoachAction(formData: FormData): Promise<void> {
  if (await adminGuard()) return;
  const id = field(formData, "id");
  if (!id) return;
  await unassignCoachFromGrade(id);
  refresh(field(formData, "school_id"));
}
