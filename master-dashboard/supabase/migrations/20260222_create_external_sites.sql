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
