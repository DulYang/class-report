import Link from "next/link";
import CoachRow from "@/components/CoachRow";
import CoachForm from "@/components/forms/CoachForm";
import { requireAdmin } from "@/lib/auth";
import { getCoachAssignments, getCoaches } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function AdminCoachesPage() {
  const admin = await requireAdmin();

  let coaches;
  let assignments;
  try {
    [coaches, assignments] = await Promise.all([
      getCoaches(),
      getCoachAssignments(),
    ]);
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load coaches</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  const gradeCount = new Map<string, number>();
  for (const a of assignments) {
    gradeCount.set(a.coach_id, (gradeCount.get(a.coach_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <header>
        <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Admin
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Coaches</h1>
        <p className="text-sm text-neutral-600">
          {coaches.length} record{coaches.length === 1 ? "" : "s"}. Coaches do
          not sign in — only admins do.
        </p>
      </header>

      <section className="rounded-lg border border-neutral-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">New coach</h2>
        <CoachForm />
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-4 py-3">
          <h2 className="font-semibold">All coaches</h2>
        </div>
        {coaches.length === 0 ? (
          <p className="px-4 py-4 text-sm text-neutral-500">
            No coaches yet — add the first one above.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {coaches.map((coach) => (
              <CoachRow
                key={coach.id}
                coach={coach}
                gradeCount={gradeCount.get(coach.id) ?? 0}
                isYou={coach.id === admin.id}
              />
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-neutral-500">
        Marking someone an admin here records the role, but it does not create a
        login for them — that needs a Supabase service-role key on the server,
        which this project does not have yet.
      </p>
    </div>
  );
}
