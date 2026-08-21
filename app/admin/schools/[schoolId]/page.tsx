import Link from "next/link";
import { notFound } from "next/navigation";
import DeleteButton from "@/components/DeleteButton";
import CoachAssignmentForm from "@/components/forms/CoachAssignmentForm";
import GradeForm from "@/components/forms/GradeForm";
import SchoolForm from "@/components/forms/SchoolForm";
import GradeRow from "@/components/GradeRow";
import { unassignCoachAction } from "@/lib/actions/coach-schools";
import { deleteSchoolAction } from "@/lib/actions/schools";
import {
  getCoachSchools,
  getCoaches,
  getGrades,
  getSchool,
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
  let coaches;
  let coachSchools;
  try {
    [school, grades, coaches, coachSchools] = await Promise.all([
      getSchool(schoolId),
      getGrades(),
      getCoaches(),
      getCoachSchools(),
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
  const schoolGrades = grades.filter((g) => g.school_id === school.id);

  const assignedHere = coachSchools.filter((cs) => cs.school_id === school.id);
  const coachById = new Map(coaches.map((c) => [c.id, c]));
  const assigned = assignedHere.flatMap((cs) => {
    const coach = coachById.get(cs.coach_id);
    return coach ? [{ assignment: cs, coach }] : [];
  });
  const assignedIds = new Set(assigned.map((a) => a.coach.id));
  const available = coaches.filter((c) => !assignedIds.has(c.id));

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
            confirmMessage={`Delete "${school.name}"? Its grades, curricula, syllabus and every report card underneath will be deleted.`}
          />
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="font-semibold">
            Grades{" "}
            <span className="text-sm font-normal text-neutral-500">
              ({schoolGrades.length})
            </span>
          </h2>
        </div>

        {schoolGrades.length === 0 ? (
          <p className="px-4 py-4 text-sm text-neutral-500">
            No grades yet. Add the grades this school runs so curricula can
            target them.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {schoolGrades.map((grade) => (
              <GradeRow key={grade.id} grade={grade} />
            ))}
          </ul>
        )}

        <div className="border-t border-neutral-200 bg-neutral-50 p-4">
          <h3 className="mb-3 text-sm font-semibold">Add a grade</h3>
          <GradeForm schoolId={school.id} />
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
            Only these coaches can be put on a class at this school.
          </p>
        </div>

        {assigned.length === 0 ? (
          <p className="px-4 py-4 text-sm text-neutral-500">
            No coaches assigned yet — no class can be created here until one is.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {assigned.map(({ assignment, coach }) => (
              <li
                key={assignment.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
              >
                <div>
                  <span className="font-medium">{coach.name}</span>
                  <span className="ml-2 text-xs text-neutral-500">
                    {coach.email || "No email"}
                  </span>
                </div>
                <DeleteButton
                  action={unassignCoachAction}
                  hidden={{ id: assignment.id, school_id: school.id }}
                  label="Unassign"
                  confirmMessage={`Unassign ${coach.name} from ${school.name}? Existing classes keep them, but no new class here can pick them.`}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-neutral-200 bg-neutral-50 p-4">
          <h3 className="mb-3 text-sm font-semibold">Assign a coach</h3>
          <CoachAssignmentForm schoolId={school.id} available={available} />
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
