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
to authenticated
using (true);

create policy "Enable insert for service role only"
on public.alerts for insert
to service_role
with check (true);

-- Create index for faster querying of new alerts
create index if not exists alerts_status_idx on public.alerts (status) where status = 'new';
create index if not exists alerts_project_created_idx on public.alerts (project_id, created_at desc);
