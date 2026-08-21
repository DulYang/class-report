-- Admins now own the roster and the coach-to-school assignment.
--
-- 1. coach_schools records which coaches work at which school. Only an admin
--    can create one, so a class can never introduce a new pairing — the class
--    form only offers coaches already assigned to the chosen school.
-- 2. students become admin-only for writes. Coaches read the roster on the
--    report card grid but can no longer add, rename or remove anyone.

create table if not exists coach_schools (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references coaches(id) on delete cascade,
  school_id uuid not null references schools(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (coach_id, school_id)
);

-- Every coach already teaching at a school keeps that assignment.
insert into coach_schools (coach_id, school_id)
select distinct c.coach_id, c.school_id
from classes c
where c.coach_id is not null
on conflict (coach_id, school_id) do nothing;

alter table coach_schools enable row level security;

drop policy if exists "coach_schools_read" on coach_schools;
create policy "coach_schools_read" on coach_schools for select using (true);

drop policy if exists "coach_schools_admin_write" on coach_schools;
create policy "coach_schools_admin_write" on coach_schools for all
  using (private.is_admin()) with check (private.is_admin());

-- students: readable by anyone (the grid needs the roster), admin-only writes.
drop policy if exists "students_v1_read" on students;
drop policy if exists "students_v1_write" on students;
drop policy if exists "students_read" on students;
drop policy if exists "students_admin_write" on students;

create policy "students_read" on students for select using (true);
create policy "students_admin_write" on students for all
  using (private.is_admin()) with check (private.is_admin());

create index if not exists coach_schools_school_idx on coach_schools (school_id);
