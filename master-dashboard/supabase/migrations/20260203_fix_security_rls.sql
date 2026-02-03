-- Fix RLS policies for security_events table
-- This allows the API to log security events

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.security_events;
DROP POLICY IF EXISTS "Enable all for service role" ON public.security_events;

-- Create new policies that allow logging
CREATE POLICY "Allow public insert for security logging"
ON public.security_events FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated read"
ON public.security_events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role full access"
ON public.security_events FOR ALL
TO service_role
USING (true);
