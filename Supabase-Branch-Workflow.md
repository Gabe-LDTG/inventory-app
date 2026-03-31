# Supabase Branch Workflow (Bugs -> Main)

This guide is the repeatable process to move schema changes from your bugs branch database into main without retyping SQL.

## Goal

- Pull schema changes from bugs branch DB into local migration files.
- Commit migration files in GitHub PR.
- Apply those same migrations to main DB after merge.

No manual SQL re-entry. Migration files are the source of truth.

## TL;DR Command Flow

1. Pull bugs branch schema into a migration file.
2. Commit + push migration file in your bugs branch.
3. Open PR.
4. After merge, push migrations to main DB.

---

## 0) One-Time Setup

### 0.1 Install and login

```powershell
supabase --version
supabase login
```

### 0.1.1 Windows install with winget (global)

Supabase CLI blocks global npm install. On Windows, use winget:

```powershell
winget install Supabase.CLI
```

Then close and reopen terminal, and verify:

```powershell
supabase --version
```

### 0.2 Keep DB URLs in environment variables (recommended)

Do not hardcode passwords in terminal history if possible.

```powershell
$env:SUPABASE_DB_URL_BUGS_POOLER = "postgresql://postgres.kvjpxssezujwtaxzmjze:3vH9%26jDt1HgQc2@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require"
$env:SUPABASE_DB_URL_MAIN_POOLER = "postgresql://postgres.tnryadvlppdcltotziia:nJgw8KIf%26WQs%241@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require"

# Direct strings (preferred for migration tooling when Docker can reach IPv6)
$env:SUPABASE_DB_URL_BUGS_DIRECT = "postgresql://postgres:3vH9%26jDt1HgQc2@db.kvjpxssezujwtaxzmjze.supabase.co:5432/postgres?sslmode=require"
$env:SUPABASE_DB_URL_MAIN_DIRECT = "postgresql://postgres:nJgw8KIf%26WQs%241@db.tnryadvlppdcltotziia.supabase.co:5432/postgres?sslmode=require"

```

If your password has special characters, URL-encode them.

> **Important:** Always include `?sslmode=require` at the end of pooler URLs. Without it, the Supabase CLI appends `&sslmode=require` and PostgreSQL treats `postgres&sslmode=require` as the database name, causing `FATAL: database does not exist`.

> **Important:** For migration and schema-management commands such as `supabase db diff`, `supabase db pull`, `pg_dump`, and similar tooling, prefer the **direct database connection string** from the Supabase dashboard instead of the pooler URL when your network supports IPv6. Supabase recommends direct connections for migrations and management tools. The pooler is better suited to application traffic.

> **Important:** `supabase db diff` and `supabase db pull` still require Docker Desktop or a running Docker daemon, even when you use remote `--db-url`, `--from`, or `--to` values. You do not need `supabase start` for remote diffing, but Docker itself must be running because the CLI creates temporary containers and a shadow database locally.

Save all 4 URLs as persistent user env vars:

```powershell
[System.Environment]::SetEnvironmentVariable("SUPABASE_DB_URL_BUGS_POOLER", "postgresql://postgres.kvjpxssezujwtaxzmjze:3vH9%26jDt1HgQc2@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require", "User")
[System.Environment]::SetEnvironmentVariable("SUPABASE_DB_URL_MAIN_POOLER", "postgresql://postgres.tnryadvlppdcltotziia:nJgw8KIf%26WQs%241@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require", "User")
[System.Environment]::SetEnvironmentVariable("SUPABASE_DB_URL_BUGS_DIRECT", "postgresql://postgres:3vH9%26jDt1HgQc2@db.kvjpxssezujwtaxzmjze.supabase.co:5432/postgres?sslmode=require", "User")
[System.Environment]::SetEnvironmentVariable("SUPABASE_DB_URL_MAIN_DIRECT", "postgresql://postgres:nJgw8KIf%26WQs%241@db.tnryadvlppdcltotziia.supabase.co:5432/postgres?sslmode=require", "User")
```

### 0.2.1 Load saved vars into each new terminal

```powershell
$env:SUPABASE_DB_URL_BUGS_POOLER = [System.Environment]::GetEnvironmentVariable("SUPABASE_DB_URL_BUGS_POOLER", "User")
$env:SUPABASE_DB_URL_MAIN_POOLER = [System.Environment]::GetEnvironmentVariable("SUPABASE_DB_URL_MAIN_POOLER", "User")
$env:SUPABASE_DB_URL_BUGS_DIRECT = [System.Environment]::GetEnvironmentVariable("SUPABASE_DB_URL_BUGS_DIRECT", "User")
$env:SUPABASE_DB_URL_MAIN_DIRECT = [System.Environment]::GetEnvironmentVariable("SUPABASE_DB_URL_MAIN_DIRECT", "User")
```

### 0.2.2 Quick health checks before diffing

```powershell
docker version
docker ps
supabase --version
```


### 0.3 Important: why your current push failed

If you run `db pull` against an existing remote database, Supabase usually creates a full schema snapshot migration.

That file is not a safe "apply this to main" delta if main already has those tables.

That is why you saw errors like:

```text
ERROR: relation "cases" already exists
```

Your `bugs_remote_schema` file is useful as a reference snapshot, but it should not be the migration you replay onto an already-populated main database.

### 0.4 One-time bootstrap: create a baseline from main

If this project already existed before you started using migrations, do this once.

From repo root:

```powershell
supabase db pull main_baseline --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"
```

This creates one full-schema baseline migration for the current main database.

### 0.5 One-time bootstrap: mark that baseline as already applied

Find the timestamp prefix of the new baseline file. Example:

```text
20260327190000_main_baseline.sql
```

Then mark that version as already applied on the databases that already contain that schema.

```powershell
supabase migration repair 20260327190000 --status applied --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"
supabase migration repair 20260327190000 --status applied --db-url "$env:SUPABASE_DB_URL_BUGS_POOLER"
```

This does not run SQL. It only tells Supabase migration history that the baseline already exists on those databases.

---

## 1) Start New Schema Work (Bugs Branch)

### 1.1 Create schema changes in bugs DB

Do this in Supabase SQL editor (bugs branch) or through your normal branch environment.

### 1.2 Generate a delta migration from main -> bugs

Run from repo root where the supabase folder exists.

> **Important:** In CLI 2.84.2+ the new diff engine (pg-delta) outputs the SQL to stdout rather than writing directly to `supabase/migrations/`. Always capture the output with a timestamped filename as shown below.

> **Note on `sslmode=disable`:** This disables SSL/TLS encryption for the diff connection. It is safe for a read-only schema comparison on your own dev machine. It avoids the `UnknownIssuer` TLS certificate error that occurs when the diff container cannot validate the Supabase certificate chain (often caused by TLS interception from antivirus or corporate proxies). Your credentials still authenticate the connection.

```powershell
# Confirmed working on this machine (CLI 2.84.2, Windows, Docker Desktop)
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$diffFrom = "postgresql://postgres.tnryadvlppdcltotziia:nJgw8KIf%26WQs%241@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=disable"
$diffTo   = "postgresql://postgres.kvjpxssezujwtaxzmjze:3vH9%26jDt1HgQc2@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=disable"
supabase db diff --from "$diffFrom" --to "$diffTo" | Out-File -FilePath "supabase\migrations\${timestamp}_bugs_to_main_delta.sql" -Encoding UTF8
```

Verify the file was created:

```powershell
Get-ChildItem supabase\migrations\
```

Then open the file and confirm it contains only the schema changes you intended.

This creates a migration file containing only the schema differences between main and bugs.

### 1.3 Inspect what was generated

```powershell
git status
git diff -- supabase/migrations
```

Make sure the new migration file contains only the changes you actually want to promote to main.

---

## 2) Commit and PR

### 2.1 Commit migration file(s)

```powershell
git add supabase/migrations
git commit -m "Add Supabase migration from bugs branch schema"
git push
```

### 2.2 Open PR from bugs -> main

Your PR should include migration files, not manual SQL copy/paste.

---

## 3) Validate Before Touching Main

Before applying to main, run a dry run against main DB URL.

```powershell
supabase db push --dry-run --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"
```

Review output. If it looks correct, run the real apply.

If the dry run shows `relation already exists`, you are still trying to apply a full snapshot instead of a delta, or your baseline history has not been repaired yet.

---

## 4) Apply to Main After Merge

```powershell
supabase db push --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"
```

That applies migration files in order to main.

---

## 5) Daily Workflow Template

Use this exact loop each time:

1. Make schema changes in bugs DB.
2. Generate a delta migration locally:

```powershell
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$diffFrom = "postgresql://postgres.tnryadvlppdcltotziia:nJgw8KIf%26WQs%241@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=disable"
$diffTo   = "postgresql://postgres.kvjpxssezujwtaxzmjze:3vH9%26jDt1HgQc2@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=disable"
supabase db diff --from "$diffFrom" --to "$diffTo" | Out-File -FilePath "supabase\migrations\${timestamp}_bugs_to_main_delta.sql" -Encoding UTF8
```

3. Commit migration file.
4. Open PR.
5. After merge, run:

```powershell
supabase db push --dry-run --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"
supabase db push --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"
```

---

## 6) Common Problems and Fixes

### Problem: pull creates empty migration file

- Cause: wrong DB URL, network issue, or no schema diff.
- Fix:

```powershell
supabase db pull bugs_remote_schema --db-url "$env:SUPABASE_DB_URL_BUGS_POOLER" --debug
```

Then verify URL and connectivity.

### Problem: diff or pull says Docker is not running

- Cause: `supabase db diff` and `supabase db pull` use local containers for schema comparison, even when targeting remote databases.
- Fix:

```powershell
docker version
docker ps
```

If Docker is not running, start Docker Desktop and wait for the engine to finish starting, then rerun the Supabase command.

You do not need `supabase start` for remote `db diff` or remote `db pull`.

### Problem: diff says `InvalidData: invalid peer certificate: UnknownIssuer`

- Cause: the diff container cannot validate the TLS certificate for the database connection you gave it. This commonly shows up when using a pooler URL for migration tooling, or when network software is intercepting TLS.
- Fix:

```powershell
# Prefer the direct connection string from Dashboard > Connect for migration tooling.
# Replace only the host portion with your direct DB host, for example:
# db.<project-ref>.supabase.co:5432
```

- If you are currently using a pooler host like `aws-0-...pooler.supabase.com`, switch to the direct database host from the Supabase dashboard and retry.
- If direct connection fails because your current network does not support IPv6, try a network that does, or use a different machine/environment for generating the diff.
- If the same error still happens on a direct connection, check for TLS interception from antivirus, a corporate proxy, or similar network middleware.

### Problem: direct diff says `connect ECONNREFUSED ...:5432` on IPv6

- Cause: Docker container cannot reach the direct database endpoint over IPv6.
- Fix: try pooler fallback with pg-schema:

```powershell
supabase db diff --from "$env:SUPABASE_DB_URL_MAIN_POOLER" --to "$env:SUPABASE_DB_URL_BUGS_POOLER" -f bugs_to_main_delta --use-pg-schema --dns-resolver https --debug
```

- If pooler fallback then fails with `UnknownIssuer`, generate the diff on a machine/network without TLS interception and commit the migration file.

### Problem: push says relation already exists

- Cause: you are applying a full schema snapshot to a database that already has those tables.
- Fix:

```powershell
supabase db pull main_baseline --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"
supabase migration repair <baseline_timestamp> --status applied --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"
supabase migration repair <baseline_timestamp> --status applied --db-url "$env:SUPABASE_DB_URL_BUGS_POOLER"
supabase db diff --from "$env:SUPABASE_DB_URL_MAIN_DIRECT" --to "$env:SUPABASE_DB_URL_BUGS_DIRECT" -f bugs_to_main_delta --dns-resolver https --debug
```

Then apply the delta migration to main, not the snapshot file.

### Problem: branch metadata says main even though you pulled bugs

- This is expected when using explicit --db-url.
- --db-url overrides local branch-link metadata.

### Problem: PR merged but main DB did not change

- Expected unless you run db push to main (manual or CI).

### Problem: migration contains unexpected huge diff

- You likely compared the wrong databases or drift exists.
- Recheck DB URL values and confirm you are diffing `main -> bugs`.

---

## 7) Optional Automation (Recommended)

Set up GitHub Actions on merge to main:

1. Store SUPABASE_DB_URL_MAIN as GitHub secret.
2. Run:

```powershell
supabase db push --dry-run --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"
supabase db push --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"
```

This removes manual post-merge steps.

---

## 8) Safety Checklist Before Applying to Main

- Migration file exists in supabase/migrations.
- File was reviewed in PR.
- PR was merged to main.
- Dry-run against main succeeds.
- Real db push succeeds.
- App still works against main DB.

---

## 9) Emergency Recovery

If a migration was bad:

1. Create a new corrective migration (do not edit already-applied migration history).
2. Commit and push correction.
3. Apply with db push to target DB.

Treat migrations as immutable history once applied.

---

## Reality Check

Supabase can feel chaotic, but this process is stable if you do one thing consistently:

Always move schema through migration files, never ad-hoc SQL copy/paste between branches.
