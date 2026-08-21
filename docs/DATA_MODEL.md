# Class Report — Data Model

Migrations `0002`–`0005` introduced the admin domain. School and grade stopped
being free text on `classes`, lesson plans moved from classes to curricula, and
scheduling moved to a per-school syllabus.

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

### coach_schools
| field | type |
|---|---|
| id | uuid pk |
| coach_id | uuid not null → coaches.id |
| school_id | uuid not null → schools.id |
| created_at | timestamptz default now() |

**Unique**: (coach_id, school_id). Which coaches work at which school. Only an
admin creates these, and a class may only pair a coach with a school they are
assigned to — so creating a class can never introduce a new pairing.

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

### classes
| field | type |
|---|---|
| id | uuid pk |
| coach_id | uuid nullable → coaches.id |
| name | text not null |
| school_id | uuid not null → schools.id |
| grade_id | uuid not null → grades.id |
| created_at | timestamptz default now() |

### students
| field | type |
|---|---|
| id | uuid pk |
| class_id | uuid not null → classes.id |
| name | text not null |
| created_at | timestamptz default now() |

### report_cards
| field | type |
|---|---|
| id | uuid pk |
| syllabus_entry_id | uuid not null → syllabus_entries.id |
| student_id | uuid not null → students.id |
| attendance_session1 | text default 'P' (P or A) |
| attendance_session2 | text default 'P' (P or A) |
| assessment | text |
| right_behavior | text |
| notes | text |
| created_at / updated_at | timestamptz default now() |

**Unique**: (syllabus_entry_id, student_id) — one card per student per
scheduled session.

## Relationships
```
schools 1—* grades 1—* curricula 1—* lesson_plans 1—* assessment_objectives
schools 1—* syllabus_entries *—1 lesson_plans
schools 1—* classes *—1 grades ;  coaches 1—* classes 1—* students
coaches *—* schools (via coach_schools)
syllabus_entries 1—* report_cards *—1 students
```

**Which lessons a class sees**: a syllabus entry applies to a class when the
entry's school matches the class's school AND the entry's lesson plan sits in a
curriculum for the class's grade.

## RLS
- **Read**: open on every table — the coach app has no login.
- **Write**: `classes` and `report_cards` are open (coaches do not sign in).
  `schools`, `grades`, `curricula`, `lesson_plans`, `assessment_objectives`,
  `syllabus_entries`, `coaches`, `coach_schools` and `students` all require
  `private.is_admin()`.
- **Bootstrap**: `coaches` also allows an insert while
  `private.admin_bootstrap_open()` is true — i.e. until the first admin links an
  auth account. It closes permanently after that.
- Both helpers live in the unexposed `private` schema so PostgREST does not
  publish them as RPCs.

## Still open
Coaches have no per-user scoping — anyone can reach the coach screens and edit
any class or report card. That is the remaining lockdown work before real
student data. The roster itself is already safe: `students` is admin-write only.

No AI-generated fields.
