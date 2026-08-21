# Class Report — Tasks & Sprints

## Sprint 1 — Data + Core Engine (no login wall)
**Goal**: DB schema, data-access layer, report card editor working end-to-end with seed data.

- [ ] Create Supabase tables + permissive RLS + seed data (migration SQL)
- [ ] Build `lib/data/` — queries/mutations for all tables
- [ ] Build `lib/types.ts` — shared types
- [ ] Build report card editor grid: select lesson plan → load students → fill attendance (2 sessions P/A) + assessment + right_behavior + notes → save → persist
- [ ] Edit existing report card → values pre-fill → save updates
- [ ] Five states: loading (skeleton), empty (no students — prompt to add), partial (some students filled), error (DB error toast), ready (grid full)

**DoD**: Open the app → pick a seeded lesson plan → fill a report card for all students → save → refresh page → values persist.

## Sprint 2 — Weekly View + Management (v1 functional milestone)
**Goal**: Weekly class list + CRUD for classes/lesson_plans/students. App is fully usable.

- [ ] Weekly view: classes for current week with lesson plans + fill status badges (Complete/Partial/Empty)
- [ ] Class CRUD: create/edit/delete class (name, coach, school, grade)
- [ ] Lesson plan CRUD: create/edit/delete (title, two session dates)
- [ ] Student CRUD: add/remove/rename students in a class
- [ ] Nav shell: sidebar desktop, hamburger mobile, active section highlight
- [ ] Admin read-only view of all report cards

**DoD**: The success scenario works: coach sees weekly view → opens lesson plan → fills report → returns → edits → persists. Admin sees all classes.

## Sprint 3 — Lock It Down (auth + RLS)
**Goal**: Real users can log in; data is owner-scoped.

- [ ] Supabase Auth: login/signup pages
- [ ] RLS policies rewritten: coaches see own classes; admins see all
- [ ] `user_id` populated on create
- [ ] Role assignment (coach vs admin)
- [ ] Audit log for report card edits
- [ ] Test with 2 separate auth users (coach + admin)

**DoD**: Coach A cannot see/edit Coach B's classes. Admin sees everything.

## Sprint 4 — Polish + Reporting
**Goal**: Export, filters, completion reminders.

- [ ] CSV export of report cards per class/week
- [ ] Filter weekly view by coach/school/grade
- [ ] Dashboard: completion rate per coach (admin view)
- [ ] Empty-state guidance for new coaches

**DoD**: Admin exports a week's report cards as CSV and opens in spreadsheet.

## Gantt
```
Sprint 1: DB + report card editor      ████
Sprint 2: Weekly view + CRUD + nav       ████  ← v1 functional
Sprint 3: Auth + RLS lockdown                 ████
Sprint 4: Export + reporting                       ████
```
