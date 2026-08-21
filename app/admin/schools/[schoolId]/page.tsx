import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteButton from "@/components/DeleteButton";
import CoachAssignmentForm from "@/components/forms/CoachAssignmentForm";
import OfferGradeForm from "@/components/forms/OfferGradeForm";
import SchoolForm from "@/components/forms/SchoolForm";
import { unassignCoachAction } from "@/lib/actions/coach-assignments";
import { deleteSchoolAction, removeSchoolGradeAction } from "@/lib/actions/schools";
import {
  getCoachAssignments,
  getCoaches,
  getGrades,
  getSchool,
  getSchoolGrades,
} from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function AdminSchoolDetail({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;

  let school;
  let grades;
  let schoolGradeRows;
  let coaches;
  let assignmentRows;
  try {
    [school, grades, schoolGradeRows, coaches, assignmentRows] =
      await Promise.all([
        getSchool(schoolId),
        getGrades(),
        getSchoolGrades(),
        getCoaches(),
        getCoachAssignments(),
      ]);
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load this school</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  if (!school) notFound();

  const gradeById = new Map(grades.map((g) => [g.id, g]));
  const offeredHere = schoolGradeRows
    .filter((sg) => sg.school_id === school.id)
    .flatMap((sg) => {
      const grade = gradeById.get(sg.grade_id);
      return grade ? [{ schoolGrade: sg, grade }] : [];
    })
    .sort((a, b) => a.grade.name.localeCompare(b.grade.name));
  const offeredGradeIds = new Set(offeredHere.map((o) => o.grade.id));
  const availableGrades = grades.filter((g) => !offeredGradeIds.has(g.id));
  const schoolGrades = offeredHere.map((o) => o.grade);

  const coachById = new Map(coaches.map((c) => [c.id, c]));
  const assigned = assignmentRows
    .filter((a) => a.school_id === school.id)
    .flatMap((a) => {
      const coach = coachById.get(a.coach_id);
      const grade = gradeById.get(a.grade_id);
      return coach && grade ? [{ assignment: a, coach, grade }] : [];
    })
    .sort(
      (a, b) =>
        a.coach.name.localeCompare(b.coach.name) ||
        a.grade.name.localeCompare(b.grade.name),
    );

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <Link
          href="/admin/schools"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Schools & Grades
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{school.name}</h1>
        <p className="text-sm text-neutral-600">
          PIC {school.pic_name || "not set"}
          {school.pic_phone ? ` · ${school.pic_phone}` : ""}
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">School details</h2>
        <SchoolForm initial={school} />
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <DeleteButton
            action={deleteSchoolAction}
            hidden={{ id: school.id }}
            label="Delete this school"
            confirmMessage={`Delete "${school.name}"? Its syllabus, students, coach assignments and every report card underneath will be deleted. Its grades are not affected — they belong to the global catalog.`}
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="font-semibold">
            Grades offered here{" "}
            <span className="text-sm font-normal text-neutral-500">
              ({offeredHere.length})
            </span>
          </h2>
          <p className="text-xs text-neutral-500">
            Grades are a shared catalog across every school — pick which ones
            this school runs. Manage the catalog itself on the{" "}
            <Link href="/admin/grades" className="font-medium underline">
              Grades
            </Link>{" "}
            page.
          </p>
        </div>

        {offeredHere.length === 0 ? (
          <p className="px-4 py-4 text-sm text-neutral-500">
            No grades offered yet. Offer the grades this school runs so
            curricula and students can target them.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {offeredHere.map(({ schoolGrade, grade }) => (
              <li
                key={schoolGrade.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
              >
                <span className="font-medium">{grade.name}</span>
                <DeleteButton
                  action={removeSchoolGradeAction}
                  hidden={{ id: schoolGrade.id, school_id: school.id }}
                  label="Remove"
                  confirmMessage={`Stop offering ${grade.name} at ${school.name}? Existing coach assignments and students in that grade here are not removed, but new ones won't be able to pick it.`}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-neutral-200 bg-neutral-50 p-4">
          <h3 className="mb-3 text-sm font-semibold">Offer a grade</h3>
          <OfferGradeForm schoolId={school.id} gradeOptions={availableGrades} />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="font-semibold">
            Coaches assigned{" "}
            <span className="text-sm font-normal text-neutral-500">
              ({assigned.length})
            </span>
          </h2>
          <p className="text-xs text-neutral-500">
            A coach is assigned to a grade, and inherits every session
            scheduled for it.
          </p>
        </div>

        {assigned.length === 0 ? (
          <p className="px-4 py-4 text-sm text-neutral-500">
            No coaches assigned yet — sessions scheduled here will show up
            under &ldquo;No coach assigned&rdquo; in the weekly view.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {assigned.map(({ assignment, coach, grade }) => (
              <li
                key={assignment.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
              >
                <div>
                  <span className="font-medium">{coach.name}</span>
                  <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                    {grade.name}
                  </span>
                  <span className="ml-2 text-xs text-neutral-500">
                    {coach.email || "No email"}
                  </span>
                </div>
                <DeleteButton
                  action={unassignCoachAction}
                  hidden={{ id: assignment.id, school_id: school.id }}
                  label="Unassign"
                  confirmMessage={`Unassign ${coach.name} from ${grade.name} at ${school.name}? Those sessions will no longer appear in their weekly view.`}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-neutral-200 bg-neutral-50 p-4">
          <h3 className="mb-3 text-sm font-semibold">Assign a coach</h3>
          <CoachAssignmentForm
            schoolId={school.id}
            coaches={coaches}
            grades={schoolGrades}
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="font-semibold">Next steps</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Build a{" "}
          <Link href="/admin/curriculum" className="font-medium underline">
            curriculum
          </Link>{" "}
          for a grade, then schedule its lesson plans on this school&apos;s{" "}
          <Link
            href={`/admin/syllabus/${school.id}`}
            className="font-medium underline"
          >
            syllabus
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
