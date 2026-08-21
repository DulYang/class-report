# Class Report — Data Model

## coaches
| field | type |
|---|---|
| id | uuid pk |
| name | text not null |
| email | text unique |
| role | text default 'coach' |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## classes
| field | type |
|---|---|
| id | uuid pk |
| coach_id | uuid nullable → coaches.id |
| name | text not null |
| school | text not null |
| grade | text not null |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## lesson_plans
| field | type |
|---|---|
| id | uuid pk |
| class_id | uuid not null → classes.id |
| title | text not null |
| session_date1 | date not null |
| session_date2 | date not null |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## students
| field | type |
|---|---|
| id | uuid pk |
| class_id | uuid not null → classes.id |
| name | text not null |
| user_id | uuid nullable |
| created_at | timestamptz default now() |

## report_cards
| field | type |
|---|---|
| id | uuid pk |
| lesson_plan_id | uuid not null → lesson_plans.id |
| student_id | uuid not null → students.id |
| attendance_session1 | text default 'P' (P or A) |
| attendance_session2 | text default 'P' (P or A) |
| assessment | text |
| right_behavior | text |
| notes | text |
| user_id | uuid nullable |
| created_at | timestamptz default now() |
| updated_at | timestamptz default now() |

**Unique constraint**: (lesson_plan_id, student_id) — one report card per student per lesson plan.

## Relationships
```
coaches 1—* classes 1—* lesson_plans
classes 1—* students
lesson_plans *—1 students (via class) → report_cards (1:1 per pair)
```

## RLS Notes
- v1: permissive read/write for demo (no login wall)
- Lockdown sprint: owner-scoped — coaches see classes where `user_id = auth.uid()`; admins see all
- report_cards inherit visibility from their lesson_plan's class owner

No AI-generated fields in v1.
