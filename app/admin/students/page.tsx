import Link from "next/link";
import StudentForm from "@/components/forms/StudentForm";
import StudentRow from "@/components/StudentRow";
import { getGrades, getRoster, getSchoolGrades, getSchools } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  let roster;
  let schools;
  let grades;
  let schoolGrades;
  try {
    [roster, schools, grades, schoolGrades] = await Promise.all([
      getRoster(),
      getSchools(),
      getGrades(),
      getSchoolGrades(),
    ]);
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load students</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  // Grouped by school, then grade — the same shape a report card covers.
  const gradeById = new Map(grades.map((g) => [g.id, g]));
  const groups = schools.map((school) => ({
    school,
    gradeGroups: schoolGrades
      .filter((sg) => sg.school_id === school.id)
      .flatMap((sg) => {
        const grade = gradeById.get(sg.grade_id);
        return grade ? [grade] : [];
      })
      .map((grade) => ({
        grade,
        students: roster.filter(
          (r) =>
            r.student.school_id === school.id && r.student.grade_id === grade.id,
        ),
      }))
      .filter((g) => g.students.length > 0),
  }));

  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Admin
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Students</h1>
        <p className="text-sm text-neutral-600">
          {roster.length} student{roster.length === 1 ? "" : "s"}. A student
          belongs to a school and a grade; coaches see the roster on a report
          card but cannot change it.
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Add a student</h2>
        {schools.length === 0 ? (
          <p className="text-sm text-neutral-600">
            Create a school and a grade first —{" "}
            <Link href="/admin/schools" className="font-medium underline">
              Schools &amp; Grades
            </Link>
            .
          </p>
        ) : (
          <StudentForm schools={schools} grades={grades} schoolGrades={schoolGrades} />
        )}
      </section>

      {roster.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
          No students yet.
        </p>
      ) : (
        <div className="space-y-6">
          {groups
            .filter((g) => g.gradeGroups.length > 0)
            .map(({ school, gradeGroups }) => (
              <section key={school.id} className="space-y-2">
                <h2 className="px-1 text-lg font-bold tracking-tight">
                  {school.name}
                </h2>
                {gradeGroups.map(({ grade, students }) => (
                  <div
                    key={grade.id}
                    className="rounded-lg border border-neutral-200 bg-white"
                  >
                    <div className="border-b border-neutral-200 px-4 py-2.5">
                      <p className="font-semibold">{grade.name}</p>
                      <p className="text-xs text-neutral-500">
                        {students.length} student
                        {students.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <ul className="divide-y divide-neutral-100">
                      {students.map(({ student }) => (
                        <StudentRow
                          key={student.id}
                          student={student}
                          schools={schools}
                          grades={grades}
                          schoolGrades={schoolGrades}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
