"use server";

import { revalidatePath } from "next/cache";
import { logAudit, reportCardActor } from "@/lib/audit";
import {
  saveReportCards,
  saveSessionNotes,
  type ReportCardInput,
} from "@/lib/data/mutations";
import { toScore, type ActionResult, type Attendance } from "@/lib/types";

function toAttendance(value: unknown): Attendance {
  return value === "A" ? "A" : "P";
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Core engine write: persist the whole grid for one (syllabus entry, grade).
 * The coach identity is self-reported from the weekly view's picker, not a
 * verified login — see lib/audit.ts. An admin editing directly is attributed
 * automatically instead.
 */
export async function saveReportCardGrid(
  syllabusEntryId: string,
  gradeId: string,
  rows: ReportCardInput[],
  notes: string,
  coach?: { id: string | null; name: string | null },
): Promise<ActionResult> {
  if (!syllabusEntryId) return { ok: false, error: "Missing scheduled lesson." };
  if (!gradeId) return { ok: false, error: "Missing grade." };
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: "There are no students to save." };
  }

  const clean: ReportCardInput[] = rows
    .filter((r) => typeof r?.student_id === "string" && r.student_id.length > 0)
    .map((r) => ({
      student_id: r.student_id,
      attendance_session1: toAttendance(r.attendance_session1),
      attendance_session2: toAttendance(r.attendance_session2),
      assessment: toScore(r.assessment),
      right_behavior: toScore(r.right_behavior),
    }));

  if (clean.length === 0) return { ok: false, error: "No valid rows to save." };

  try {
    await saveReportCards(syllabusEntryId, clean);
    await saveSessionNotes({
      syllabus_entry_id: syllabusEntryId,
      grade_id: gradeId,
      notes: toText(notes),
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not save report cards.",
    };
  }

  const actor = await reportCardActor(coach?.id ?? null, coach?.name ?? null);
  await logAudit({
    actor,
    action: "report_card.save",
    entityType: "syllabus_entry",
    entityId: syllabusEntryId,
    summary: `Saved report cards for ${clean.length} student${clean.length === 1 ? "" : "s"}`,
  });

  revalidatePath("/");
  revalidatePath("/weekly");
  revalidatePath("/reports", "layout");
  return { ok: true };
}
