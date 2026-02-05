-- Add sentiment and metadata columns to contact_messages table
alter table contact_messages 
  add column if not exists sentiment text check (sentiment in ('positive', 'neutral', 'negative')),
  add column if not exists metadata jsonb;

-- Add index for sentiment queries
create index if not exists idx_contact_messages_sentiment on contact_messages(sentiment);

-- Update RLS policy to allow anonymous inserts (for webhook)
create policy if not exists "Allow anonymous insert for webhook"
  on contact_messages for insert
  to anon
  with check (true);
