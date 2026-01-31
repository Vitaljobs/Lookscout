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
  to authenticated
  using (true);

-- Policy: Allow service role to insert messages
create policy "Allow service role insert"
  on contact_messages for insert
  to service_role
  with check (true);

-- Policy: Allow authenticated users to update messages
create policy "Allow authenticated update"
  on contact_messages for update
  to authenticated
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
  to authenticated
  using (true);

-- Policy: Allow service role to insert events
create policy "Allow service role insert security events"
  on security_events for insert
  to service_role
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
  to authenticated
  using (true);

-- Policy: Allow authenticated users to manage blocked IPs
create policy "Allow authenticated manage blocked ips"
  on blocked_ips for all
  to authenticated
  using (true);
