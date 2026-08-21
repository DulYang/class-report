import Link from "next/link";
import GradeForm from "@/components/forms/GradeForm";
import GradeRow from "@/components/GradeRow";
import { getGrades } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function AdminGradesPage() {
  let grades;
  try {
    grades = await getGrades();
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load grades</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Admin
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Grades</h1>
        <p className="text-sm text-neutral-600">
          A shared catalog — &ldquo;Grade 5&rdquo; is one row used by every
          school. Pick which grades a school actually runs on that{" "}
          <Link href="/admin/schools" className="font-medium underline">
            school&apos;s page
          </Link>
          .
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">New grade</h2>
        <GradeForm />
      </section>

      {grades.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
          No grades yet — create the first one above.
        </p>
      ) : (
        <div className="rounded-lg border border-neutral-200 bg-white">
          <ul className="divide-y divide-neutral-100">
            {grades.map((grade) => (
              <GradeRow key={grade.id} grade={grade} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
