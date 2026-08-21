"use client";

import { useState } from "react";
import DeleteButton from "@/components/DeleteButton";
import LessonPlanForm from "@/components/forms/LessonPlanForm";
import ObjectiveForm from "@/components/forms/ObjectiveForm";
import {
  deleteLessonPlanAction,
  deleteObjectiveAction,
} from "@/lib/actions/curriculum";
import type { AssessmentObjective, LessonPlan } from "@/lib/types";

type Props = {
  plan: LessonPlan & { objectives: AssessmentObjective[] };
  curriculumId: string;
};

export default function CurriculumPlanRow({ plan, curriculumId }: Props) {
  const [editingPlan, setEditingPlan] = useState(false);
  const [editingObjective, setEditingObjective] = useState<string | null>(null);

  const nextSort =
    plan.objectives.reduce((max, o) => Math.max(max, o.sort_order), -1) + 1;

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            <span className="mr-2 text-xs text-neutral-400 tabular-nums">
              #{plan.sort_order}
            </span>
            {plan.title}
          </p>
          <p className="text-xs text-neutral-500">
            {plan.objectives.length} assessment objective
            {plan.objectives.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditingPlan((v) => !v)}
            className="rounded-md border border-neutral-300 px-2.5 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {editingPlan ? "Cancel" : "Edit"}
          </button>
          <DeleteButton
            action={deleteLessonPlanAction}
            hidden={{ id: plan.id, curriculum_id: curriculumId }}
            confirmMessage={`Delete "${plan.title}"? Its objectives and every scheduled session using it — including saved report cards — will be deleted.`}
          />
        </div>
      </div>

      {editingPlan && (
        <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <LessonPlanForm curriculumId={curriculumId} initial={plan} />
        </div>
      )}

      <div className="mt-3 rounded-md border border-neutral-200">
        <p className="border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Assessment objectives
        </p>

        {plan.objectives.length === 0 ? (
          <p className="px-3 py-2.5 text-sm text-neutral-500">
            None yet — coaches will see no goal on this report card.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {plan.objectives.map((objective) => (
              <li key={objective.id} className="px-3 py-2.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{objective.title}</p>
                    {objective.description && (
                      <p className="text-xs text-neutral-500">
                        {objective.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingObjective((id) =>
                          id === objective.id ? null : objective.id,
                        )
                      }
                      className="rounded-md border border-neutral-300 px-2 py-0.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      {editingObjective === objective.id ? "Cancel" : "Edit"}
                    </button>
                    <DeleteButton
                      action={deleteObjectiveAction}
                      hidden={{ id: objective.id, curriculum_id: curriculumId }}
                      label="Remove"
                      confirmMessage={`Remove the objective "${objective.title}"?`}
                      className="rounded-md border border-red-300 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    />
                  </div>
                </div>

                {editingObjective === objective.id && (
                  <div className="mt-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
                    <ObjectiveForm
                      lessonPlanId={plan.id}
                      curriculumId={curriculumId}
                      initial={objective}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-neutral-200 bg-neutral-50 p-3">
          <ObjectiveForm
            lessonPlanId={plan.id}
            curriculumId={curriculumId}
            nextSortOrder={nextSort}
          />
        </div>
      </div>
    </li>
  );
}
