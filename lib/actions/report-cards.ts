"use server";

import { revalidatePath } from "next/cache";
import { saveReportCards, type ReportCardInput } from "@/lib/data/mutations";
import type { ActionResult, Attendance } from "@/lib/types";

function toAttendance(value: unknown): Attendance {
  return value === "A" ? "A" : "P";
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Core engine write: persist the whole grid for one scheduled lesson. */
export async function saveReportCardGrid(
  syllabusEntryId: string,
  rows: ReportCardInput[],
): Promise<ActionResult> {
  if (!syllabusEntryId) return { ok: false, error: "Missing scheduled lesson." };
  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: false, error: "There are no students to save." };
  }

  const clean: ReportCardInput[] = rows
    .filter((r) => typeof r?.student_id === "string" && r.student_id.length > 0)
    .map((r) => ({
      student_id: r.student_id,
      attendance_session1: toAttendance(r.attendance_session1),
      attendance_session2: toAttendance(r.attendance_session2),
      assessment: toText(r.assessment),
      right_behavior: toText(r.right_behavior),
      notes: toText(r.notes),
    }));

  if (clean.length === 0) return { ok: false, error: "No valid rows to save." };

  try {
    await saveReportCards(syllabusEntryId, clean);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not save report cards.",
    };
  }

  revalidatePath("/");
  revalidatePath("/weekly");
  revalidatePath("/reports", "layout");
  return { ok: true };
}
