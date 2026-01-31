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
  to authenticated
  using (true);

-- Policy: Allow service role to insert
create policy "Allow service role insert echo score"
  on echo_score_sync for insert
  to service_role
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
  to authenticated
  using (true);

-- Policy: Allow service role to insert
create policy "Allow service role insert reputation history"
  on reputation_history for insert
  to service_role
  with check (true);
