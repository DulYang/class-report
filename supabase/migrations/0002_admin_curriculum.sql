-- Admin domain: schools (with a PIC), per-school grades, curricula that own
-- lesson plans, assessment objectives per lesson plan, and a per-school
-- syllabus that schedules those lesson plans.
--
-- Scheduling moves off lesson_plans (which become reusable curriculum content)
-- and onto syllabus_entries, so report_cards repoint from lesson_plan_id to
-- syllabus_entry_id. Existing rows are backfilled, never recreated.

-- ── new admin-owned tables ─────────────────────────────────────────────────

create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  pic_name text,
  pic_phone text,
  created_at timestamptz not null default now()
);

create table if not exists grades (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create table if not exists curricula (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  grade_id uuid not null references grades(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (name, grade_id)
);

-- ── backfill schools + grades from the free-text columns on classes ────────

insert into schools (name)
select distinct school from classes
on conflict (name) do nothing;

insert into grades (school_id, name)
select distinct s.id, c.grade
from classes c
join schools s on s.name = c.school
on conflict (school_id, name) do nothing;

-- ── classes point at real schools/grades ──────────────────────────────────

alter table classes add column if not exists school_id uuid references schools(id) on delete restrict;
alter table classes add column if not exists grade_id uuid references grades(id) on delete restrict;

update classes c
set school_id = s.id
from schools s
where s.name = c.school and c.school_id is null;

update classes c
set grade_id = g.id
from grades g
join schools s on s.id = g.school_id
where s.name = c.school and g.name = c.grade and c.grade_id is null;

alter table classes alter column school_id set not null;
alter table classes alter column grade_id set not null;
alter table classes drop column if exists school;
alter table classes drop column if exists grade;

-- ── lesson plans become curriculum content ────────────────────────────────

alter table lesson_plans add column if not exists curriculum_id uuid references curricula(id) on delete cascade;
alter table lesson_plans add column if not exists sort_order integer not null default 0;

-- One starter curriculum per grade that already has lesson plans, so nothing
-- is orphaned by the move.
insert into curricula (name, grade_id)
select distinct g.name || ' Curriculum', g.id
from classes c
join grades g on g.id = c.grade_id
where exists (select 1 from lesson_plans lp where lp.class_id = c.id)
on conflict (name, grade_id) do nothing;

update lesson_plans lp
set curriculum_id = cur.id
from classes c
join grades g on g.id = c.grade_id
join curricula cur on cur.grade_id = g.id and cur.name = g.name || ' Curriculum'
where lp.class_id = c.id and lp.curriculum_id is null;

alter table lesson_plans alter column curriculum_id set not null;

create table if not exists assessment_objectives (
  id uuid primary key default gen_random_uuid(),
  lesson_plan_id uuid not null references lesson_plans(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── syllabus: what a school teaches, and when ─────────────────────────────

create table if not exists syllabus_entries (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  lesson_plan_id uuid not null references lesson_plans(id) on delete cascade,
  session_date1 date not null,
  session_date2 date,
  created_at timestamptz not null default now(),
  unique (school_id, lesson_plan_id, session_date1)
);

insert into syllabus_entries (school_id, lesson_plan_id, session_date1, session_date2)
select c.school_id, lp.id, lp.session_date1, lp.session_date2
from lesson_plans lp
join classes c on c.id = lp.class_id
on conflict (school_id, lesson_plan_id, session_date1) do nothing;

-- ── report cards hang off the scheduled session, not the plan ─────────────

alter table report_cards add column if not exists syllabus_entry_id uuid references syllabus_entries(id) on delete cascade;

update report_cards rc
set syllabus_entry_id = se.id
from lesson_plans lp
join classes c on c.id = lp.class_id
join syllabus_entries se
  on se.lesson_plan_id = lp.id
 and se.school_id = c.school_id
 and se.session_date1 = lp.session_date1
where rc.lesson_plan_id = lp.id and rc.syllabus_entry_id is null;

alter table report_cards alter column syllabus_entry_id set not null;
alter table report_cards drop constraint if exists report_cards_lesson_plan_id_student_id_key;
alter table report_cards drop column if exists lesson_plan_id;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'report_cards_entry_student_key'
  ) then
    alter table report_cards
      add constraint report_cards_entry_student_key unique (syllabus_entry_id, student_id);
  end if;
end $$;

-- Scheduling now lives on syllabus_entries only.
alter table lesson_plans drop column if exists class_id;
alter table lesson_plans drop column if exists session_date1;
alter table lesson_plans drop column if exists session_date2;

create index if not exists syllabus_entries_school_date_idx on syllabus_entries (school_id, session_date1);
create index if not exists lesson_plans_curriculum_idx on lesson_plans (curriculum_id);
create index if not exists assessment_objectives_plan_idx on assessment_objectives (lesson_plan_id, sort_order);
