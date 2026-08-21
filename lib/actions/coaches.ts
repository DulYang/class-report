"use server";

import { revalidatePath } from "next/cache";
import { adminGuard } from "@/lib/auth";
import { createCoach, deleteCoach, updateCoach } from "@/lib/data/mutations";
import type { ActionResult } from "@/lib/types";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function refresh() {
  revalidatePath("/admin/coaches");
  revalidatePath("/classes");
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
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

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

  refresh();
  return { ok: true };
}

export async function updateCoachAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await adminGuard();
  if (denied) return { ok: false, error: denied };

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

  refresh();
  return { ok: true };
}

export async function deleteCoachAction(formData: FormData): Promise<void> {
  if (await adminGuard()) return;
  const id = field(formData, "id");
  if (!id) return;
  await deleteCoach(id);
  refresh();
}
