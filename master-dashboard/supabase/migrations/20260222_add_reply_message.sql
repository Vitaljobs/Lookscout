-- Add reply_message column to support_messages
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS reply_message text;

-- Ensure RLS policy covers updates for replies (it already allows ALL for authenticated/anon for demo)
