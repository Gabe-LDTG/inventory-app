CREATE TABLE public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    action TEXT NOT NULL,                -- 'INSERT', 'UPDATE', or 'DELETE'
    record_id BIGINT NOT NULL,             -- The ID of the order/item changed
    old_data JSONB,                      -- The record state BEFORE the change
    new_data JSONB,                      -- The record state AFTER the change
    changed_by UUID REFERENCES auth.users(id), -- The Supabase user ID
    -- FIXED: Forces the timestamp to save explicitly in New York/Eastern time
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'America/New_York') NOT NULL
);

-- Index the table for fast retrieval by managers
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);
