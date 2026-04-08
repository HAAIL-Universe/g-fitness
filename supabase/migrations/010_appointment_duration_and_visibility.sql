ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60;

ALTER TABLE appointment_slots
  ADD COLUMN IF NOT EXISTS duration_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT false;
