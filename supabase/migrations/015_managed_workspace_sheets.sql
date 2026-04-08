ALTER TABLE admin_settings
  ADD COLUMN IF NOT EXISTS managed_workspace_sheet_id text,
  ADD COLUMN IF NOT EXISTS managed_workspace_sheet_url text,
  ADD COLUMN IF NOT EXISTS managed_workspace_sheet_modules text[],
  ADD COLUMN IF NOT EXISTS managed_workspace_sheet_provisioned_at timestamptz;
