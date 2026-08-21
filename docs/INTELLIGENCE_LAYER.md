# Class Report — Intelligence Layer

## v1 Status
No intelligence features in v1. The app is pure CRUD + grid editing.

## Deferred (later phases)

### Messy Inputs
- Coach pastes a free-text roster → auto-extract student names into rows
- Bulk attendance: coach types "all present except Sarah" → parse to per-student P/A

### Auto-Structure Schema (example for roster parse)
```json
{
  "students": [
    {"name": "Sarah Chen", "confidence": 0.95, "source": "roster_parse"},
    {"name": "Mike Johnson", "confidence": 0.92, "source": "roster_parse"}
  ]
}
```
For any AI-derived field: store `value` + `source` + `confidence` + `review_status` (default "unreviewed").

### Events to Track (later)
- report_card_submitted, report_card_edited, attendance_below_threshold

### Scoring Rules (later, rule-based first)
- Attendance rate per student: (present sessions / total sessions) × 100
- Below 70% → flag for admin review
- Empty report cards after session_date2 + 2 days → reminder flag

### What Gets Ranked (later)
- Students by attendance rate (admin dashboard)
- Classes by completion rate of report cards

## v1 vs Later
| Feature | v1 | Later |
|---|---|---|
| Roster parse | — | ✓ |
| Bulk attendance parse | — | ✓ |
| Attendance scoring/flags | — | ✓ |
| Completion reminders | — | ✓ |
