# Supabase Simple Migration Workflow

This workflow is for a migration-first process without local diffing.

Use this when your frontend is connected to remote dev (bugs) and you want a clean, repeatable path:

1. Create migration file
2. Write SQL changes
3. Push to remote dev (bugs)
4. Test in app
5. Promote same migration(s) to remote production (main)

## Principles

- Migration files are the source of truth.
- Do not edit old migrations after they are shared or applied.
- Add a new migration for every change after a migration has been pushed.
- Prefer small, focused migrations.

## Prerequisites

- Supabase CLI installed and logged in
- Database URLs available for bugs and main

Recommended env vars:

- SUPABASE_DB_URL_BUGS_POOLER
- SUPABASE_DB_URL_MAIN_POOLER

Load user env vars into current PowerShell session:

$env:SUPABASE_DB_URL_BUGS_POOLER = [System.Environment]::GetEnvironmentVariable("SUPABASE_DB_URL_BUGS_POOLER", "User")
$env:SUPABASE_DB_URL_MAIN_POOLER = [System.Environment]::GetEnvironmentVariable("SUPABASE_DB_URL_MAIN_POOLER", "User")

Optional sanity check:

if ([string]::IsNullOrWhiteSpace($env:SUPABASE_DB_URL_BUGS_POOLER)) { throw "SUPABASE_DB_URL_BUGS_POOLER is empty" }
if ([string]::IsNullOrWhiteSpace($env:SUPABASE_DB_URL_MAIN_POOLER)) { throw "SUPABASE_DB_URL_MAIN_POOLER is empty" }

## Standard Daily Flow

### 1) Create a migration file

Run from repo root:

supabase migration new short_description_of_change

Example:

supabase migration new add_invoice_link_bulk_rpc

This creates a timestamped SQL file in supabase/migrations.

### 2) Implement SQL in that file

Open the new migration and write the change.

Examples:

- create or replace function
- alter table add column
- create policy
- grant execute on function

### 3) Push migration(s) to remote dev (bugs)

supabase db push --db-url "$env:SUPABASE_DB_URL_BUGS_POOLER"

### 4) Test against remote dev

- Validate UI behavior
- Validate RPC calls
- Validate data shape and permissions

### 5) Promote to production (main) after validation

Recommended:

supabase db push --dry-run --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"
supabase db push --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"

## When You Need To Mark A Migration As Applied

Use this when a migration file exists in history, but you do not want to re-run it on a target database (for example, risky or already effectively present).

Important: migration repair uses only the timestamp version, not the full filename.

Example file:

20260513153945_bugs_to_main_delta.sql

Version to repair:

20260513153945

Mark as applied:

supabase migration repair 20260513153945 --status applied --db-url "$env:SUPABASE_DB_URL_BUGS_POOLER"

Or for main:

supabase migration repair 20260513153945 --status applied --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"

Verify:

supabase migration list --db-url "$env:SUPABASE_DB_URL_BUGS_POOLER"
supabase migration list --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"

## Common Issues

### Error: flag needs an argument: --db-url

Cause:

- Env var is empty in current shell

Fix:

$env:SUPABASE_DB_URL_BUGS_POOLER = [System.Environment]::GetEnvironmentVariable("SUPABASE_DB_URL_BUGS_POOLER", "User")
$env:SUPABASE_DB_URL_BUGS_POOLER

Then run:

supabase db push --db-url "$env:SUPABASE_DB_URL_BUGS_POOLER"

### Migration was already run somewhere but push still wants to run it

Use migration repair with timestamp version:

supabase migration repair <timestamp> --status applied --db-url "..."

## Team Rules (Recommended)

- One migration per logical change
- Never rewrite applied migrations
- Use forward-only fixes (new migration) for corrections
- Keep grant and RLS changes in migration files with the feature they support

## Minimal Command Cheat Sheet

Create migration:

supabase migration new your_change_name

Push to bugs:

supabase db push --db-url "$env:SUPABASE_DB_URL_BUGS_POOLER"

Dry-run main:

supabase db push --dry-run --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"

Push to main:

supabase db push --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"

Mark migration as applied:

supabase migration repair <timestamp> --status applied --db-url "$env:SUPABASE_DB_URL_BUGS_POOLER"
