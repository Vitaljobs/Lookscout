-- Create table for storing Face Profiles (Universal Access)
create table if not exists public.face_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  descriptor jsonb not null, -- Storing the 128-float array as JSON
  label text default 'Main Profile',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policies
alter table public.face_profiles enable row level security;

create policy "Users can view their own, or admin can view all (mock admin)"
  on public.face_profiles for select
  using (true); -- For Prototype, allow reading profiles (or restrict if auth is working well)

create policy "Users can insert their own profile"
  on public.face_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.face_profiles for update
  using (auth.uid() = user_id);

-- Add index
create index idx_face_profiles_user_id on public.face_profiles(user_id);
