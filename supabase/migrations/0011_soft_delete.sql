-- Schools, grades, lesson plans, students, and syllabus entries stop being
-- hard-deleted. "Delete" in the app becomes an archive (deleted_at set)
-- instead of a SQL DELETE, so every FK chain underneath — down to
-- report_cards and session_notes — keeps resolving names instead of being
-- destroyed by ON DELETE CASCADE.
--
-- coach_assignments, school_grades, and curricula (which still cascades to
-- assessment_objectives) are NOT soft-deleted: nothing in report_cards
-- points at them, so hard-deleting them loses no historical fact. The app
-- now deletes them explicitly as part of the same archive action, since the
-- parent row is no longer actually deleted and the CASCADE FK never fires.

alter table schools add column if not exists deleted_at timestamptz;
alter table grades add column if not exists deleted_at timestamptz;
alter table lesson_plans add column if not exists deleted_at timestamptz;
alter table students add column if not exists deleted_at timestamptz;
alter table syllabus_entries add column if not exists deleted_at timestamptz;

-- An archived row still occupies its old name/slot under a plain UNIQUE
-- constraint, permanently blocking reuse. Scope uniqueness to active rows.

alter table schools drop constraint if exists schools_name_key;
create unique index if not exists schools_name_active_key
  on schools (name) where deleted_at is null;

alter table grades drop constraint if exists grades_name_key;
create unique index if not exists grades_name_active_key
  on grades (name) where deleted_at is null;

alter table syllabus_entries
  drop constraint if exists syllabus_entries_school_id_lesson_plan_id_session_date1_key;
create unique index if not exists syllabus_entries_active_key
  on syllabus_entries (school_id, lesson_plan_id, session_date1)
  where deleted_at is null;
