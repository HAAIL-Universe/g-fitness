-- G-Fitness database schema
-- Run this in the Supabase SQL editor after creating your project

-- Admin settings (stores Eliot's Google OAuth tokens)
create table admin_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  google_refresh_token text,
  google_access_token text,
  google_token_expiry timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Clients (each row = one of Eliot's clients)
create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null unique,
  sheet_id text,
  invite_token text unique,
  invite_expires_at timestamptz,
  invite_accepted_at timestamptz,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row-level security
alter table admin_settings enable row level security;
alter table clients enable row level security;

-- Admin can read/write their own settings
create policy "admin_own_settings" on admin_settings
  for all using (auth.uid() = user_id);

-- Admin can manage all clients (identified by ADMIN_EMAIL check in API routes)
-- Clients can read their own row
create policy "clients_read_own" on clients
  for select using (auth.uid() = user_id);

-- Admin full access to clients via role-based access control
create policy "admin_full_access" on clients
  for all using (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- User roles table (source of truth for RBAC)
create table user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  role text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz default now()
);

alter table user_roles enable row level security;

-- Only service role can manage roles (no RLS policy = no access via anon/authenticated keys)

-- Trigger: sync role into auth.users.raw_app_meta_data on insert/update
create or replace function sync_role_to_app_metadata()
returns trigger as $$
begin
  update auth.users
  set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', NEW.role)
  where id = NEW.user_id;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_role_change
  after insert or update on user_roles
  for each row execute function sync_role_to_app_metadata();

-- Indexes
create index idx_clients_email on clients(email);
create index idx_clients_invite_token on clients(invite_token);
create index idx_clients_user_id on clients(user_id);
