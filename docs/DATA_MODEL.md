# Class Report — Data Model

Migrations `0002`–`0007` built the admin domain, removed classes, and then
reshaped curriculum. A student belongs to a **school and a grade**; a coach is
assigned to a (school, grade) pair and inherits every session scheduled for it.
There is no class.

**Curriculum is a lesson plan paired with a grade — nothing else.** A
`lesson_plan` is a plain, reusable, grade-agnostic title. `curricula` is the
join of one `lesson_plan` with one `grade`; the same lesson plan can pair with
several grades, each with its own `assessment_objectives`. A syllabus entry
schedules a lesson plan at a school on given dates — with **no grade** — so
every grade at that school studies it that day. A report card is therefore
keyed by (syllabus entry, grade), not just the entry.

## Admin-owned

### schools
| field | type |
|---|---|
| id | uuid pk |
| name | text not null unique |
| pic_name | text — person in charge |
| pic_phone | text |
| created_at | timestamptz default now() |

### grades
| field | type |
|---|---|
| id | uuid pk |
| school_id | uuid not null → schools.id |
| name | text not null |
| created_at | timestamptz default now() |

**Unique**: (school_id, name). Grades belong to a school, so "Grade 5" at two
schools is two rows.

### lesson_plans
| field | type |
|---|---|
| id | uuid pk |
| title | text not null |
| created_at | timestamptz default now() |

A plain, reusable catalog entry — no grade, no dates, no owner.

### curricula
| field | type |
|---|---|
| id | uuid pk |
| lesson_plan_id | uuid not null → lesson_plans.id |
| grade_id | uuid not null → grades.id |
| created_at | timestamptz default now() |

**Unique**: (lesson_plan_id, grade_id). This pairing *is* the curriculum — no
separate name. The same lesson plan can pair with several grades.

### assessment_objectives
| field | type |
|---|---|
| id | uuid pk |
| curriculum_id | uuid not null → curricula.id |
| title | text not null |
| description | text |
| sort_order | integer not null default 0 |
| created_at | timestamptz default now() |

Tied to the (lesson_plan, grade) pairing, so the same lesson plan carries
different objectives per grade. Coaches see these read-only on the report card
as the goal for that grade.

### coach_assignments
| field | type |
|---|---|
| id | uuid pk |
| coach_id | uuid not null → coaches.id |
| school_id | uuid not null → schools.id |
| grade_id | uuid not null → grades.id |
| created_at | timestamptz default now() |

**Unique**: (coach_id, school_id, grade_id). A coach owns a grade at a school
and inherits every session scheduled for it — this is what decides whose weekly
view a session lands in. Admin-only. A grade may have more than one coach; the
session then shows under each of them.

### syllabus_entries
| field | type |
|---|---|
| id | uuid pk |
| school_id | uuid not null → schools.id |
| lesson_plan_id | uuid not null → lesson_plans.id |
| session_date1 | date not null |
| session_date2 | date (nullable — a session may be single) |
| created_at | timestamptz default now() |

**Unique**: (school_id, lesson_plan_id, session_date1). No grade column —
scheduling a lesson plan means every grade at that school studies it that day.

## Coach-facing

### coaches
| field | type |
|---|---|
| id | uuid pk |
| name | text not null |
| email | text unique |
| role | text default 'coach' ('coach' or 'admin') |
| user_id | uuid nullable → auth.users.id |
| created_at | timestamptz default now() |

Only admins sign in; `user_id` is null for coaches.

### students
| field | type |
|---|---|
| id | uuid pk |
| school_id | uuid not null → schools.id |
| grade_id | uuid not null → grades.id |
| name | text not null |
| created_at | timestamptz default now() |

A student is tied to a school and a grade, never to a class.

### report_cards
| field | type |
|---|---|
| id | uuid pk |
| syllabus_entry_id | uuid not null → syllabus_entries.id |
| student_id | uuid not null → students.id |
| attendance_session1 | text default 'P' (P or A) |
| attendance_session2 | text default 'P' (P or A) |
| assessment | integer not null default 1, check 1–4 |
| right_behavior | integer not null default 1, check 1–4 |
| notes | text |
| created_at / updated_at | timestamptz default now() |

**Unique**: (syllabus_entry_id, student_id) — one card per student per
scheduled session. Assessment and right behaviour are scores from 1 to 4,
defaulting to 1; the database rejects anything outside that range.

## Relationships
```
lesson_plans *—* grades via curricula ;  curricula 1—* assessment_objectives
schools 1—* syllabus_entries *—1 lesson_plans (no grade — applies to all)
schools 1—* students *—1 grades
coaches *—* (school, grade) via coach_assignments
syllabus_entries × grades 1—* report_cards *—1 students
```

**Who is on a report card**: a syllabus entry names a school and a lesson plan
only. The report card route is `/reports/[entryId]/[gradeId]` — one card set
per (entry, grade) — and covers every student at that school in that grade.
Objectives for that card come from the curriculum pairing of (the entry's
lesson plan, that grade), if one exists; if the plan has never been paired with
that grade, the objectives panel is simply empty.

**Whose weekly view it appears in**: any coach with a `coach_assignments` row
for that (school, grade). Sessions with no assigned coach are still listed,
under "No coach assigned", so they are never hidden.

## RLS
- **Read**: open on every table — the coach app has no login.
- **Write**: `report_cards` is open — that is the coach's job and they do not
  sign in. `schools`, `grades`, `curricula`, `lesson_plans`,
  `assessment_objectives`, `syllabus_entries`, `coaches`, `coach_assignments`
  and `students` all require `private.is_admin()`. RLS is defined per table, so
  reshaping curriculum's columns in 0007 needed no policy changes — verified
  live: anon `INSERT` into `lesson_plans` and `curricula` still returns 42501.
- **Bootstrap**: `coaches` also allows an insert while
  `private.admin_bootstrap_open()` is true — i.e. until the first admin links an
  auth account. It closes permanently after that.
- Both helpers live in the unexposed `private` schema so PostgREST does not
  publish them as RPCs.

## Still open
Coaches have no per-user scoping — anyone with the URL can open the weekly view
and edit any report card. Everything else is admin-only, so that is the last
piece of the lockdown before real student data.

No AI-generated fields.
