-- Fix production RLS conflicts when acquiring record locks under concurrent editors.
--
-- Root cause:
-- acquire_record_lock previously used INSERT .. ON CONFLICT .. DO UPDATE.
-- When another user owned the active lock row, Postgres could raise:
-- "new row violates row-level security policy (USING expression)"
-- before the WHERE clause on DO UPDATE resolved to false.
--
-- This migration:
-- 1) Broadens DELETE/UPDATE policies just enough to handle expired lock takeover.
-- 2) Rewrites acquire_record_lock to avoid ON CONFLICT DO UPDATE entirely.
--    It now does: cleanup expired -> refresh own -> try insert with DO NOTHING -> return existing.

-- Ensure policies are idempotently replaced.
drop policy if exists record_locks_delete_own on public.record_locks;
drop policy if exists record_locks_delete_own_or_expired on public.record_locks;

create policy record_locks_delete_own_or_expired
on public.record_locks
for delete
to authenticated
using (
  editor_user_id = auth.uid()
  or lock_expires_at < now()
);

drop policy if exists record_locks_update_own on public.record_locks;
drop policy if exists record_locks_update_own_or_expired on public.record_locks;

create policy record_locks_update_own_or_expired
on public.record_locks
for update
to authenticated
using (
  editor_user_id = auth.uid()
  or lock_expires_at < now()
)
with check (
  editor_user_id = auth.uid()
);

create or replace function public.acquire_record_lock(
  p_table_name text,
  p_record_id text,
  p_editor_name text,
  p_ttl_seconds integer default 120
)
returns jsonb
language plpgsql
as $function$
declare
  v_lock public.record_locks;
  v_existing public.record_locks;
  v_ttl integer := greatest(coalesce(p_ttl_seconds, 120), 30);
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- Cleanup expired lock rows so a fresh insert can succeed for takeover.
  delete from public.record_locks
  where table_name = p_table_name
    and record_id = p_record_id
    and lock_expires_at < now();

  -- Refresh existing lock when current user already owns it.
  update public.record_locks
  set
    editor_name = nullif(trim(p_editor_name), ''),
    lock_session_id = coalesce(nullif(trim(p_editor_name), ''), auth.uid()::text) || ':' || gen_random_uuid()::text,
    locked_at = now(),
    lock_expires_at = now() + make_interval(secs => v_ttl)
  where table_name = p_table_name
    and record_id = p_record_id
    and editor_user_id = auth.uid()
  returning * into v_lock;

  if v_lock.lock_id is not null then
    return jsonb_build_object(
      'acquired', true,
      'lock', jsonb_build_object(
        'table_name', v_lock.table_name,
        'record_id', v_lock.record_id,
        'editor_user_id', v_lock.editor_user_id,
        'editor_name', v_lock.editor_name,
        'lock_session_id', v_lock.lock_session_id,
        'locked_at', v_lock.locked_at,
        'heartbeat_at', v_lock.lock_expires_at
      )
    );
  end if;

  -- Attempt first acquisition. If another active lock exists, do nothing and read it below.
  insert into public.record_locks (
    table_name,
    record_id,
    editor_user_id,
    editor_name,
    lock_session_id,
    locked_at,
    lock_expires_at
  )
  values (
    p_table_name,
    p_record_id,
    auth.uid(),
    nullif(trim(p_editor_name), ''),
    coalesce(nullif(trim(p_editor_name), ''), auth.uid()::text) || ':' || gen_random_uuid()::text,
    now(),
    now() + make_interval(secs => v_ttl)
  )
  on conflict (table_name, record_id) do nothing
  returning * into v_lock;

  if v_lock.lock_id is not null then
    return jsonb_build_object(
      'acquired', true,
      'lock', jsonb_build_object(
        'table_name', v_lock.table_name,
        'record_id', v_lock.record_id,
        'editor_user_id', v_lock.editor_user_id,
        'editor_name', v_lock.editor_name,
        'lock_session_id', v_lock.lock_session_id,
        'locked_at', v_lock.locked_at,
        'heartbeat_at', v_lock.lock_expires_at
      )
    );
  end if;

  -- Someone else currently owns an active lock.
  select * into v_existing
  from public.record_locks
  where table_name = p_table_name
    and record_id = p_record_id;

  return jsonb_build_object(
    'acquired', false,
    'lock', case
      when v_existing.lock_id is null then null
      else jsonb_build_object(
        'table_name', v_existing.table_name,
        'record_id', v_existing.record_id,
        'editor_user_id', v_existing.editor_user_id,
        'editor_name', v_existing.editor_name,
        'lock_session_id', v_existing.lock_session_id,
        'locked_at', v_existing.locked_at,
        'heartbeat_at', v_existing.lock_expires_at
      )
    end
  );
end;
$function$;
