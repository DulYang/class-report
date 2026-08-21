"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { isBootstrapOpen } from "@/lib/auth";
import { claimAdminAccount } from "@/lib/data/mutations";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function signInAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!email) return { ok: false, error: "Email is required." };
  if (!password) return { ok: false, error: "Password is required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };

  await logAudit({
    actor: { type: "system", id: null, name: email },
    action: "admin.sign_in",
    entityType: "session",
    summary: `${email} signed in`,
  });

  revalidatePath("/", "layout");
  redirect("/admin");
}

/**
 * One-time setup for the very first admin. Closes itself as soon as an admin
 * account exists — both here and in the RLS policy behind it.
 */
export async function bootstrapAdminAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isBootstrapOpen())) {
    return {
      ok: false,
      error: "An admin account already exists. Sign in instead.",
    };
  }

  const name = field(formData, "name");
  const email = field(formData, "email");
  const password = String(formData.get("password") ?? "");

  if (!name) return { ok: false, error: "Your name is required." };
  if (!email) return { ok: false, error: "Email is required." };
  if (password.length < 8) {
    return { ok: false, error: "Use a password of at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };

  const userId = data.user?.id;
  if (!userId) {
    return { ok: false, error: "Sign-up did not return a user. Try again." };
  }

  let adminCoachId: string | null = null;
  try {
    const created = await claimAdminAccount({ name, email, user_id: userId });
    adminCoachId = created.id;
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Account created but admin link failed: ${err.message}`
          : "Account created but the admin link failed.",
    };
  }

  // signUp only returns a session when email confirmation is off; if it is on,
  // the account exists and the operator confirms then signs in normally.
  if (!data.session) {
    return {
      ok: false,
      error:
        "Admin account created, but this project requires email confirmation. Confirm the address, then sign in.",
    };
  }

  await logAudit({
    actor: { type: "admin", id: adminCoachId ?? userId, name },
    action: "admin.bootstrap",
    entityType: "coach",
    entityId: adminCoachId,
    summary: `${name} created the first admin account`,
  });

  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
