-- Cleanup: Remove all test security events
-- Keep the tables and structure, just clear the data

DELETE FROM public.security_events;
DELETE FROM public.blocked_ips;

-- Verify cleanup
SELECT COUNT(*) as remaining_events FROM public.security_events;
SELECT COUNT(*) as remaining_blocks FROM public.blocked_ips;
