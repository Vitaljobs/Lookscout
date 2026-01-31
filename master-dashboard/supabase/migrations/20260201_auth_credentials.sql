-- Create table for storing WebAuthn credentials
create table if not exists public.user_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  credential_id text not null,
  credential_public_key text not null,
  counter bigint not null default 0,
  transports text[] default null,
  created_at timestamptz default now(),
  last_used_at timestamptz default now(),
  
  unique(user_id, credential_id)
);

-- RLS Policies
alter table public.user_credentials enable row level security;

create policy "Users can view their own credentials"
  on public.user_credentials for select
  using (auth.uid() = user_id);

create policy "Users can insert their own credentials"
  on public.user_credentials for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own credentials"
  on public.user_credentials for delete
  using (auth.uid() = user_id);

-- Add index for faster lookups
create index idx_user_credentials_user_id on public.user_credentials(user_id);
create index idx_user_credentials_credential_id on public.user_credentials(credential_id);
