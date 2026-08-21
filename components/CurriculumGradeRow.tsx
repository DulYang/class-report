"use client";

import { useState } from "react";
import DeleteButton from "@/components/DeleteButton";
import ObjectiveForm from "@/components/forms/ObjectiveForm";
import { unpairGradeAction, deleteObjectiveAction } from "@/lib/actions/curriculum";
import type { AssessmentObjective, Curriculum, Grade } from "@/lib/types";

type Props = {
  lessonPlanId: string;
  curriculum: Curriculum;
  grade: Grade | null;
  objectives: AssessmentObjective[];
};

/** One grade this lesson plan is paired with, and that grade's objectives. */
export default function CurriculumGradeRow({
  lessonPlanId,
  curriculum,
  grade,
  objectives,
}: Props) {
  const [editingObjective, setEditingObjective] = useState<string | null>(null);

  const nextSort =
    objectives.reduce((max, o) => Math.max(max, o.sort_order), -1) + 1;

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{grade?.name ?? "Unknown grade"}</p>
          <p className="text-xs text-neutral-500">
            {objectives.length} assessment objective
            {objectives.length === 1 ? "" : "s"}
          </p>
        </div>
        <DeleteButton
          action={unpairGradeAction}
          hidden={{ id: curriculum.id, lesson_plan_id: lessonPlanId }}
          label="Unpair"
          confirmMessage={`Remove this pairing with ${grade?.name ?? "this grade"}? Its objectives will be deleted too.`}
        />
      </div>

      <div className="mt-3 rounded-md border border-neutral-200">
        <p className="border-b border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Assessment objectives
        </p>

        {objectives.length === 0 ? (
          <p className="px-3 py-2.5 text-sm text-neutral-500">
            None yet — coaches will see no goal for this grade.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {objectives.map((objective) => (
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
                      hidden={{ id: objective.id, lesson_plan_id: lessonPlanId }}
                      label="Remove"
                      confirmMessage={`Remove the objective "${objective.title}"?`}
                      className="rounded-md border border-red-300 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                    />
                  </div>
                </div>

                {editingObjective === objective.id && (
                  <div className="mt-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
                    <ObjectiveForm
                      lessonPlanId={lessonPlanId}
                      curriculumId={curriculum.id}
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
            lessonPlanId={lessonPlanId}
            curriculumId={curriculum.id}
            nextSortOrder={nextSort}
          />
        </div>
      </div>
    </li>
  );
}
