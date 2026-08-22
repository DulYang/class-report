-- Notes move off the individual student and onto the class session: one
-- shared note per (syllabus entry, grade), not one per student per session.
-- It can be written on the first class and edited again on the second.

create table if not exists session_notes (
  id uuid primary key default gen_random_uuid(),
  syllabus_entry_id uuid not null references syllabus_entries(id) on delete cascade,
  grade_id uuid not null references grades(id) on delete cascade,
  notes text not null default '',
  updated_at timestamptz not null default now(),
  unique (syllabus_entry_id, grade_id)
);

-- Same openness as report_cards: coaches fill this in without signing in.
alter table session_notes enable row level security;

drop policy if exists "session_notes_read" on session_notes;
create policy "session_notes_read" on session_notes for select using (true);

drop policy if exists "session_notes_write" on session_notes;
create policy "session_notes_write" on session_notes for all
  using (true) with check (true);

create index if not exists session_notes_entry_grade_idx
  on session_notes (syllabus_entry_id, grade_id);

alter table report_cards drop column if exists notes;
