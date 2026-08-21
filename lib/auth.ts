import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Coach } from "@/lib/types";

/**
 * Admins are the only accounts that log in for now — coaches use the open
 * weekly view. An admin is an auth user with a `coaches` row whose role is
 * 'admin' and whose user_id matches; RLS enforces the same rule server-side.
 */

export async function getSessionUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function getCurrentAdmin(): Promise<Coach | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .select("*")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (error) return null;
  return (data as Coach) ?? null;
}

/** Guard for every /admin page. Sends non-admins to the login screen. */
export async function requireAdmin(): Promise<Coach> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  return admin;
}

/** True until the first admin links an auth account — mirrors the RLS rule. */
export async function isBootstrapOpen(): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("coaches")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .not("user_id", "is", null);
  if (error) return false;
  return (count ?? 0) === 0;
}
