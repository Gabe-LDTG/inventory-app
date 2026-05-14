$ErrorActionPreference = "Stop"

Write-Host "Loading required env vars..."
$env:SUPABASE_DB_URL_BUGS_POOLER = [System.Environment]::GetEnvironmentVariable("SUPABASE_DB_URL_BUGS_POOLER", "User")
$env:SUPABASE_DB_URL_MAIN_POOLER = [System.Environment]::GetEnvironmentVariable("SUPABASE_DB_URL_MAIN_POOLER", "User")

if ([string]::IsNullOrWhiteSpace($env:SUPABASE_DB_URL_BUGS_POOLER) -or [string]::IsNullOrWhiteSpace($env:SUPABASE_DB_URL_MAIN_POOLER)) {
    throw "Missing SUPABASE_DB_URL_BUGS_POOLER or SUPABASE_DB_URL_MAIN_POOLER user env var."
}

# For diff-container TLS issues on some Windows setups, use sslmode=disable only for diff.
$diffFrom = $env:SUPABASE_DB_URL_MAIN_POOLER -replace "sslmode=require", "sslmode=disable"
$diffTo = $env:SUPABASE_DB_URL_BUGS_POOLER -replace "sslmode=require", "sslmode=disable"

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$migrationPath = "supabase\migrations\${timestamp}_bugs_to_main_delta.sql"

Write-Host "Generating schema diff (main -> bugs)..."
$sql = supabase db diff --from "$diffFrom" --to "$diffTo"

[System.IO.File]::WriteAllText($migrationPath, $sql, (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Created migration: $migrationPath"

Write-Host "Running dry-run push against main..."
supabase db push --dry-run --db-url "$env:SUPABASE_DB_URL_MAIN_POOLER"

Write-Host ""
Write-Host "Next steps:"
Write-Host "1) Review the migration SQL file"
Write-Host "2) Commit and open PR"
Write-Host "3) After merge, run: supabase db push --db-url \"$env:SUPABASE_DB_URL_MAIN_POOLER\""
