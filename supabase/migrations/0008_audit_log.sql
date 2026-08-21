-- Every mutating action gets recorded: who did it, what they did, and to what.
--
-- Coaches don't sign in, so a coach actor is only ever self-reported — they
-- pick their name from a dropdown before reaching a report card. That is not
-- a security boundary (report_cards writes are already open to anyone with
-- the URL); it just gives the audit trail a name instead of "unknown" for the
-- common case. Admin actions are attributed automatically from the session.

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_type text not null check (actor_type in ('admin', 'coach', 'system')),
  actor_id uuid,
  actor_name text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;

-- Insert must be open: coach report-card saves are anonymous, and admin
-- actions are already gated by their own server-side adminGuard check before
-- they ever reach this table.
drop policy if exists "audit_log_insert" on audit_log;
create policy "audit_log_insert" on audit_log for insert with check (true);

-- The trail itself is admin-only to read, and there is no update/delete
-- policy at all — the log is append-only.
drop policy if exists "audit_log_admin_read" on audit_log;
create policy "audit_log_admin_read" on audit_log for select
  using (private.is_admin());

create index if not exists audit_log_created_at_idx on audit_log (created_at desc);
