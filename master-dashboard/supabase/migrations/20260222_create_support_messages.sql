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
