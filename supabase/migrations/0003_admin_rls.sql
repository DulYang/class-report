-- Admin-only writes for the admin domain.
--
-- Coaches do not log in yet (v1 stays demo-first), so the coach-facing tables
-- — classes, students, report_cards — keep permissive policies. Everything an
-- admin owns is readable by anyone (the coach app has to render it) but
-- writable only by a signed-in admin.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.coaches
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- True until the very first admin links an auth account. Lets the one-time
-- bootstrap on /login create that first admin, then closes itself forever.
create or replace function public.admin_bootstrap_open()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select not exists (
    select 1 from public.coaches
    where role = 'admin' and user_id is not null
  );
$$;

alter table schools enable row level security;
alter table grades enable row level security;
alter table curricula enable row level security;
alter table assessment_objectives enable row level security;
alter table syllabus_entries enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'schools', 'grades', 'curricula', 'assessment_objectives',
    'syllabus_entries', 'lesson_plans'
  ]
  loop
    execute format('drop policy if exists %I on %I', t || '_read', t);
    execute format('create policy %I on %I for select using (true)', t || '_read', t);

    execute format('drop policy if exists %I on %I', t || '_v1_read', t);
    execute format('drop policy if exists %I on %I', t || '_v1_write', t);

    execute format('drop policy if exists %I on %I', t || '_admin_write', t);
    execute format(
      'create policy %I on %I for all using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_write', t
    );
  end loop;
end $$;

-- coaches: readable by all (the class form needs the picker), writable by an
-- admin — or by anyone while no admin exists, so the first one can be created.
drop policy if exists "coaches_v1_read" on coaches;
drop policy if exists "coaches_v1_write" on coaches;
drop policy if exists "coaches_read" on coaches;
drop policy if exists "coaches_admin_write" on coaches;
drop policy if exists "coaches_bootstrap_insert" on coaches;

create policy "coaches_read" on coaches for select using (true);
create policy "coaches_admin_write" on coaches for all
  using (public.is_admin()) with check (public.is_admin());
create policy "coaches_bootstrap_insert" on coaches for insert
  with check (public.admin_bootstrap_open());
