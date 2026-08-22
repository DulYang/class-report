"use client";

import { useMemo, useState, useTransition } from "react";
import {
  bulkImportStudentsAction,
  type BulkImportRow,
  type BulkImportRowResult,
} from "@/lib/actions/students";
import { parseCsv } from "@/lib/csv";
import type { Grade, School, SchoolGrade } from "@/lib/types";

type PreviewRow = {
  row: number;
  name: string;
  school: string;
  grade: string;
  valid: boolean;
  reason?: string;
};

/**
 * CSV bulk import: name, school, grade. School and grade — and the fact that
 * the grade is actually offered at that school — are checked against the
 * live catalog and shown row by row before anything is imported.
 */
export default function BulkImportStudents({
  schools,
  grades,
  schoolGrades,
}: {
  schools: School[];
  grades: Grade[];
  schoolGrades: SchoolGrade[];
}) {
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [imported, setImported] = useState<BulkImportRowResult[] | null>(null);
  const [pending, startTransition] = useTransition();

  const schoolByName = useMemo(
    () => new Map(schools.map((s) => [s.name.trim().toLowerCase(), s])),
    [schools],
  );
  const gradeByName = useMemo(
    () => new Map(grades.map((g) => [g.name.trim().toLowerCase(), g])),
    [grades],
  );
  const offeredPairs = useMemo(
    () => new Set(schoolGrades.map((sg) => `${sg.school_id}:${sg.grade_id}`)),
    [schoolGrades],
  );

  function validateRow(
    name: string,
    school: string,
    grade: string,
  ): { valid: boolean; reason?: string } {
    if (!name) return { valid: false, reason: "Missing student name." };
    if (!school) return { valid: false, reason: "Missing school." };
    if (!grade) return { valid: false, reason: "Missing grade." };

    const s = schoolByName.get(school.toLowerCase());
    if (!s) return { valid: false, reason: `Unknown school "${school}".` };

    const g = gradeByName.get(grade.toLowerCase());
    if (!g) return { valid: false, reason: `Unknown grade "${grade}".` };

    if (!offeredPairs.has(`${s.id}:${g.id}`)) {
      return { valid: false, reason: `${g.name} is not offered at ${s.name}.` };
    }
    return { valid: true };
  }

  function handleFile(file: File) {
    setFileName(file.name);
    setImported(null);
    setResultError(null);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsv(String(reader.result ?? ""));
      if (rows.length === 0) {
        setParseError("That file is empty.");
        setPreview([]);
        return;
      }

      // A "name,school,grade" header row is optional — skip it if present.
      let dataRows = rows;
      const first = rows[0].map((c) => c.trim().toLowerCase());
      if (first[0] === "name" && first[1] === "school" && first[2] === "grade") {
        dataRows = rows.slice(1);
      }

      if (dataRows.length === 0) {
        setParseError("No student rows found below the header.");
        setPreview([]);
        return;
      }

      setPreview(
        dataRows.map((cols, i) => {
          const name = (cols[0] ?? "").trim();
          const school = (cols[1] ?? "").trim();
          const grade = (cols[2] ?? "").trim();
          const { valid, reason } = validateRow(name, school, grade);
          return { row: i + 1, name, school, grade, valid, reason };
        }),
      );
    };
    reader.onerror = () => setParseError("Could not read that file.");
    reader.readAsText(file);
  }

  function doImport() {
    setResultError(null);
    const validRows: BulkImportRow[] = preview
      .filter((r) => r.valid)
      .map((r) => ({ name: r.name, school: r.school, grade: r.grade }));

    startTransition(async () => {
      const result = await bulkImportStudentsAction(validRows);
      if (!result.ok) {
        setResultError(result.error);
        return;
      }
      setImported(result.results);
      setPreview([]);
      setFileName(null);
    });
  }

  const validCount = preview.filter((r) => r.valid).length;
  const importedCount =
    imported?.filter((r) => r.status === "imported").length ?? 0;
  const importedSkipped = imported?.filter((r) => r.status === "skipped") ?? [];

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="min-h-11 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
      >
        {open ? "Close bulk import" : "Bulk import"}
      </button>

      {open && (
        <div className="mt-3 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div>
            <p className="text-sm font-semibold">Import students from CSV</p>
            <p className="text-xs text-neutral-500">
              Three columns, in order: name, school, grade. A header row is
              optional. The school and grade must already exist, and the
              grade must be offered at that school — checked below before
              anything is imported.
            </p>
          </div>

          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="block w-full text-sm text-neutral-700 file:mr-3 file:min-h-11 file:rounded-md file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-neutral-50"
          />

          {parseError && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {parseError}
            </p>
          )}

          {preview.length > 0 && (
            <>
              <p className="text-sm text-neutral-700">
                {fileName ? `${fileName} — ` : ""}
                {validCount} of {preview.length} row
                {preview.length === 1 ? "" : "s"} ready to import.
              </p>

              <div className="max-h-72 overflow-auto rounded-md border border-neutral-200 bg-white">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead className="sticky top-0 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th className="px-2 py-1.5 font-semibold">#</th>
                      <th className="px-2 py-1.5 font-semibold">Name</th>
                      <th className="px-2 py-1.5 font-semibold">School</th>
                      <th className="px-2 py-1.5 font-semibold">Grade</th>
                      <th className="px-2 py-1.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r) => (
                      <tr key={r.row} className="border-t border-neutral-100">
                        <td className="px-2 py-1.5 text-neutral-500">{r.row}</td>
                        <td className="px-2 py-1.5">{r.name || "—"}</td>
                        <td className="px-2 py-1.5">{r.school || "—"}</td>
                        <td className="px-2 py-1.5">{r.grade || "—"}</td>
                        <td className="px-2 py-1.5">
                          {r.valid ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                              Ready
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                              {r.reason}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={doImport}
                disabled={pending || validCount === 0}
                className="min-h-11 rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                {pending
                  ? "Importing…"
                  : `Import ${validCount} student${validCount === 1 ? "" : "s"}`}
              </button>
            </>
          )}

          {resultError && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {resultError}
            </p>
          )}

          {imported && (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
              <p className="font-semibold">
                Imported {importedCount} student{importedCount === 1 ? "" : "s"}.
              </p>
              {importedSkipped.length > 0 && (
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-emerald-800">
                  {importedSkipped.map((r) => (
                    <li key={r.row}>
                      Row {r.row} ({r.name || "no name"}): {r.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
