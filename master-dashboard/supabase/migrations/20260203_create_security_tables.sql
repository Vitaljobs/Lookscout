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
        TO authenticated
        USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blocked_ips' AND policyname = 'Enable all for service role') THEN
        CREATE POLICY "Enable all for service role"
        ON public.blocked_ips FOR ALL
        TO service_role
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
