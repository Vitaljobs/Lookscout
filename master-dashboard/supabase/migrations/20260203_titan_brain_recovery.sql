-- TITAN BRAIN RECOVERY SCRIPT
-- Run this to fix "Offline Mode" / "Fallback" issues.

-- 1. FIX PROJECTS (Structurele Context)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'operational',
  health integer default 100,
  last_updated timestamptz default now(),
  url text,
  public_url text,
  theme text default 'blue'
);
alter table projects enable row level security;
create policy "Allow public read access projects" on projects for select to anon, authenticated using (true);
create policy "Allow service role full access projects" on projects for all to service_role using (true);

-- Insert Projects (if they don't exist)
insert into projects (name, slug, status, health, theme)
values 
  ('Lookscout', 'lookscout', 'operational', 98, 'purple'),
  ('VitalJobs', 'vitaljobs', 'degraded', 75, 'blue'),
  ('Common Ground', 'commonground', 'operational', 92, 'green'),
  ('Echo Chamber', 'echo-chamber', 'maintenance', 45, 'orange')
on conflict (slug) do nothing;


-- 2. FIX STATS (Common Ground Pulse)
create table if not exists stats (
  id uuid primary key default gen_random_uuid(),
  total_users integer default 0,
  active_now integer default 0,
  page_views_24h integer default 0,
  popular_lab text,
  updated_at timestamptz default now()
);
alter table stats enable row level security;
create policy "Allow public read access stats" on stats for select to anon, authenticated using (true);
create policy "Allow service_role update stats" on stats for all to service_role using (true);

-- Insert Stats (if empty)
insert into stats (total_users, active_now, page_views_24h, popular_lab)
select 2430, 42, 12500, 'Mindfulness Lab'
where not exists (select 1 from stats);


-- 3. FIX PROFILES (User Count)
-- Titan counts users in 'profiles'. If you haven't set up Auth yet, this table might be missing.
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  email text,
  full_name text,
  role text default 'user',
  created_at timestamptz default now()
);
alter table profiles enable row level security;
create policy "Allow public read access profiles" on profiles for select to anon, authenticated using (true);

-- Insert a dummy profile (Overlord James) so count is at least 1
insert into profiles (full_name, role)
select 'Overlord James', 'admin'
where not exists (select 1 from profiles);
