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
to authenticated
using (true);

create policy "Enable insert for service role only"
on public.project_health_logs for insert
to service_role
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
