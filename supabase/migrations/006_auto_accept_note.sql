-- Auto-accept bookkeeping.
-- Remembers WHY a pending reservation could not be auto-accepted (e.g. 'full',
-- 'outside_hours') so the owner is alerted once per problem, not on every run.
-- Additive and nullable: existing rows, the web form and the WhatsApp bot are unaffected.
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS auto_accept_note text;
