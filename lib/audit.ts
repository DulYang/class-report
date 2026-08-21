import { getCurrentAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Coach } from "@/lib/types";

export type AuditActor =
  | { type: "admin"; id: string; name: string }
  | { type: "coach"; id: string | null; name: string }
  | { type: "system"; id: null; name: string };

/**
 * Every mutating action logs here. Failures are swallowed — the audit trail
 * must never be the reason a real action fails.
 */
export async function logAudit(input: {
  actor: AuditActor;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("audit_log").insert({
      actor_type: input.actor.type,
      actor_id: input.actor.id,
      actor_name: input.actor.name,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId ?? null,
      summary: input.summary,
    });
  } catch {
    // Never let logging failure break the action it's auditing.
  }
}

/** The signed-in admin as an actor — call only after an admin check passed. */
export function adminActor(admin: Coach): AuditActor {
  return { type: "admin", id: admin.id, name: admin.name };
}

/**
 * Prefers the signed-in admin (editing on a coach's behalf) over the coach
 * identity self-reported from the weekly view's picker, which is not a
 * security boundary — report_cards writes are open to anyone with the URL.
 */
export async function reportCardActor(
  coachId: string | null,
  coachName: string | null,
): Promise<AuditActor> {
  const admin = await getCurrentAdmin();
  if (admin) return adminActor(admin);
  if (coachId && coachName) return { type: "coach", id: coachId, name: coachName };
  return { type: "system", id: null, name: "Unknown coach" };
}
