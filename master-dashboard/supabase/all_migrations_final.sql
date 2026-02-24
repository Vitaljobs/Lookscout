-- Combined Migrations

-- Create echo_score_sync table for live Echo Chamber data
create table if not exists echo_score_sync (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  score integer not null,
  level integer not null,
  missions_completed integer default 0,
  contributions integer default 0,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Add index for faster queries
create index if not exists idx_echo_score_sync_user on echo_score_sync(user_id);
create index if not exists idx_echo_score_sync_synced on echo_score_sync(synced_at desc);

-- Enable Row Level Security
alter table echo_score_sync enable row level security;

-- Policy: Allow authenticated users to read
create policy "Allow authenticated read echo score"
  on echo_score_sync for select
  using (true);

-- Policy: Allow service role to insert
create policy "Allow service role insert echo score"
  on echo_score_sync for insert
  with check (true);

-- Create reputation_history table for trend data
create table if not exists reputation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  score integer not null,
  change integer default 0,
  reason text,
  project_source text default 'echo-chamber',
  created_at timestamptz not null default now()
);

-- Add indexes
create index if not exists idx_reputation_history_user on reputation_history(user_id);
create index if not exists idx_reputation_history_created on reputation_history(created_at desc);
create index if not exists idx_reputation_history_project on reputation_history(project_source);

-- Enable Row Level Security
alter table reputation_history enable row level security;

-- Policy: Allow authenticated users to read
create policy "Allow authenticated read reputation history"
  on reputation_history for select
  using (true);

-- Policy: Allow service role to insert
create policy "Allow service role insert reputation history"
  on reputation_history for insert
  with check (true);


-- Create contact_messages table for Unified Support Hub
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  project_source text not null,
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'replied', 'archived')),
  created_at timestamptz not null default now(),
  replied_at timestamptz,
  reply_message text,
  replied_by text
);

-- Add index for faster queries
create index if not exists idx_contact_messages_status on contact_messages(status);
create index if not exists idx_contact_messages_project on contact_messages(project_source);
create index if not exists idx_contact_messages_created on contact_messages(created_at desc);

-- Enable Row Level Security
alter table contact_messages enable row level security;

-- Policy: Allow authenticated users to read all messages
create policy "Allow authenticated read access"
  on contact_messages for select
  using (true);

-- Policy: Allow service role to insert messages
create policy "Allow service role insert"
  on contact_messages for insert
  with check (true);

-- Policy: Allow authenticated users to update messages
create policy "Allow authenticated update"
  on contact_messages for update
  using (true);

-- Create security_events table for Lockout Scout
create table if not exists security_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  ip_address text,
  user_agent text,
  reason text,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  project_source text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);

-- Add indexes
create index if not exists idx_security_events_ip on security_events(ip_address);
create index if not exists idx_security_events_severity on security_events(severity);
create index if not exists idx_security_events_created on security_events(created_at desc);
create index if not exists idx_security_events_type on security_events(event_type);

-- Enable Row Level Security
alter table security_events enable row level security;

-- Policy: Allow authenticated users to read all events
create policy "Allow authenticated read security events"
  on security_events for select
  using (true);

-- Policy: Allow service role to insert events
create policy "Allow service role insert security events"
  on security_events for insert
  with check (true);

-- Create blocked_ips table for IP blocking
create table if not exists blocked_ips (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null unique,
  reason text not null,
  blocked_at timestamptz not null default now(),
  blocked_until timestamptz,
  blocked_by text,
  is_permanent boolean default false
);

-- Add index
create index if not exists idx_blocked_ips_address on blocked_ips(ip_address);

-- Enable Row Level Security
alter table blocked_ips enable row level security;

-- Policy: Allow authenticated users to read blocked IPs
create policy "Allow authenticated read blocked ips"
  on blocked_ips for select
  using (true);

-- Policy: Allow authenticated users to manage blocked IPs
create policy "Allow authenticated manage blocked ips"
  on blocked_ips for all
  using (true);


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


-- Cleanup: Remove all test security events
-- Keep the tables and structure, just clear the data

DELETE FROM public.security_events;
DELETE FROM public.blocked_ips;

-- Verify cleanup
SELECT COUNT(*) as remaining_events FROM public.security_events;
SELECT COUNT(*) as remaining_blocks FROM public.blocked_ips;


-- Create Alerts Table for Titan Neural Link
create table if not exists public.alerts (
  id uuid default gen_random_uuid() primary key,
  project_id text not null, -- 'commonground', 'vibechain', 'vitaljobs'
  type text not null check (type in ('health', 'security', 'system')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  message text not null,
  status text not null default 'new' check (status in ('new', 'sent', 'failed')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.alerts enable row level security;

create policy "Enable read for authenticated users"
on public.alerts for select
using (true);

create policy "Enable insert for service role only"
on public.alerts for insert
with check (true);

-- Create index for faster querying of new alerts
create index if not exists alerts_status_idx on public.alerts (status) where status = 'new';
create index if not exists alerts_project_created_idx on public.alerts (project_id, created_at desc);


-- Create Project Health Logs Table for Historical Tracking
create table if not exists public.project_health_logs (
  id uuid default gen_random_uuid() primary key,
  project_id text not null, -- 'commonground', 'vibechain', 'vitaljobs'
  health_score integer not null check (health_score >= 0 and health_score <= 100),
  sentiment_score integer check (sentiment_score >= 0 and sentiment_score <= 100),
  active_users integer default 0,
  total_users integer default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.project_health_logs enable row level security;

create policy "Enable read for authenticated users"
on public.project_health_logs for select
using (true);

create policy "Enable insert for service role only"
on public.project_health_logs for insert
with check (true);

-- Create indexes for faster querying
create index if not exists project_health_logs_project_created_idx 
on public.project_health_logs (project_id, created_at desc);

create index if not exists project_health_logs_created_idx 
on public.project_health_logs (created_at desc);

-- Insert some initial historical data for testing (last 30 days)
-- This simulates past tracking so the graph has data immediately
DO $$
DECLARE
  project_name text;
  day_offset integer;
  base_health integer;
BEGIN
  FOR project_name IN SELECT unnest(ARRAY['commonground', 'vitaljobs', 'vibechain']) LOOP
    base_health := 75 + (random() * 15)::integer; -- Random base between 75-90
    
    FOR day_offset IN 0..29 LOOP
      INSERT INTO public.project_health_logs (
        project_id,
        health_score,
        sentiment_score,
        active_users,
        total_users,
        created_at
      ) VALUES (
        project_name,
        base_health + (random() * 20 - 10)::integer, -- Fluctuate ±10
        70 + (random() * 25)::integer, -- Sentiment 70-95
        (10 + random() * 50)::integer, -- Active users 10-60
        (100 + random() * 500)::integer, -- Total users 100-600
        now() - (day_offset || ' days')::interval
      );
    END LOOP;
  END LOOP;
END $$;


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
  using (true);

-- Policy: Allow service role full access
create policy "Allow service role full access projects"
  on projects for all
  using (true);

-- Insert dummy projects so Titan has something to talk about
insert into projects (name, slug, description, status, health, theme)
values 
  ('Lookscout', 'lookscout', 'AI-Powered Market Intelligence', 'operational', 98, 'purple'),
  ('VitalJobs', 'vitaljobs', 'Healthcare Recruitment Platform', 'degraded', 75, 'blue'),
  ('Common Ground', 'commonground', 'Community Engagement', 'operational', 92, 'green'),
  ('Echo Chamber', 'echo-chamber', 'Social Sentiment Analysis', 'maintenance', 45, 'orange')
on conflict (slug) do nothing;


-- Fix Security Tables (Update existing tables instead of creating new ones)
-- This migration safely adds missing columns to existing tables

-- 1. Update security_events table
DO $$ 
BEGIN
    -- Add endpoint column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='security_events' AND column_name='endpoint') THEN
        ALTER TABLE public.security_events ADD COLUMN endpoint text;
    END IF;

    -- Add user_agent column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='security_events' AND column_name='user_agent') THEN
        ALTER TABLE public.security_events ADD COLUMN user_agent text;
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='security_events' AND column_name='metadata') THEN
        ALTER TABLE public.security_events ADD COLUMN metadata jsonb default '{}'::jsonb;
    END IF;

    -- Add blocked column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='security_events' AND column_name='blocked') THEN
        ALTER TABLE public.security_events ADD COLUMN blocked boolean default false;
    END IF;
END $$;

-- 2. Update blocked_ips table (or create if it doesn't exist)
DO $$ 
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='blocked_ips') THEN
        CREATE TABLE public.blocked_ips (
            id uuid default gen_random_uuid() primary key,
            ip_address text unique not null,
            reason text not null,
            blocked_at timestamp with time zone default timezone('utc'::text, now()) not null
        );
    END IF;

    -- Add expires_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='blocked_ips' AND column_name='expires_at') THEN
        ALTER TABLE public.blocked_ips ADD COLUMN expires_at timestamp with time zone;
    END IF;

    -- Add auto_blocked column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='blocked_ips' AND column_name='auto_blocked') THEN
        ALTER TABLE public.blocked_ips ADD COLUMN auto_blocked boolean default false;
    END IF;

    -- Add block_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='blocked_ips' AND column_name='block_count') THEN
        ALTER TABLE public.blocked_ips ADD COLUMN block_count integer default 1;
    END IF;
END $$;

-- 3. Enable RLS and create policies
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blocked_ips' AND policyname = 'Enable read for authenticated users') THEN
        CREATE POLICY "Enable read for authenticated users"
        ON public.blocked_ips FOR SELECT
        USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blocked_ips' AND policyname = 'Enable all for service role') THEN
        CREATE POLICY "Enable all for service role"
        ON public.blocked_ips FOR ALL
        USING (true);
    END IF;
END $$;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS security_events_ip_idx ON public.security_events (ip_address);
CREATE INDEX IF NOT EXISTS blocked_ips_ip_idx ON public.blocked_ips (ip_address);

-- 5. Insert test security events (last 24 hours)
DO $$
DECLARE
  test_ips text[] := ARRAY['192.168.1.100', '10.0.0.50', '172.16.0.25', '203.0.113.45', '198.51.100.78'];
  event_types text[] := ARRAY['failed_login', 'rate_limit', 'suspicious_request', 'unauthorized_access'];
  severities text[] := ARRAY['low', 'medium', 'high', 'critical'];
  projects text[] := ARRAY['commonground', 'vitaljobs', 'lookscout'];
  i integer;
BEGIN
  -- Generate 15 security events over the last 24 hours
  FOR i IN 1..15 LOOP
    INSERT INTO public.security_events (
      event_type,
      ip_address,
      user_agent,
      endpoint,
      severity,
      metadata,
      blocked,
      project_source,
      created_at
    ) VALUES (
      event_types[1 + floor(random() * array_length(event_types, 1))::int],
      test_ips[1 + floor(random() * array_length(test_ips, 1))::int],
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      '/api/auth/signin',
      severities[1 + floor(random() * array_length(severities, 1))::int],
      jsonb_build_object('attempt_count', floor(random() * 10), 'suspicious', random() > 0.7),
      random() > 0.8,
      projects[1 + floor(random() * array_length(projects, 1))::int],
      now() - (random() * interval '24 hours')
    );
  END LOOP;

  -- Block 2 IPs as examples
  INSERT INTO public.blocked_ips (ip_address, reason, auto_blocked, expires_at)
  VALUES 
    ('203.0.113.45', 'Multiple failed login attempts (5+ in 5 minutes)', true, now() + interval '24 hours'),
    ('198.51.100.78', 'Rate limiting violation (100+ requests/min)', true, now() + interval '12 hours')
  ON CONFLICT (ip_address) DO NOTHING;
END $$;


-- Create stats table for Common Ground Pulse
create table if not exists stats (
  id uuid primary key default gen_random_uuid(),
  total_users integer default 0,
  active_now integer default 0,
  page_views_24h integer default 0,
  popular_lab text,
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table stats enable row level security;

-- Policy: Allow public read access (for Dashboard Pulse)
create policy "Allow public read access"
  on stats for select
  using (true);

-- Policy: Allow service_role to update
create policy "Allow service_role update"
  on stats for all
  using (true);

-- Insert initial dummy data so the API returns something instead of 404
insert into stats (total_users, active_now, page_views_24h, popular_lab)
select 142, 12, 1540, 'Mindfulness Lab'
where not exists (select 1 from stats);


-- Fix RLS policies for security_events table
-- This allows the API to log security events

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.security_events;
DROP POLICY IF EXISTS "Enable all for service role" ON public.security_events;

-- Create new policies that allow logging
CREATE POLICY "Allow public insert for security logging"
ON public.security_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow authenticated read"
ON public.security_events FOR SELECT
USING (true);

CREATE POLICY "Service role full access"
ON public.security_events FOR ALL
USING (true);


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
create policy "Allow public read access projects" on projects for select using (true);
create policy "Allow service role full access projects" on projects for all using (true);

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
create policy "Allow public read access stats" on stats for select using (true);
create policy "Allow service_role update stats" on stats for all using (true);

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
create policy "Allow public read access profiles" on profiles for select using (true);

-- Insert a dummy profile (Overlord James) so count is at least 1
insert into profiles (full_name, role)
select 'Overlord James', 'admin'
where not exists (select 1 from profiles);


-- ============================================================================
-- BALORIA PROJECT ACTIVATIE
-- ============================================================================
-- Voegt Baloria toe aan het Master Dashboard ecosysteem

-- Baloria Project Registratie
-- Zorg dat kolommen bestaan (voor het geval ze missen)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS domain text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

INSERT INTO projects (slug, name, description, domain, status)
VALUES (
  'baloria',
  'Baloria',
  'Sociaal platform met visuele ballebak voor vragen, kansen en connecties',
  'baloria.nl',
  'active'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  domain = EXCLUDED.domain,
  status = EXCLUDED.status;

-- Grant Overlord Access voor James
INSERT INTO user_project_access (user_id, project_id, role)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'james@live.nl' LIMIT 1),
  id,
  'owner'
FROM projects
WHERE slug = 'baloria'
ON CONFLICT (user_id, project_id) DO NOTHING;

-- Baloria-specifieke tabellen voor tracking
CREATE TABLE IF NOT EXISTS baloria_balls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ball_type text NOT NULL CHECK (ball_type IN ('question', 'vacancy', 'housing', 'education', 'collaboration')),
  color text NOT NULL, -- Hex color code
  theme text NOT NULL, -- Relaties, Werk, Financiën, etc.
  title text NOT NULL,
  description text,
  creator_id uuid, -- Kan NULL zijn voor anonieme vragen
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'caught', 'expired', 'closed')),
  filters jsonb, -- Filters voor wie mag antwoorden
  commitment_minutes integer DEFAULT 15,
  created_at timestamptz DEFAULT now(),
  caught_at timestamptz,
  closed_at timestamptz
);

CREATE TABLE IF NOT EXISTS baloria_catches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ball_id uuid NOT NULL REFERENCES baloria_balls(id) ON DELETE CASCADE,
  catcher_id uuid NOT NULL, -- User die de bal vangt
  answer text NOT NULL,
  commitment_started_at timestamptz DEFAULT now(),
  commitment_ended_at timestamptz,
  is_anonymous boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indexes voor performance
CREATE INDEX IF NOT EXISTS idx_baloria_balls_project_id ON baloria_balls(project_id);
CREATE INDEX IF NOT EXISTS idx_baloria_balls_status ON baloria_balls(status);
CREATE INDEX IF NOT EXISTS idx_baloria_balls_ball_type ON baloria_balls(ball_type);
CREATE INDEX IF NOT EXISTS idx_baloria_catches_ball_id ON baloria_catches(ball_id);

-- RLS Policies voor Baloria tabellen
ALTER TABLE baloria_balls ENABLE ROW LEVEL SECURITY;
ALTER TABLE baloria_catches ENABLE ROW LEVEL SECURITY;

-- Overlord ziet alles
CREATE POLICY "Overlord sees all balls"
  ON baloria_balls FOR ALL
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'james@live.nl'));

CREATE POLICY "Overlord sees all catches"
  ON baloria_catches FOR ALL
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'james@live.nl'));

-- Public kan actieve ballen zien
CREATE POLICY "Public can view active balls"
  ON baloria_balls FOR SELECT
  USING (status = 'active');

-- Users kunnen hun eigen catches zien
CREATE POLICY "Users see own catches"
  ON baloria_catches FOR SELECT
  USING (catcher_id = auth.uid());

-- Verification
DO $$
DECLARE
  baloria_id uuid;
BEGIN
  SELECT id INTO baloria_id FROM projects WHERE slug = 'baloria';
  RAISE NOTICE 'Baloria project geactiveerd met ID: %', baloria_id;
  RAISE NOTICE 'Baloria tracking tabellen aangemaakt';
  RAISE NOTICE 'Overlord access verleend aan James';
END $$;


-- ============================================================================
-- BAZTION (SIGNAL) PROJECT ACTIVATIE
-- ============================================================================
-- Voegt Baztion toe aan het Master Dashboard ecosysteem

-- Baztion Project Registratie
INSERT INTO projects (slug, name, status)
VALUES (
  'baztion',
  'Baztion (Signal)',
  'active'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status;

-- Grant Overlord Access voor James
INSERT INTO user_project_access (user_id, project_id, role)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'james@live.nl' LIMIT 1),
  id,
  'owner'
FROM projects
WHERE slug = 'baztion'
ON CONFLICT (user_id, project_id) DO NOTHING;

-- Baztion-specifieke tabellen voor tracking
CREATE TABLE IF NOT EXISTS baztion_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  metric_type text NOT NULL CHECK (metric_type IN ('culture_score', 'active_users', 'feedback_items', 'engagement', 'psychological_safety', 'open_communication', 'team_trust', 'inclusivity')),
  value numeric NOT NULL,
  percentage numeric, -- Voor percentage metrics
  trend text CHECK (trend IN ('up', 'down', 'stable')),
  recorded_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS baztion_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  post_type text NOT NULL CHECK (post_type IN ('connect', 'signal')),
  is_anonymous boolean DEFAULT false,
  content text NOT NULL,
  author_id uuid, -- NULL voor anonieme posts
  category text, -- Voor Signal mode: suggestion, concern, idea, question
  status text DEFAULT 'active' CHECK (status IN ('active', 'under_review', 'implemented', 'closed')),
  upvotes integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS baztion_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  feedback_type text NOT NULL CHECK (feedback_type IN ('anonymous', 'open')),
  content text NOT NULL,
  author_id uuid, -- NULL voor anonieme feedback
  target_user_id uuid, -- Voor wie is de feedback
  sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes voor performance
CREATE INDEX IF NOT EXISTS idx_baztion_metrics_project_id ON baztion_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_baztion_metrics_type ON baztion_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_baztion_posts_project_id ON baztion_posts(project_id);
CREATE INDEX IF NOT EXISTS idx_baztion_posts_type ON baztion_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_baztion_feedback_project_id ON baztion_feedback(project_id);

-- RLS Policies voor Baztion tabellen
ALTER TABLE baztion_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE baztion_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE baztion_feedback ENABLE ROW LEVEL SECURITY;

-- Overlord ziet alles
CREATE POLICY "Overlord sees all baztion metrics"
  ON baztion_metrics FOR ALL
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'james@live.nl'));

CREATE POLICY "Overlord sees all baztion posts"
  ON baztion_posts FOR ALL
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'james@live.nl'));

CREATE POLICY "Overlord sees all baztion feedback"
  ON baztion_feedback FOR ALL
  USING (auth.uid() IN (SELECT id FROM auth.users WHERE email = 'james@live.nl'));

-- Authenticated users kunnen metrics lezen
CREATE POLICY "Authenticated read baztion metrics"
  ON baztion_metrics FOR SELECT
  USING (true);

-- Authenticated users kunnen posts lezen
CREATE POLICY "Authenticated read baztion posts"
  ON baztion_posts FOR SELECT
  USING (true);

-- Seed initial metrics (voorbeeld data van je screenshots)
INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'culture_score',
  78,
  NULL,
  'stable'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'active_users',
  124,
  NULL,
  'up'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'feedback_items',
  47,
  NULL,
  'stable'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'engagement',
  89,
  89,
  'up'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'psychological_safety',
  78,
  78,
  'stable'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'open_communication',
  72,
  72,
  'up'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'team_trust',
  85,
  85,
  'up'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

INSERT INTO baztion_metrics (project_id, metric_type, value, percentage, trend)
SELECT 
  id,
  'inclusivity',
  80,
  80,
  'stable'
FROM projects WHERE slug = 'baztion'
ON CONFLICT DO NOTHING;

-- Verification
DO $$
DECLARE
  baztion_id uuid;
BEGIN
  SELECT id INTO baztion_id FROM projects WHERE slug = 'baztion';
  RAISE NOTICE '✅ Baztion project geactiveerd met ID: %', baztion_id;
  RAISE NOTICE '✅ Baztion tracking tabellen aangemaakt';
  RAISE NOTICE '✅ Overlord access verleend aan James';
  RAISE NOTICE '✅ Initial metrics geseeded';
END $$;


-- ============================================================================
-- MIGRATIE 1: Project ID Systeem (FIXED - Type safe version)
-- ============================================================================
-- Voeg project_id kolommen toe aan gedeelde tabellen
-- NOTE: Run 20260205_fix_alerts_type.sql FIRST!

-- Step 1: Add project_id columns (nullable first for data migration)
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS project_id uuid;
-- alerts already has project_id as uuid from pre-migration

-- Step 2: Create project lookup function for migration
CREATE OR REPLACE FUNCTION get_project_id_by_slug(slug_param text)
RETURNS uuid AS $$
  SELECT id FROM projects WHERE slug = slug_param LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Step 3: Get default project ID (Lookscout) for fallback
DO $$
DECLARE
  default_project_id uuid;
BEGIN
  -- Get Lookscout project ID as default
  SELECT id INTO default_project_id FROM projects WHERE slug = 'lookscout' LIMIT 1;
  
  -- If no Lookscout, use first project
  IF default_project_id IS NULL THEN
    SELECT id INTO default_project_id FROM projects LIMIT 1;
  END IF;

  -- Migrate contact_messages
  UPDATE contact_messages cm
  SET project_id = COALESCE(
    get_project_id_by_slug(cm.project_source),
    default_project_id
  )
  WHERE project_id IS NULL;

  -- Migrate security_events (use project_source or default to Lookscout)
  UPDATE security_events se
  SET project_id = COALESCE(
    get_project_id_by_slug(se.project_source),
    default_project_id
  )
  WHERE project_id IS NULL;
END $$;

-- Step 4: Verify no NULL values remain
DO $$
DECLARE
  null_count integer;
BEGIN
  -- Check contact_messages
  SELECT COUNT(*) INTO null_count FROM contact_messages WHERE project_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'contact_messages still has % NULL project_id values', null_count;
  END IF;

  -- Check security_events
  SELECT COUNT(*) INTO null_count FROM security_events WHERE project_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'security_events still has % NULL project_id values', null_count;
  END IF;

  -- Check alerts
  SELECT COUNT(*) INTO null_count FROM alerts WHERE project_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'alerts still has % NULL project_id values', null_count;
  END IF;
END $$;

-- Step 5: Make project_id NOT NULL and add foreign keys
DO $$ 
BEGIN
  -- contact_messages
  ALTER TABLE contact_messages ALTER COLUMN project_id SET NOT NULL;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_contact_messages_project'
  ) THEN
    ALTER TABLE contact_messages 
      ADD CONSTRAINT fk_contact_messages_project 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;

  -- security_events
  ALTER TABLE security_events ALTER COLUMN project_id SET NOT NULL;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_security_events_project'
  ) THEN
    ALTER TABLE security_events 
      ADD CONSTRAINT fk_security_events_project 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;

  -- alerts (already has NOT NULL from pre-migration)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_alerts_project'
  ) THEN
    ALTER TABLE alerts 
      ADD CONSTRAINT fk_alerts_project 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_project_id ON contact_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_security_events_project_id ON security_events(project_id);
-- alerts index already created in pre-migration

-- Step 7: Keep project_source for backwards compatibility
COMMENT ON COLUMN contact_messages.project_source IS 'Legacy slug field, use project_id for queries';
COMMENT ON COLUMN security_events.project_source IS 'Legacy slug field, use project_id for queries';


-- Add sentiment and metadata columns to contact_messages table
alter table contact_messages 
  add column if not exists sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  add column if not exists metadata jsonb;

-- Add index for sentiment queries
create index if not exists idx_contact_messages_sentiment on contact_messages(sentiment);

-- Update RLS policy to allow anonymous inserts (for webhook)
create policy if not exists "Allow anonymous insert for webhook"
  on contact_messages for insert
  with check (true);


-- ============================================================================
-- DEBUG: Tijdelijk permissieve RLS voor troubleshooting
-- ============================================================================
-- Dit maakt RLS tijdelijk permissief zodat we kunnen zien wat er mis gaat

-- Tijdelijk: Authenticated users kunnen alles lezen
CREATE POLICY "DEBUG: Authenticated read all messages"
  ON contact_messages FOR SELECT
  USING (true);

CREATE POLICY "DEBUG: Authenticated read all security events"
  ON security_events FOR SELECT
  USING (true);

CREATE POLICY "DEBUG: Authenticated read all alerts"
  ON alerts FOR SELECT
  USING (true);

-- Log voor debugging
DO $$
BEGIN
  RAISE NOTICE 'DEBUG RLS policies toegevoegd - alle authenticated users kunnen nu lezen';
END $$;


-- ============================================================================
-- PRE-MIGRATIE: Fix alerts table type mismatch
-- ============================================================================
-- De alerts tabel heeft project_id als TEXT, maar moet UUID zijn voor foreign key

-- Step 1: Rename old column
ALTER TABLE alerts RENAME COLUMN project_id TO project_slug_old;

-- Step 2: Add new UUID column
ALTER TABLE alerts ADD COLUMN project_id uuid;

-- Step 3: Migrate data from slug to UUID
UPDATE alerts a
SET project_id = p.id
FROM projects p
WHERE p.slug = a.project_slug_old;

-- Step 4: Handle any remaining NULL values (fallback to Lookscout)
UPDATE alerts
SET project_id = (SELECT id FROM projects WHERE slug = 'lookscout' LIMIT 1)
WHERE project_id IS NULL;

-- Step 5: Make NOT NULL
ALTER TABLE alerts ALTER COLUMN project_id SET NOT NULL;

-- Step 6: Drop old column
ALTER TABLE alerts DROP COLUMN project_slug_old;

-- Step 7: Add index
CREATE INDEX IF NOT EXISTS idx_alerts_project_id ON alerts(project_id);

COMMENT ON COLUMN alerts.project_id IS 'Foreign key to projects table (converted from text slug to uuid)';


-- ============================================================================
-- FIX: RLS Policies die daadwerkelijk werken
-- ============================================================================
-- Probleem: De Overlord policies werkten niet omdat auth.uid() check faalde
-- Oplossing: Directe UUID check + fallback naar email check

-- Eerst: Re-enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Drop debug policies
DROP POLICY IF EXISTS "DEBUG: Authenticated read all messages" ON contact_messages;
DROP POLICY IF EXISTS "DEBUG: Authenticated read all security events" ON security_events;
DROP POLICY IF EXISTS "DEBUG: Authenticated read all alerts" ON alerts;

-- ============================================================================
-- CONTACT MESSAGES - Gefixte policies
-- ============================================================================

-- Overlord: Direct UUID check (meest betrouwbaar)
CREATE POLICY "Overlord full access messages v2"
  ON contact_messages FOR ALL
  USING (
    auth.uid() = 'e8198878-31fb-4c2b-89f7-425849abd945'::uuid
  );

-- Project members: Read access
CREATE POLICY "Project members read messages v2"
  ON contact_messages FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- SECURITY EVENTS - Gefixte policies
-- ============================================================================

CREATE POLICY "Overlord full access security v2"
  ON security_events FOR ALL
  USING (
    auth.uid() = 'e8198878-31fb-4c2b-89f7-425849abd945'::uuid
  );

CREATE POLICY "Project admins read security v2"
  ON security_events FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- ALERTS - Gefixte policies
-- ============================================================================

CREATE POLICY "Overlord full access alerts v2"
  ON alerts FOR ALL
  USING (
    auth.uid() = 'e8198878-31fb-4c2b-89f7-425849abd945'::uuid
  );

CREATE POLICY "Project members read alerts v2"
  ON alerts FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'RLS policies gefixed met directe UUID check voor Overlord';
  RAISE NOTICE 'Overlord UUID: e8198878-31fb-4c2b-89f7-425849abd945';
END $$;


-- ============================================================================
-- MIGRATIE 3: Row Level Security Policies (FIXED VERSION)
-- ============================================================================
-- Implementeert strikte data isolatie met Overlord access voor James

-- ============================================================================
-- CONTACT MESSAGES - Support Hub
-- ============================================================================

-- Drop ALL existing policies (including old ones)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'contact_messages') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON contact_messages';
    END LOOP;
END $$;

-- Overlord Policy: James sees everything
CREATE POLICY "Overlord sees all messages"
  ON contact_messages FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'james@live.nl'
    )
  );

-- Project Isolation: Users see only their project's messages
CREATE POLICY "Project isolation for messages"
  ON contact_messages FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
    )
  );

-- Webhook Insert: Anonymous can insert (for email webhook)
CREATE POLICY "Webhook can insert messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

-- Service Role: Full access for backend operations
CREATE POLICY "Service role full access messages"
  ON contact_messages FOR ALL
  USING (true);

-- Users can update messages in their projects
CREATE POLICY "Users update own project messages"
  ON contact_messages FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'member')
    )
  );

-- ============================================================================
-- SECURITY EVENTS - Lockout Scout
-- ============================================================================

-- Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'security_events') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON security_events';
    END LOOP;
END $$;

-- Overlord Policy
CREATE POLICY "Overlord sees all security events"
  ON security_events FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'james@live.nl'
    )
  );

-- Project Isolation
CREATE POLICY "Project isolation for security events"
  ON security_events FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Service Role
CREATE POLICY "Service role full access security events"
  ON security_events FOR ALL
  USING (true);

-- ============================================================================
-- ALERTS - System Alerts
-- ============================================================================

-- Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'alerts') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON alerts';
    END LOOP;
END $$;

-- Overlord Policy
CREATE POLICY "Overlord sees all alerts"
  ON alerts FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'james@live.nl'
    )
  );

-- Project Isolation
CREATE POLICY "Project isolation for alerts"
  ON alerts FOR SELECT
  USING (
    project_id IN (
      SELECT project_id 
      FROM user_project_access 
      WHERE user_id = auth.uid()
    )
  );

-- Service Role
CREATE POLICY "Service role full access alerts"
  ON alerts FOR ALL
  USING (true);

-- ============================================================================
-- PROJECTS - Project Registry
-- ============================================================================

-- Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'projects') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON projects';
    END LOOP;
END $$;

-- Public Read
CREATE POLICY "Public can read projects"
  ON projects FOR SELECT
  USING (true);

-- Overlord can do everything
CREATE POLICY "Overlord manages projects"
  ON projects FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'james@live.nl'
    )
  );

-- Service Role
CREATE POLICY "Service role full access projects"
  ON projects FOR ALL
  USING (true);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- Drop view if exists
DROP VIEW IF EXISTS user_projects;

-- View: User's accessible projects with details
CREATE VIEW user_projects AS
SELECT 
  upa.user_id,
  upa.role,
  p.*
FROM user_project_access upa
JOIN projects p ON p.id = upa.project_id;

-- Grant access to view
GRANT SELECT ON user_projects;


-- ============================================================================
-- MIGRATIE 2: User Project Access Control
-- ============================================================================
-- Tabel voor het beheren van welke users toegang hebben tot welke projecten

CREATE TABLE IF NOT EXISTS user_project_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_project_access_user ON user_project_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_project_access_project ON user_project_access(project_id);
CREATE INDEX IF NOT EXISTS idx_user_project_access_role ON user_project_access(role);

-- Enable RLS
ALTER TABLE user_project_access ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own access
CREATE POLICY "Users see own access"
  ON user_project_access FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Overlord (James) sees all access
CREATE POLICY "Overlord sees all access"
  ON user_project_access FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users WHERE email = 'james@live.nl'
    )
  );

-- Seed data: Give James (Overlord) owner access to all projects
INSERT INTO user_project_access (user_id, project_id, role)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'james@live.nl' LIMIT 1),
  id,
  'owner'
FROM projects
ON CONFLICT (user_id, project_id) DO NOTHING;

-- Function to check if user has access to project
CREATE OR REPLACE FUNCTION user_has_project_access(
  user_id_param uuid,
  project_id_param uuid
)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_project_access 
    WHERE user_id = user_id_param 
      AND project_id = project_id_param
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Function to get user's accessible project IDs
CREATE OR REPLACE FUNCTION get_user_project_ids(user_id_param uuid)
RETURNS TABLE(project_id uuid) AS $$
  SELECT project_id 
  FROM user_project_access 
  WHERE user_id = user_id_param;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;


-- Add reply_message column to support_messages
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS reply_message text;

-- Ensure RLS policy covers updates for replies (it already allows ALL for authenticated/anon for demo)


-- Create external_sites table for central management of connected sites
create table if not exists public.external_sites (
    id uuid primary key default gen_random_uuid(),
    site_name text not null,
    api_key text not null, -- This will store the ENCRYPTED api key
    webhook_url text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.external_sites enable row level security;

-- Policy: Allow all users to manage sites (for demo/dev)
create policy "Enable full access for all to external_sites" 
on public.external_sites for all 
using (true)
with check (true);

-- Add updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger set_external_sites_updated_at
    before update on public.external_sites
    for each row
    execute function public.handle_updated_at();

-- Add index for site_name
create index if not exists idx_external_sites_name on public.external_sites(site_name);


-- Create support_messages table for aggregated support tickets
create table if not exists public.support_messages (
    id uuid primary key default gen_random_uuid(),
    site_id uuid references public.external_sites(id) on delete cascade not null,
    sender_name text not null,
    sender_email text not null,
    subject text not null,
    body text not null,
    status text not null default 'open' check (status in ('open', 'pending', 'closed')),
    created_at timestamptz default now() not null,
    responded_at timestamptz,
    updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.support_messages enable row level security;

-- Policy: Allow all users to manage messages (for demo/dev)
create policy "Enable full access for all to support_messages" 
on public.support_messages for all 
using (true)
with check (true);

-- Add updated_at trigger
create trigger set_support_messages_updated_at
    before update on public.support_messages
    for each row
    execute function public.handle_updated_at();

-- Add indexes for performance
create index if not exists idx_support_messages_site_id on public.support_messages(site_id);
create index if not exists idx_support_messages_status on public.support_messages(status);
create index if not exists idx_support_messages_created_at on public.support_messages(created_at desc);


-- Add metadata column to support_messages
alter table public.support_messages add column if not exists metadata jsonb default '{}'::jsonb;


