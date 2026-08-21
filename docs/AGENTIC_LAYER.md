# Class Report — Agentic Layer

## v1 Status
No agentic actions in v1. All actions are direct human (coach/admin) CRUD.

## Deferred Actions (later phases)

### Draftable (auto, low risk)
- **Auto-draft report card** — pre-fill attendance from previous session pattern; coach reviews before saving
- **Auto-suggest assessment text** — based on prior entries for same student; coach accepts/edits

### Executable After Approval (medium risk)
- **Reminder notification** — send nudge to coach who hasn't filled report card within 2 days of session; admin approves send

### Human-Only (high/critical risk)
- **Delete a class or lesson plan** — always human (admin only)
- **Bulk edit student roster** — always human

### Named Tools (later)
- `draft_report_card(lesson_plan_id)` → returns draft rows
- `send_coach_reminder(coach_id, lesson_plan_id)` → sends notification (after approval)
- `flag_low_attendance(student_id)` → creates admin review item

### Audit Log Fields (later)
| field | type |
|---|---|
| id | uuid pk |
| action | text (e.g. "reminder_sent") |
| actor_id | uuid |
| target_type | text |
| target_id | uuid |
| approved_by | uuid nullable |
| created_at | timestamptz |

## Risk Summary
| Level | v1 | Later |
|---|---|---|
| Low (auto draft) | — | ✓ |
| Medium (send reminder) | — | ✓ |
| High (delete/bulk) | human always | human always |
