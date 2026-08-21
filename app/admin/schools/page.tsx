import Link from "next/link";
import SchoolForm from "@/components/forms/SchoolForm";
import { getSchoolGrades, getSchools } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function AdminSchoolsPage() {
  let schools;
  let schoolGrades;
  try {
    [schools, schoolGrades] = await Promise.all([
      getSchools(),
      getSchoolGrades(),
    ]);
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load schools</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  const gradeCount = new Map<string, number>();
  for (const sg of schoolGrades) {
    gradeCount.set(sg.school_id, (gradeCount.get(sg.school_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Admin
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Schools & Grades</h1>
        <p className="text-sm text-neutral-600">
          {schools.length} school{schools.length === 1 ? "" : "s"}. Open one to
          edit its person in charge and pick which grades it offers.
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">New school</h2>
        <SchoolForm />
      </section>

      {schools.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
          No schools yet — create the first one above.
        </p>
      ) : (
        <>
        {/* Mobile: each school as a tappable card rather than a wide table. */}
        <div className="space-y-3 md:hidden">
          {schools.map((school) => (
            <Link
              key={school.id}
              href={`/admin/schools/${school.id}`}
              className="block space-y-1 rounded-lg border border-neutral-200 bg-white p-3 text-sm transition-colors hover:border-neutral-400"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{school.name}</span>
                <span className="shrink-0 text-xs text-neutral-500">
                  {gradeCount.get(school.id) ?? 0} grade
                  {(gradeCount.get(school.id) ?? 0) === 1 ? "" : "s"}
                </span>
              </div>
              <p className="text-xs text-neutral-600">
                PIC{" "}
                {school.pic_name || <span className="text-amber-600">not set</span>}
                {" · "}
                {school.pic_phone || (
                  <span className="text-amber-600">no phone</span>
                )}
              </p>
            </Link>
          ))}
        </div>

        <div className="hidden overflow-x-auto rounded-lg border border-neutral-200 bg-white md:block">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-semibold">School</th>
                <th className="px-3 py-2 font-semibold">PIC name</th>
                <th className="px-3 py-2 font-semibold">PIC phone</th>
                <th className="px-3 py-2 font-semibold">Grades</th>
                <th className="px-3 py-2 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => (
                <tr key={school.id} className="border-t border-neutral-200">
                  <td className="px-3 py-2 font-medium">
                    <Link
                      href={`/admin/schools/${school.id}`}
                      className="hover:underline"
                    >
                      {school.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
                    {school.pic_name || (
                      <span className="text-amber-600">Not set</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-neutral-700">
                    {school.pic_phone || (
                      <span className="text-amber-600">Not set</span>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-neutral-700">
                    {gradeCount.get(school.id) ?? 0}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/admin/schools/${school.id}`}
                      className="inline-block rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium hover:bg-neutral-50"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
