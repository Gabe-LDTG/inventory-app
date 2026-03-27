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
npx supabase --version
npx supabase login
```

### 0.2 Keep DB URLs in environment variables (recommended)

Do not hardcode passwords in terminal history if possible.

```powershell
$env:SUPABASE_DB_URL_BUGS = "postgresql://postgres.kvjpxssezujwtaxzmjze:3vH9%26jDt1HgQc2@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
$env:SUPABASE_DB_URL_MAIN = "postgresql://postgres.tnryadvlppdcltotziia:nJgw8KIf%26WQs%241@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
```

If your password has special characters, URL-encode them.

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
npx supabase db pull main_baseline --db-url "$env:SUPABASE_DB_URL_MAIN"
```

This creates one full-schema baseline migration for the current main database.

### 0.5 One-time bootstrap: mark that baseline as already applied

Find the timestamp prefix of the new baseline file. Example:

```text
20260327190000_main_baseline.sql
```

Then mark that version as already applied on the databases that already contain that schema.

```powershell
npx supabase migration repair 20260327190000 --status applied --db-url "$env:SUPABASE_DB_URL_MAIN"
npx supabase migration repair 20260327190000 --status applied --db-url "$env:SUPABASE_DB_URL_BUGS"
```

This does not run SQL. It only tells Supabase migration history that the baseline already exists on those databases.

---

## 1) Start New Schema Work (Bugs Branch)

### 1.1 Create schema changes in bugs DB

Do this in Supabase SQL editor (bugs branch) or through your normal branch environment.

### 1.2 Generate a delta migration from main -> bugs

Run from repo root where the supabase folder exists.

```powershell
npx supabase db diff --from "$env:SUPABASE_DB_URL_MAIN" --to "$env:SUPABASE_DB_URL_BUGS" -f bugs_to_main_delta
```

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
npx supabase db push --dry-run --db-url "$env:SUPABASE_DB_URL_MAIN"
```

Review output. If it looks correct, run the real apply.

If the dry run shows `relation already exists`, you are still trying to apply a full snapshot instead of a delta, or your baseline history has not been repaired yet.

---

## 4) Apply to Main After Merge

```powershell
npx supabase db push --db-url "$env:SUPABASE_DB_URL_MAIN"
```

That applies migration files in order to main.

---

## 5) Daily Workflow Template

Use this exact loop each time:

1. Make schema changes in bugs DB.
2. Generate a delta migration locally:

```powershell
npx supabase db diff --from "$env:SUPABASE_DB_URL_MAIN" --to "$env:SUPABASE_DB_URL_BUGS" -f bugs_to_main_delta
```

3. Commit migration file.
4. Open PR.
5. After merge, run:

```powershell
npx supabase db push --dry-run --db-url "$env:SUPABASE_DB_URL_MAIN"
npx supabase db push --db-url "$env:SUPABASE_DB_URL_MAIN"
```

---

## 6) Common Problems and Fixes

### Problem: pull creates empty migration file

- Cause: wrong DB URL, network issue, or no schema diff.
- Fix:

```powershell
npx supabase db pull bugs_remote_schema --db-url "$env:SUPABASE_DB_URL_BUGS" --debug
```

Then verify URL and connectivity.

### Problem: push says relation already exists

- Cause: you are applying a full schema snapshot to a database that already has those tables.
- Fix:

```powershell
npx supabase db pull main_baseline --db-url "$env:SUPABASE_DB_URL_MAIN"
npx supabase migration repair <baseline_timestamp> --status applied --db-url "$env:SUPABASE_DB_URL_MAIN"
npx supabase migration repair <baseline_timestamp> --status applied --db-url "$env:SUPABASE_DB_URL_BUGS"
npx supabase db diff --from "$env:SUPABASE_DB_URL_MAIN" --to "$env:SUPABASE_DB_URL_BUGS" -f bugs_to_main_delta
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
npx supabase db push --dry-run --db-url "$env:SUPABASE_DB_URL_MAIN"
npx supabase db push --db-url "$env:SUPABASE_DB_URL_MAIN"
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
