# Class Report — Data Model

Migrations `0002`–`0007` built the admin domain, removed classes, and then
reshaped curriculum. Migration `0009` then disassociated grades from schools.
Migration `0011` made `schools`, `grades`, `lesson_plans`, `students`, and
`syllabus_entries` soft-delete (see **Soft delete** below). A student belongs
to a **school and a grade**; a coach is assigned to a (school, grade) pair and
inherits every session scheduled for it. There is no class.

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
| name | text not null |
| pic_name | text — person in charge |
| pic_phone | text |
| created_at | timestamptz default now() |
| deleted_at | timestamptz nullable — soft delete |

**Unique**: (name) while `deleted_at is null` — archiving frees the name for reuse.

### grades
| field | type |
|---|---|
| id | uuid pk |
| name | text not null |
| created_at | timestamptz default now() |
| deleted_at | timestamptz nullable — soft delete |

**Unique**: (name) while `deleted_at is null`. A global catalog — "Grade 5" is
one row, shared by every school. A grade has no relationship to a school on
its own; see `school_grades` for which schools actually run it.

### school_grades
| field | type |
|---|---|
| id | uuid pk |
| school_id | uuid not null → schools.id |
| grade_id | uuid not null → grades.id |
| created_at | timestamptz default now() |

**Unique**: (school_id, grade_id). Admin-managed: which grades a school
offers, independent of enrollment — a grade can be offered (and a coach
pre-assigned to it) before any student exists there. This is what
`syllabus_entries` fans out over to produce one report-card session per grade
per school, and what the students/coach-assignment pickers filter to.

### lesson_plans
| field | type |
|---|---|
| id | uuid pk |
| title | text not null |
| created_at | timestamptz default now() |
| deleted_at | timestamptz nullable — soft delete |

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
| deleted_at | timestamptz nullable — soft delete |

**Unique**: (school_id, lesson_plan_id, session_date1) while `deleted_at is
null`. No grade column — scheduling a lesson plan means every grade that
school *offers* (via `school_grades`) studies it that day.

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
| deleted_at | timestamptz nullable — soft delete |

A student is tied to a school and a grade, never to a class.

### report_cards
| field | type |
|---|---|
| id | uuid pk |
| syllabus_entry_id | uuid not null → syllabus_entries.id |
| student_id | uuid not null → students.id |
| grade_id | uuid not null → grades.id |
| attendance_session1 | text default 'P' (P or A) |
| attendance_session2 | text default 'P' (P or A) |
| assessment | integer not null default 1, check 1–4 |
| right_behavior | integer not null default 1, check 1–4 |
| created_at / updated_at | timestamptz default now() |

**Unique**: (syllabus_entry_id, student_id) — one card per student per
scheduled session. Assessment and right behaviour are scores from 1 to 4,
defaulting to 1; the database rejects anything outside that range.
`grade_id` is frozen at save time to the grade the student was actually in —
it is **not** re-derived from the student's current grade, so promoting a
student to a new grade never rewrites their past report cards. There is no
per-student `notes` column; see `session_notes` below.

### session_notes
| field | type |
|---|---|
| id | uuid pk |
| syllabus_entry_id | uuid not null → syllabus_entries.id |
| grade_id | uuid not null → grades.id |
| notes | text not null default '' |
| updated_at | timestamptz default now() |

**Unique**: (syllabus_entry_id, grade_id) — one shared note for the whole
class session, not per student. Written on the first class, editable again on
the second. Open write, same as `report_cards`.

## Relationships
```
lesson_plans *—* grades via curricula ;  curricula 1—* assessment_objectives
schools *—* grades via school_grades (which grades a school offers)
schools 1—* syllabus_entries *—1 lesson_plans (no grade — fans out over school_grades)
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

## Soft delete
`schools`, `grades`, `lesson_plans`, `students`, and `syllabus_entries` are
never hard-deleted by the app — "delete" sets `deleted_at` instead, so every
FK chain underneath (down to `report_cards` and `session_notes`) keeps
resolving names instead of being wiped out by `ON DELETE CASCADE`. Deleting
one of these cascades the same archive to whatever it used to cascade-delete:
a school archives its syllabus entries and students; a grade archives its
students; a lesson plan archives its syllabus entries.

`coach_assignments`, `school_grades`, and `curricula` (→ `assessment_objectives`
via its own `ON DELETE CASCADE`) are **not** soft-deleted — nothing in
`report_cards` points at them, so they're hard-deleted as part of the same
archive action (the app does this explicitly now, since the parent row is no
longer actually deleted and the CASCADE FK never fires).

Every "active" list/picker query filters `deleted_at is null`
(`lib/data/queries.ts`'s `activeAll` helper). By-id lookups
(`getSchool`, `getGrade`, `getLessonPlan`) and the admin Reports queries
(`getSchoolsIncludingDeleted` etc.) stay unfiltered on purpose, so a report
card whose school/grade/plan/entry was later archived still shows the real
name instead of "Unknown."

There is no restore/undelete UI yet — archiving is one-directional for now.

## RLS
- **Read**: open on every table — the coach app has no login.
- **Write**: `report_cards` and `session_notes` are open — that is the coach's
  job and they do not sign in. `schools`, `grades`, `school_grades`,
  `curricula`, `lesson_plans`, `assessment_objectives`, `syllabus_entries`,
  `coaches`, `coach_assignments` and `students` all require
  `private.is_admin()`. RLS is defined per table, so
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
