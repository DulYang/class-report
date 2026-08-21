-- Curriculum stops being a named container that owns lesson plans for one
-- grade. Instead: lesson_plans is a plain reusable catalog (title only), and
-- curricula becomes the (lesson_plan, grade) pairing itself — the same lesson
-- plan can be paired with several grades, each with its own objectives.
--
-- Syllabus entries drop their implicit grade: scheduling a lesson plan at a
-- school on a date means every grade at that school studies it that day. A
-- report card is therefore keyed by (syllabus entry, grade), not just the
-- entry — each grade has its own roster and its own objectives for that plan.

-- ── curricula becomes (lesson_plan, grade), not (name, grade) ─────────────

alter table curricula add column if not exists lesson_plan_id uuid references lesson_plans(id) on delete cascade;

-- Old data was already one lesson_plan per curriculum, confirmed 1:1 — carry
-- that pairing forward directly, no fan-out needed.
update curricula c
set lesson_plan_id = lp.id
from lesson_plans lp
where lp.curriculum_id = c.id and c.lesson_plan_id is null;

alter table curricula alter column lesson_plan_id set not null;
alter table curricula drop constraint if exists curricula_name_grade_id_key;
alter table curricula drop column if exists name;

alter table curricula
  add constraint curricula_lesson_plan_grade_key unique (lesson_plan_id, grade_id);

-- ── objectives hang off the (lesson_plan, grade) pairing ──────────────────

alter table assessment_objectives add column if not exists curriculum_id uuid references curricula(id) on delete cascade;

update assessment_objectives ao
set curriculum_id = cur.id
from lesson_plans lp
join curricula cur on cur.lesson_plan_id = lp.id
where ao.lesson_plan_id = lp.id and ao.curriculum_id is null;

alter table assessment_objectives alter column curriculum_id set not null;
alter table assessment_objectives drop column if exists lesson_plan_id;

-- ── lesson_plans becomes a plain catalog: no grade, no sort position ──────

alter table lesson_plans drop column if exists curriculum_id;
alter table lesson_plans drop column if exists sort_order;

-- syllabus_entries never had a grade column — the grade was always derived
-- via lesson_plan → curriculum → grade. With curricula now allowing a lesson
-- plan to pair with several grades, that derivation simply resolves to "every
-- grade this plan is paired with" instead of exactly one. No schema change
-- needed here; only the read queries change.

create index if not exists curricula_lesson_plan_idx on curricula (lesson_plan_id);
create index if not exists assessment_objectives_curriculum_idx on assessment_objectives (curriculum_id, sort_order);
