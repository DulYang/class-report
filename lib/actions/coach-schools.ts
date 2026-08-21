"use server";

import { revalidatePath } from "next/cache";
import { adminGuard } from "@/lib/auth";
import {
  assignCoachToSchool,
  unassignCoachFromSchool,
} from "@/lib/data/mutations";
import type { ActionResult } from "@/lib/types";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function refresh(schoolId?: string) {
  revalidatePath("/admin/schools");
  revalidatePath("/admin/coaches");
  revalidatePath("/classes");
  if (schoolId) revalidatePath(`/admin/schools/${schoolId}`);
}

/**
 * Assigning a coach to a school is admin-only. The class form only offers
 * coaches already assigned to the chosen school, so creating a class can never
 * introduce a new pairing.
 */
export async function assignCoachAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

  const coachId = field(formData, "coach_id");
  const schoolId = field(formData, "school_id");
  if (!coachId) return { ok: false, error: "Pick a coach to assign." };
  if (!schoolId) return { ok: false, error: "Missing school." };

  try {
    await assignCoachToSchool({ coach_id: coachId, school_id: schoolId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("duplicate key")) {
      return { ok: false, error: "That coach is already assigned here." };
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
  await unassignCoachFromSchool(id);
  refresh(field(formData, "school_id"));
}
