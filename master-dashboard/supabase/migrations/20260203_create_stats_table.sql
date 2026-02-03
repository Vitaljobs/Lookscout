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
  to anon, authenticated
  using (true);

-- Policy: Allow service_role to update
create policy "Allow service_role update"
  on stats for all
  to service_role
  using (true);

-- Insert initial dummy data so the API returns something instead of 404
insert into stats (total_users, active_now, page_views_24h, popular_lab)
select 142, 12, 1540, 'Mindfulness Lab'
where not exists (select 1 from stats);
