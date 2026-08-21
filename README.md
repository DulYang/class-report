# Class Report

Web app for coaches to record per-student attendance and remarks against a
lesson plan, with a weekly overview and an admin reporting view. Replaces
duplicating paper report cards into spreadsheets.

## The core job

1. **Weekly View** — this week's sessions, grouped by the coach who owns them,
   each with a fill status badge (Empty / Partial / Complete).
2. Click a session → the **report card grid** loads every student at that school
   in that grade, pre-filled with anything already saved, with the lesson plan's
   assessment objectives shown above it as the goal.
3. Set P/A for each session, score assessment and right behaviour 1–4, add
   notes, **Save**.
4. Come back later, change one student's row, save again — values persist.
5. **Reports** shows every saved card read-only, filterable by school.

Coaches do not sign in; the weekly view and grid are open. Admins sign in at
`/login` and own everything else.

## How it fits together

There is no "class". A **school** runs **grades**. A **lesson plan** is a plain
reusable title; a **curriculum** is just that lesson plan paired with one
grade, carrying that grade's **assessment objectives** — the same lesson plan
can pair with several grades, each with different objectives. A school's
**syllabus** schedules a lesson plan onto dates, with no grade of its own —
every grade at that school studies it that day, so a report card is keyed by
(scheduled session, grade). **Students** belong to a school and a grade. A
**coach** is assigned to a (school, grade) and inherits every session
scheduled for it.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React 19, Server Actions) |
| Language | TypeScript strict |
| Styles | Tailwind CSS v4 (CSS-first, no config file) |
| Database | Supabase Postgres (`@supabase/ssr`), permissive RLS in v1 |
| Deploy | Vercel, auto-deployed from `main` |

## Layout

```
lib/types.ts      shared types + fill-status rule
lib/format.ts     timezone-safe date helpers, week windows
lib/data/         every DB read (queries.ts) and write (mutations.ts)
lib/actions/      server actions — validate, call lib/data, revalidate
app/weekly/       weekly view, grouped by coach
app/admin/        schools+grades, coaches, students, curriculum, syllabus
app/reports/      [entryId] = the grid editor; index = read-only table
app/login/        admin sign-in + first-admin bootstrap
components/       nav shell, grid, forms, badges
supabase/migrations/  schema; 0001 is applied — add 0002_* to change it
```

Pages and components never query Supabase inline — everything goes through
`lib/data/`.

## Local development

```bash
npm install
vercel link && vercel env pull .env.local   # Supabase URL + anon key
npm run dev
```

Open http://localhost:3000.

```bash
npm run typecheck   # tsc --noEmit
npm run build       # production build
```

## Deploying

Push to `main` — Vercel builds and deploys from GitHub. Do not deploy with
`vercel --prod` from a local working copy; it desyncs git from the live app.

See [CLAUDE.md](CLAUDE.md) for the full build rules and [docs/](docs) for the
PRD, data model, architecture and sprint plan.
