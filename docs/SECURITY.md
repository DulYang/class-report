# Class Report — Security

## v1 (Demo-First)
- No auth wall. All tables have permissive RLS for anonymous read/write so the app renders with seed data.
- No secrets in frontend. Supabase anon key is public-safe; service key only in server actions/edge functions.
- RLS enabled on all tables with permissive policies.

## Lockdown (later sprint, before real users)
- Login/signup via Supabase Auth
- **Coaches**: RLS scoped to `classes.user_id = auth.uid()` — can only see/edit their own classes, lesson plans, students, and report cards
- **Admins**: role-based policy granting full read across all classes; write to classes/lesson_plans/students
- Report cards: editable by the owning coach or any admin
- Service key never exposed to client; all mutations go through server actions

## Approved-Tools Rule
- Only named server actions may mutate data. No raw SQL passthrough from client.
- No `run_any` / `send_any` patterns. Every mutation is a specific, named function.

## Audit Principle
- Every create/update/delete on report_cards logs actor, timestamp, before/after (implemented at lockdown)
- v1 relies on Supabase default timestamps (`created_at`, `updated_at`)

## Honesty Note
RLS owner-scoping and role separation need real testing with multiple auth users before going live. If the builder is unsure, stop and get human help on RLS policy testing.
