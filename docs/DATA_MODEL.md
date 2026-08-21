# Class Report — Data Model

Migrations `0002`–`0006` built the admin domain and then removed classes
entirely. A student belongs to a **school and a grade**; a coach is assigned to
a (school, grade) pair and inherits every session scheduled for it. There is no
class and no class name.

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

### curricula
| field | type |
|---|---|
| id | uuid pk |
| name | text not null |
| grade_id | uuid not null → grades.id |
| created_at | timestamptz default now() |

**Unique**: (name, grade_id). A curriculum targets exactly one grade — and
therefore one school, since grades are per school.

### lesson_plans
| field | type |
|---|---|
| id | uuid pk |
| curriculum_id | uuid not null → curricula.id |
| title | text not null |
| sort_order | integer not null default 0 |
| created_at | timestamptz default now() |

Reusable content only. A lesson plan carries no dates; the syllabus schedules it.

### assessment_objectives
| field | type |
|---|---|
| id | uuid pk |
| lesson_plan_id | uuid not null → lesson_plans.id |
| title | text not null |
| description | text |
| sort_order | integer not null default 0 |
| created_at | timestamptz default now() |

The grade is implied by the plan's curriculum, so an objective is scoped to a
lesson plan *for a specific grade* without a second FK. Coaches see these
read-only on the report card as the goal for the class.

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

**Unique**: (school_id, lesson_plan_id, session_date1).

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
schools 1—* grades 1—* curricula 1—* lesson_plans 1—* assessment_objectives
schools 1—* syllabus_entries *—1 lesson_plans
schools 1—* students *—1 grades
coaches *—* (school, grade) via coach_assignments
syllabus_entries 1—* report_cards *—1 students
```

**Who is on a report card**: a syllabus entry names a school, and its lesson
plan sits in a curriculum for one grade. The card covers every student at that
school in that grade.

**Whose weekly view it appears in**: any coach with a `coach_assignments` row
for that (school, grade). Sessions with no assigned coach are still listed,
under "No coach assigned", so they are never hidden.

## RLS
- **Read**: open on every table — the coach app has no login.
- **Write**: `report_cards` is open — that is the coach's job and they do not
  sign in. `schools`, `grades`, `curricula`, `lesson_plans`,
  `assessment_objectives`, `syllabus_entries`, `coaches`, `coach_assignments`
  and `students` all require `private.is_admin()`.
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
