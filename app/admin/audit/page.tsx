import Link from "next/link";
import { getAuditLog } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  let entries;
  try {
    entries = await getAuditLog();
  } catch (err) {
    return (
      <div
        role="alert"
        className="rounded-lg border border-red-300 bg-red-50 p-6 text-red-900"
      >
        <p className="font-semibold">Could not load the audit log</p>
        <p className="mt-1 text-sm">
          {err instanceof Error ? err.message : "Unknown database error"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin" className="text-sm text-neutral-500 hover:text-neutral-900">
          ← Admin
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-sm text-neutral-600">
          Every admin change and every report card save, newest first. Coach
          names on report card entries are self-reported from the weekly
          view&apos;s picker, not a verified login.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-600">
          Nothing logged yet.
        </p>
      ) : (
        <>
        {/* Mobile: stack each entry instead of scrolling a 4-column table. */}
        <div className="space-y-3 md:hidden">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="space-y-1.5 rounded-lg border border-neutral-200 bg-white p-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{entry.actor_name}</span>
                <ActorTag type={entry.actor_type} />
              </div>
              <p className="text-neutral-700">{entry.summary}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                <span className="font-mono">{entry.action}</span>
                <span aria-hidden>·</span>
                <span>
                  {new Date(entry.created_at).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden overflow-x-auto rounded-lg border border-neutral-200 bg-white md:block">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-semibold">When</th>
                <th className="px-3 py-2 font-semibold">Who</th>
                <th className="px-3 py-2 font-semibold">Action</th>
                <th className="px-3 py-2 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-neutral-200">
                  <td className="whitespace-nowrap px-3 py-2 text-neutral-500">
                    {new Date(entry.created_at).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-medium">{entry.actor_name}</span>{" "}
                    <ActorTag type={entry.actor_type} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-neutral-600">
                    {entry.action}
                  </td>
                  <td className="px-3 py-2 text-neutral-700">{entry.summary}</td>
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

function ActorTag({ type }: { type: "admin" | "coach" | "system" }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
        type === "admin"
          ? "bg-indigo-100 text-indigo-800"
          : type === "coach"
            ? "bg-emerald-100 text-emerald-800"
            : "bg-neutral-100 text-neutral-600"
      }`}
    >
      {type}
    </span>
  );
}
