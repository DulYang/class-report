-- A report card's grade was never its own fact — it was re-derived at read
-- time from the student's CURRENT grade_id. Promoting a student to a new
-- grade silently rewrote every report card they'd ever gotten to show the
-- new grade, and could regroup it under a session it was never actually
-- part of. Freeze the grade the student was actually in at save time.

alter table report_cards
  add column if not exists grade_id uuid references grades(id) on delete restrict;

update report_cards rc
set grade_id = s.grade_id
from students s
where s.id = rc.student_id and rc.grade_id is null;

alter table report_cards alter column grade_id set not null;

create index if not exists report_cards_grade_idx on report_cards (grade_id);
