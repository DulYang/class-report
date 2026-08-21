# Class Report

Web app for coaches to record per-student attendance and remarks against a
lesson plan, with a weekly overview and an admin reporting view. Replaces
duplicating paper report cards into spreadsheets.

## The core job

1. **Weekly View** — this week's classes, each with its lesson plans and a fill
   status badge (Empty / Partial / Complete).
2. Click a lesson plan → the **report card grid** loads every student in that
   class, pre-filled with anything already saved.
3. Set P/A for both sessions, type assessment / right behaviour / notes, **Save**.
4. Come back later, change one student's notes, save again — values persist.
5. **Reports** shows every saved card read-only for admins, filterable by class.

There is no login wall in v1 — the app opens straight onto real data.

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
app/weekly/       weekly view
app/classes/      class, lesson plan and student management
app/reports/      [lessonPlanId] = the grid editor; index = admin table
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
