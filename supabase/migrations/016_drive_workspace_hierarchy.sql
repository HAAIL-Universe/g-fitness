ALTER TABLE admin_settings
  ADD COLUMN IF NOT EXISTS managed_workspace_root_folder_id text,
  ADD COLUMN IF NOT EXISTS managed_workspace_root_folder_url text,
  ADD COLUMN IF NOT EXISTS managed_clients_folder_id text,
  ADD COLUMN IF NOT EXISTS managed_clients_folder_url text,
  ADD COLUMN IF NOT EXISTS managed_pt_library_sheet_id text,
  ADD COLUMN IF NOT EXISTS managed_pt_library_sheet_url text,
  ADD COLUMN IF NOT EXISTS managed_nutrition_library_sheet_id text,
  ADD COLUMN IF NOT EXISTS managed_nutrition_library_sheet_url text;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS drive_folder_id text,
  ADD COLUMN IF NOT EXISTS drive_folder_url text,
  ADD COLUMN IF NOT EXISTS sheet_shared_email text,
  ADD COLUMN IF NOT EXISTS sheet_shared_permission_id text,
  ADD COLUMN IF NOT EXISTS sheet_shared_at timestamptz;
