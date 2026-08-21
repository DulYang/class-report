# Class Report — Architecture

## Stack
Next.js (App Router) + Supabase (Postgres + RLS) + Vercel deploy.

## Responsive Nav Shell
Persistent left sidebar on desktop (sections: Weekly View, Classes, Students, Reports). Collapses to hamburger on mobile. Current section highlighted.

## Key User Action Flow
1. Coach opens Weekly View → sees today's/this week's classes with lesson plans and fill status badges
2. Clicks a lesson plan → report card grid loads all students in that class
3. Fills P/A dropdowns for session 1 and session 2, types assessment/right_behavior/notes per student
4. Clicks Save → persists to DB, status badge updates to "Complete"
5. Returns next day → edits one student's notes → saves → persists

## Build Layers (in order)
1. **Data layer** — Supabase tables, RLS policies (permissive for demo), data-access module (`lib/data/`)
2. **App logic** — server actions for CRUD on classes/lesson_plans/students/report_cards
3. **UI** — weekly view, report card editor grid, management forms
4. **Smart features** — none in v1; deferred entirely

## Core Runs Without AI
v1 has zero AI features. The entire app is direct DB CRUD + grid editor.

## Repo Structure
```
lib/data/        — all DB reads/writes (queries, mutations)
lib/actions/    — server actions (create/update/delete)
lib/types.ts     — shared TypeScript types
app/weekly/      — weekly view page
app/classes/     — class + lesson plan + student management
app/reports/     — report card editor grid
app/layout.tsx   — nav shell
components/      — shared UI (sidebar, grid, form fields)
__tests__/       — tests beside features
```

## Module Map (build order)
1. **data-access** — owns all Supabase queries/mutations; contract: every other module calls `lib/data/` never inline. Built first.
2. **classes** — manages classes, lesson plans, students CRUD. Owns: classes, lesson_plans, students tables.
3. **report-cards** — core engine: grid editor for attendance + remarks per student per lesson plan. Owns: report_cards table. Built second (depends on classes + students).
4. **weekly-view** — aggregates classes by week with fill status. Depends on report-cards. Built third.
5. **nav-shell** — layout/sidebar. Built alongside weekly-view.
6. **auth-lockdown** (later) — login/signup + owner-scoped RLS.
