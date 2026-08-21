# Class Report — PRD

## Problem
Coaches manually duplicate paper report cards into spreadsheets for reporting. No single system to record per-student attendance and remarks across a week of classes.

## Target User
15 coaches (fill out report cards weekly) and 3 admins (review reports, manage rosters). Web-only.

## Core Objects
- **Class** — coach, school, grade, name (e.g. "Tuesday Basketball — Grade 5")
- **Lesson Plan** — belongs to a class; has two session dates; title
- **Student** — belongs to a class; name
- **Report Card** — one per student per lesson plan: attendance_session1 (P/A), attendance_session2 (P/A), assessment (text/mark), right_behavior (text/mark), notes (text)

## MVP (v1) — must-haves
- [ ] Weekly view: list of classes with their lesson plans for the current week, showing fill status
- [ ] Report card editor: select a lesson plan → see all students in a grid → fill attendance (P/A dropdowns for 2 sessions) + assessment + right_behavior + notes
- [ ] Report cards are editable after saving
- [ ] Admins can view all classes; coaches see their own (v1: open, no auth wall)
- [ ] Create/edit/delete classes, lesson plans, students
- [ ] Seed data renders the app instantly for anonymous visitors

## Non-goals (v1)
- No mobile app (web responsive only)
- Single admin account, no multi-tenant SaaS
- No AI features
- No parent/student portal
- No export to external systems

## Success Criteria
A coach opens the weekly view, clicks a lesson plan, fills out attendance and remarks for all students in under 3 minutes, saves, returns later to edit one student's notes, and the saved values persist. An admin can see the same report card read-only.
