-- Grades stop belonging to a school. "Grade 5" becomes one global row instead
-- of one row per school. Which grades a school actually runs is now an
-- explicit admin-managed join (school_grades), mirroring coach_assignments,
-- so a grade can still be "offered" at a school (and a coach pre-assigned to
-- it) before any student is enrolled.

-- ── backfill the join before the column it's derived from disappears ───────

create table if not exists school_grades (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  grade_id uuid not null references grades(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (school_id, grade_id)
);

insert into school_grades (school_id, grade_id)
select school_id, id from grades
on conflict (school_id, grade_id) do nothing;

create index if not exists school_grades_school_idx on school_grades (school_id);
create index if not exists school_grades_grade_idx on school_grades (grade_id);

-- ── grades: drop duplicate rows before the name can be made globally unique ─

-- Two schools' "Grade 5" are now the same catalog entry. Keep the oldest row
-- per name, repoint every FK at it, then drop the rest.
do $$
begin
  create temporary table grade_dupes as
  select g.id as dupe_id, keep.id as keep_id
  from grades g
  join (
    select distinct on (name) id, name
    from grades
    order by name, created_at, id
  ) keep on keep.name = g.name and keep.id <> g.id;

  update curricula c set grade_id = d.keep_id
    from grade_dupes d where c.grade_id = d.dupe_id;
  update students s set grade_id = d.keep_id
    from grade_dupes d where s.grade_id = d.dupe_id;
  update coach_assignments ca set grade_id = d.keep_id
    from grade_dupes d where ca.grade_id = d.dupe_id;
  -- coach_assignments' unique (coach_id, school_id, grade_id) may now collide.
  delete from coach_assignments ca using coach_assignments ca2
    where ca.grade_id = ca2.grade_id
      and ca.school_id = ca2.school_id
      and ca.coach_id = ca2.coach_id
      and ca.id > ca2.id;
  -- curricula's unique (lesson_plan_id, grade_id) may now collide too.
  delete from curricula c using curricula c2
    where c.grade_id = c2.grade_id
      and c.lesson_plan_id = c2.lesson_plan_id
      and c.id > c2.id;

  insert into school_grades (school_id, grade_id)
  select g.school_id, d.keep_id
  from grades g join grade_dupes d on d.dupe_id = g.id
  on conflict (school_id, grade_id) do nothing;

  delete from grades where id in (select dupe_id from grade_dupes);
  drop table grade_dupes;
end $$;

-- ── grades: drop the school scoping ─────────────────────────────────────────

alter table grades drop constraint if exists grades_school_id_fkey;
alter table grades drop constraint if exists grades_school_id_name_key;
alter table grades drop column if exists school_id;
alter table grades add constraint grades_name_key unique (name);

-- ── RLS: same shape as coach_assignments — open read, admin-only write ──────

alter table school_grades enable row level security;

drop policy if exists "school_grades_read" on school_grades;
create policy "school_grades_read" on school_grades for select using (true);

drop policy if exists "school_grades_admin_write" on school_grades;
create policy "school_grades_admin_write" on school_grades for all
  using (private.is_admin()) with check (private.is_admin());
