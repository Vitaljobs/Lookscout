-- Add metadata column to support_messages
alter table public.support_messages add column if not exists metadata jsonb default '{}'::jsonb;
