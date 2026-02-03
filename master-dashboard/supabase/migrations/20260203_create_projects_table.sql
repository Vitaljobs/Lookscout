-- Create projects table for Titan Neural Link Context
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'operational' check (status in ('operational', 'degraded', 'maintenance', 'offline')),
  health integer default 100,
  last_updated timestamptz default now(),
  url text,
  public_url text,
  theme text default 'blue'
);

-- Enable RLS
alter table projects enable row level security;

-- Policy: Allow public read (so neural link and dashboard can see it)
create policy "Allow public read access projects"
  on projects for select
  to anon, authenticated
  using (true);

-- Policy: Allow service role full access
create policy "Allow service role full access projects"
  on projects for all
  to service_role
  using (true);

-- Insert dummy projects so Titan has something to talk about
insert into projects (name, slug, description, status, health, theme)
values 
  ('Lookscout', 'lookscout', 'AI-Powered Market Intelligence', 'operational', 98, 'purple'),
  ('VitalJobs', 'vitaljobs', 'Healthcare Recruitment Platform', 'degraded', 75, 'blue'),
  ('Common Ground', 'commonground', 'Community Engagement', 'operational', 92, 'green'),
  ('Echo Chamber', 'echo-chamber', 'Social Sentiment Analysis', 'maintenance', 45, 'orange')
on conflict (slug) do nothing;
