# Class Report — Security

## Where we are now

**Admins sign in; coaches do not.** Supabase Auth (email + password) gates the
whole `/admin` section. The coach-facing screens — weekly view, classes,
students, report card grid — stay open so the app remains demoable.

### Two layers, not one
1. `app/admin/layout.tsx` calls `requireAdmin()`, redirecting anyone without an
   admin session to `/login`. Every admin server action re-checks with
   `adminGuard()`.
2. RLS enforces the same rule in the database, so a forged request that skips
   the UI still fails. Verified against the live project: anonymous `INSERT`
   into `schools`, `grades`, `curricula`, `lesson_plans`,
   `assessment_objectives`, `syllabus_entries`, `coach_assignments` and `students`
   all return `42501 new row violates row-level security policy`, while
   `SELECT` returns 200. Anonymous `UPDATE`/`DELETE` on `students` affect zero
   rows — RLS removes them from the statement's visible set, so PostgREST
   reports success while changing nothing (confirmed with
   `Prefer: return=representation`, which returns `[]`).

### Coach assignment
`coach_assignments` pairs a coach with a (school, grade) and only an admin can
write it. It decides whose weekly view a session appears in. Classes are gone,
so there is no longer an anon-writable table that references a coach — the rule
is pure RLS now.

### Admin identity
An admin is an `auth.users` row whose `coaches` record has
`role = 'admin'` and a matching `user_id`. `private.is_admin()` is the single
definition, used by every write policy.

### First-admin bootstrap
`/login` shows a one-time "set up the first admin" form while
`private.admin_bootstrap_open()` is true — that is, until some admin record has
a `user_id`. The matching RLS policy on `coaches` allows exactly that one
insert. Once the first admin exists, both the form and the policy close
permanently; further admins are added from the Coaches page.

This is a deliberate, self-closing hole: before the first admin there is no one
who could authorize the first admin.

### Helper functions are not public API
`is_admin()` and `admin_bootstrap_open()` are `SECURITY DEFINER` with
`search_path = public, pg_temp`, and live in the `private` schema. PostgREST
only exposes `public`, so they are not reachable at `/rest/v1/rpc/...`.
Revoking `EXECUTE` instead would break the policies, since RLS expressions are
evaluated as the querying role. Supabase's security advisor reports no findings.

## Not done yet — do not put real student data in this
- **Coaches are not scoped.** The weekly view and the report card grid are open
  to anyone with the URL, and any visitor can save any report card. Everything
  else is admin-only. Locking this down means giving coaches logins and scoping
  `report_cards` to the coach assigned to that session's (school, grade), with
  admins seeing everything.
- **Audit log is in place** (`audit_log`, migration 0008) — every admin
  mutation and every report card save is recorded with actor, action, entity
  and a summary. Insert is open (coaches don't sign in, so their saves are
  anonymous writes like report_cards itself); read is admin-only, verified
  live: anon `SELECT` returns `[]`, anon `INSERT` returns 201. The coach name
  attached to a report-card save is self-reported from a dropdown on the
  weekly view, not a verified identity — an admin editing the same page is
  attributed automatically instead, and is always preferred when both are
  possible.
- **Adding an admin login** for someone else needs a `SUPABASE_SERVICE_ROLE_KEY`
  on the server; marking a coach as "admin" today records the role but creates
  no account.
- RLS role separation needs testing with two real auth users before go-live. If
  unsure, get human help on RLS policy testing.

## Always
- Service-role keys never reach frontend code. The browser only ever sees
  `NEXT_PUBLIC_SUPABASE_URL` and the anon key.
