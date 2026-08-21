create table if not exists coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  role text not null default 'coach',
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid,
  name text not null,
  school text not null,
  grade text not null,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists lesson_plans (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  title text not null,
  session_date1 date not null,
  session_date2 date not null,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  name text not null,
  user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists report_cards (
  id uuid primary key default gen_random_uuid(),
  lesson_plan_id uuid not null references lesson_plans(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  attendance_session1 text not null default 'P',
  attendance_session2 text not null default 'P',
  assessment text,
  right_behavior text,
  notes text,
  user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_plan_id, student_id)
);

alter table coaches enable row level security;
alter table classes enable row level security;
alter table lesson_plans enable row level security;
alter table students enable row level security;
alter table report_cards enable row level security;

drop policy if exists "coaches_v1_read" on coaches;
create policy "coaches_v1_read" on coaches for select using (true);
drop policy if exists "coaches_v1_write" on coaches;
create policy "coaches_v1_write" on coaches for all using (true) with check (true);

drop policy if exists "classes_v1_read" on classes;
create policy "classes_v1_read" on classes for select using (true);
drop policy if exists "classes_v1_write" on classes;
create policy "classes_v1_write" on classes for all using (true) with check (true);

drop policy if exists "lesson_plans_v1_read" on lesson_plans;
create policy "lesson_plans_v1_read" on lesson_plans for select using (true);
drop policy if exists "lesson_plans_v1_write" on lesson_plans;
create policy "lesson_plans_v1_write" on lesson_plans for all using (true) with check (true);

drop policy if exists "students_v1_read" on students;
create policy "students_v1_read" on students for select using (true);
drop policy if exists "students_v1_write" on students;
create policy "students_v1_write" on students for all using (true) with check (true);

drop policy if exists "report_cards_v1_read" on report_cards;
create policy "report_cards_v1_read" on report_cards for select using (true);
drop policy if exists "report_cards_v1_write" on report_cards;
create policy "report_cards_v1_write" on report_cards for all using (true) with check (true);

insert into coaches (id, name, email, role) values
  ('a0000000-0000-4000-8000-000000000001', 'Coach Sarah Mitchell', 'sarah@school.edu', 'coach'),
  ('a0000000-0000-4000-8000-000000000002', 'Coach David Kim', 'david@school.edu', 'coach'),
  ('a0000000-0000-4000-8000-000000000003', 'Admin Lisa Park', 'lisa@school.edu', 'admin')
on conflict (email) do nothing;

insert into classes (id, coach_id, name, school, grade) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Tuesday Basketball', 'Riverside Elementary', 'Grade 5'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Thursday Soccer', 'Riverside Elementary', 'Grade 4'),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000002', 'Monday Volleyball', 'Lincoln Middle School', 'Grade 7')
on conflict (id) do nothing;

insert into lesson_plans (id, class_id, title, session_date1, session_date2) values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Passing & Dribbling Drills', current_date, current_date + interval '2 days'),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000002', 'Shooting Technique', current_date - interval '1 day', current_date + interval '1 day'),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000003', 'Serving Practice', current_date, current_date + interval '3 days')
on conflict (id) do nothing;

insert into students (id, class_id, name) values
  ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Emma Johnson'),
  ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Noah Williams'),
  ('d0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'Olivia Brown'),
  ('d0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', 'Liam Davis'),
  ('d0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000002', 'Ava Martinez'),
  ('d0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000002', 'Ethan Garcia'),
  ('d0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000003', 'Sophia Lee'),
  ('d0000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000003', 'Mason Taylor')
on conflict (id) do nothing;

insert into report_cards (lesson_plan_id, student_id, attendance_session1, attendance_session2, assessment, right_behavior, notes) values
  ('c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'P', 'P', 'Good passing accuracy', 'Helped teammate with drill', 'Improving consistently'),
  ('c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002', 'P', 'A', 'Needs work on left-hand dribble', 'Distracted during instructions', ''),
  ('c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000003', 'P', 'P', 'Excellent court awareness', 'Led warm-up unprompted', 'Ready for advanced drills'),
  ('c0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000005', 'P', 'P', 'Strong shooting form', 'Encouraged peers', ''),
  ('c0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000007', 'P', 'P', 'Consistent serves', 'Positive attitude', 'Work on serve placement')
on conflict (lesson_plan_id, student_id) do nothing;