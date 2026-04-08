ALTER TABLE admin_settings
  ADD COLUMN IF NOT EXISTS brand_title text,
  ADD COLUMN IF NOT EXISTS brand_logo_url text,
  ADD COLUMN IF NOT EXISTS brand_primary_color text,
  ADD COLUMN IF NOT EXISTS brand_accent_color text,
  ADD COLUMN IF NOT EXISTS brand_welcome_text text,
  ADD COLUMN IF NOT EXISTS show_powered_by boolean DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_settings_user_id_unique
  ON admin_settings(user_id);
