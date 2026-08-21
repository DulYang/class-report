"use server";

import { revalidatePath } from "next/cache";
import { adminActor, logAudit } from "@/lib/audit";
import { getCurrentAdmin } from "@/lib/auth";
import { createCoach, deleteCoach, updateCoach } from "@/lib/data/mutations";
import type { ActionResult } from "@/lib/types";

const DENIED = "Sign in as an admin to make this change.";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function refresh() {
  revalidatePath("/admin/coaches");
  revalidatePath("/weekly");
  revalidatePath("/reports");
}

function readCoach(formData: FormData) {
  const name = field(formData, "name");
  const email = field(formData, "email");
  const role = field(formData, "role") === "admin" ? "admin" : "coach";
  if (!name) return { valid: false as const, error: "Coach name is required." };
  return { valid: true as const, input: { name, email: email || null, role } };
}

export async function createCoachAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: DENIED };

  const parsed = readCoach(formData);
  if (!parsed.valid) return { ok: false, error: parsed.error };

  try {
    await createCoach(parsed.input);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not add the coach.",
    };
  }

  await logAudit({
    actor: adminActor(admin),
    action: "coach.create",
    entityType: "coach",
    summary: `Added coach "${parsed.input.name}" (${parsed.input.role})`,
  });

  refresh();
  return { ok: true };
}

export async function updateCoachAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await getCurrentAdmin();
  if (!admin) return { ok: false, error: DENIED };

  const id = field(formData, "id");
  if (!id) return { ok: false, error: "Missing coach id." };

  const parsed = readCoach(formData);
  if (!parsed.valid) return { ok: false, error: parsed.error };

  try {
    await updateCoach(id, parsed.input);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not update the coach.",
    };
  }

  await logAudit({
    actor: adminActor(admin),
    action: "coach.update",
    entityType: "coach",
    entityId: id,
    summary: `Updated coach "${parsed.input.name}" (${parsed.input.role})`,
  });

  refresh();
  return { ok: true };
}

export async function deleteCoachAction(formData: FormData): Promise<void> {
  const admin = await getCurrentAdmin();
  if (!admin) return;

  const id = field(formData, "id");
  if (!id) return;

  await deleteCoach(id);
  await logAudit({
    actor: adminActor(admin),
    action: "coach.delete",
    entityType: "coach",
    entityId: id,
    summary: "Deleted a coach",
  });

  refresh();
}
