import type { AssessmentObjective } from "@/lib/types";

/**
 * The goal for the class, straight from the curriculum. Read-only here —
 * objectives are created and edited by admins only.
 */
export default function ObjectivesPanel({
  objectives,
}: {
  objectives: AssessmentObjective[];
}) {
  if (objectives.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Assessment objectives
        </p>
        <p className="mt-1 text-sm text-neutral-500">
          None set for this lesson plan — ask an admin to add them.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
        Assessment objectives — the goal for this class
      </p>
      <ol className="mt-2 space-y-1.5">
        {objectives.map((objective, index) => (
          <li key={objective.id} className="flex gap-2 text-sm">
            <span className="font-semibold tabular-nums text-indigo-700">
              {index + 1}.
            </span>
            <span>
              <span className="font-medium text-indigo-950">
                {objective.title}
              </span>
              {objective.description && (
                <span className="text-indigo-800"> — {objective.description}</span>
              )}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
