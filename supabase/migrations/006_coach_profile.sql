-- Add coach profile fields to admin_settings
ALTER TABLE admin_settings
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS business_name text;
