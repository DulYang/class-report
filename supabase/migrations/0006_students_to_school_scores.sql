-- Classes disappear. A student belongs to a school and a grade; a coach is
-- assigned to a (school, grade) pair and inherits the sessions scheduled for
-- it. Assessment and right behaviour become a 1–4 score, defaulting to 1.
--
-- The pre-migration rows are snapshotted in the pre0006 schema — in particular
-- the free-text assessment/right_behavior values, which cannot be mapped onto
-- 1–4 and are replaced with the default.

-- ── students belong to a school + grade ───────────────────────────────────

alter table students add column if not exists school_id uuid references schools(id) on delete cascade;
alter table students add column if not exists grade_id uuid references grades(id) on delete cascade;

update students s
set school_id = c.school_id, grade_id = c.grade_id
from classes c
where c.id = s.class_id and s.school_id is null;

alter table students alter column school_id set not null;
alter table students alter column grade_id set not null;
alter table students drop column if exists class_id;

create index if not exists students_school_grade_idx on students (school_id, grade_id);

-- ── coach assignment gains the grade ─────────────────────────────────────

alter table coach_schools drop constraint if exists coach_schools_coach_id_school_id_key;
alter table coach_schools add column if not exists grade_id uuid references grades(id) on delete cascade;

-- Attribute each existing assignment to the grades that coach actually taught.
-- An assignment with no matching class expands to every grade at that school so
-- nothing silently disappears.
create temporary table cs_rebuilt as
  select distinct cs.coach_id, cs.school_id, c.grade_id
  from coach_schools cs
  join classes c on c.coach_id = cs.coach_id and c.school_id = cs.school_id
  union
  select distinct cs.coach_id, cs.school_id, g.id
  from coach_schools cs
  join grades g on g.school_id = cs.school_id
  where not exists (
    select 1 from classes c
    where c.coach_id = cs.coach_id and c.school_id = cs.school_id
  );

delete from coach_schools;
alter table coach_schools alter column grade_id set not null;

insert into coach_schools (coach_id, school_id, grade_id)
select coach_id, school_id, grade_id from cs_rebuilt;

drop table cs_rebuilt;

alter table coach_schools
  add constraint coach_schools_coach_school_grade_key
  unique (coach_id, school_id, grade_id);

-- The name no longer describes it: assignments are per grade now.
alter table coach_schools rename to coach_assignments;

create index if not exists coach_assignments_school_grade_idx
  on coach_assignments (school_id, grade_id);

-- ── classes are gone ─────────────────────────────────────────────────────

drop table if exists classes cascade;

-- ── assessment + right behaviour become 1–4 scores ───────────────────────

alter table report_cards drop column if exists assessment;
alter table report_cards drop column if exists right_behavior;

alter table report_cards
  add column assessment integer not null default 1,
  add column right_behavior integer not null default 1;

alter table report_cards
  add constraint report_cards_assessment_range check (assessment between 1 and 4),
  add constraint report_cards_right_behavior_range check (right_behavior between 1 and 4);
