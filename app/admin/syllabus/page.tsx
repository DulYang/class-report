import Link from "next/link";
import { getSchools } from "@/lib/data/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSyllabusIndex() {
  let schools;
  let counts = new Map<string, number>();
  try {
    schools = await getSchools();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("syllabus_entries")
      .select("school_id");
    if (error) throw new Error(error.message);
    for (const row of (data ?? []) as { school_id: string }[]) {
      counts.set(row.school_id, (counts.get(row.school_id) ?? 0) + 1);
    }
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load the syllabus list</p>
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
        <h1 className="text-2xl font-bold tracking-tight">Syllabus</h1>
        <p className="text-sm text-neutral-600">
          Each school has its own syllabus: which lesson plans get taught, and
          on what dates. Coaches fill report cards against these.
        </p>
      </header>

      {schools.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
          No schools yet —{" "}
          <Link href="/admin/schools" className="font-medium underline">
            add one first
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-3">
          {schools.map((school) => (
            <Link
              key={school.id}
              href={`/admin/syllabus/${school.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 hover:border-neutral-400"
            >
              <div>
                <p className="font-semibold">{school.name}</p>
                <p className="text-xs text-neutral-500">
                  {counts.get(school.id) ?? 0} scheduled session
                  {(counts.get(school.id) ?? 0) === 1 ? "" : "s"}
                  {school.pic_name ? ` · PIC ${school.pic_name}` : ""}
                </p>
              </div>
              <span className="text-sm font-medium text-neutral-600">
                Open →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
