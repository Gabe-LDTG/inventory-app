-- This migration will add Row Level Security (RLS) policies to the audit_logs table to ensure that only authorized users can access the logs.
-- Enable RLS on the audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

create policy "Audit logs are viewable by the Admin and Management."
on public.audit_logs
as permissive
for select
to authenticated
using (
  exists (
    select 1
    from profiles p
    where p.id = (select auth.uid())
      and p.company_role = any (array['Admin','Management'])
  )
);