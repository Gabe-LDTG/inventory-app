-- This migration will enable cron jobs and create a cron job to clean up the audit log table by removing all records older than 90 days.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Unschedule the old job if it exists
-- SELECT cron.unschedule('prune-audit-logs');

-- Schedule a checker that runs during midnight Eastern Time
-- "0 4,5 * * *" means it checks at 4:00 AM UTC (Midnight EDT) and 5:00 AM UTC (Midnight EST)
SELECT cron.schedule(
    'prune-audit-logs', 
    '0 4,5 * * *', 
    $$ 
    -- Only execute the body if the current hour in New York is exactly 0 (Midnight)
    IF (EXTRACT(HOUR FROM NOW() AT TIME ZONE 'America/New_York') = 0) THEN
        DELETE FROM public.audit_logs WHERE changed_at < NOW() - INTERVAL '90 days';
    END IF;
    $$
);