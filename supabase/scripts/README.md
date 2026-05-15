# Supabase Scripts Quickstart

This folder contains helper scripts for fast local Supabase development and safe branch-to-main promotion.

## Scripts

- `supabase-dev-loop.ps1`
- `supabase-promote-delta.ps1`

## Prerequisites

- Supabase CLI installed and available in PATH
- Docker Desktop running
- User-level environment variables set:
  - `SUPABASE_DB_URL_BUGS_POOLER`
  - `SUPABASE_DB_URL_MAIN_POOLER`
  - (optional) `SUPABASE_DB_URL_BUGS_DIRECT`
  - (optional) `SUPABASE_DB_URL_MAIN_DIRECT`

## Run From Repo Root

Start local stack:

```powershell
.\supabase\scripts\supabase-dev-loop.ps1 -OpenStudio
```

Start local stack and fully rebuild local DB from migrations + seed:

```powershell
.\supabase\scripts\supabase-dev-loop.ps1 -ResetDb -OpenStudio
```

Create a delta migration from `main` schema to `bugs` schema and dry-run push against `main`:

```powershell
.\supabase\scripts\supabase-promote-delta.ps1
```

## Local Frontend Env

While developing locally, point your frontend to local Supabase:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_KEY=<local anon key from `supabase status`>
```

## Daily Workflow (Recommended)

1. Run local loop script and develop against local Studio/API.
2. Add migration(s) for schema changes.
3. Validate with `supabase db reset`.
4. Generate bugs-to-main delta migration.
5. Commit migration file(s), open PR.
6. After merge, run `supabase db push --db-url <main-db-url>`.

## Notes

- The promote script sets `sslmode=disable` only for `supabase db diff` to avoid known TLS-chain issues in some local Windows/Docker environments.
- Keep migration files small and focused. It makes reviews and rollback planning much easier.
