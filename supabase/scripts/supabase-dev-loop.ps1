param(
    [switch]$ResetDb,
    [switch]$OpenStudio
)

$ErrorActionPreference = "Stop"

Write-Host "Loading saved Supabase env vars..."
$env:SUPABASE_DB_URL_BUGS_POOLER = [System.Environment]::GetEnvironmentVariable("SUPABASE_DB_URL_BUGS_POOLER", "User")
$env:SUPABASE_DB_URL_MAIN_POOLER = [System.Environment]::GetEnvironmentVariable("SUPABASE_DB_URL_MAIN_POOLER", "User")
$env:SUPABASE_DB_URL_BUGS_DIRECT = [System.Environment]::GetEnvironmentVariable("SUPABASE_DB_URL_BUGS_DIRECT", "User")
$env:SUPABASE_DB_URL_MAIN_DIRECT = [System.Environment]::GetEnvironmentVariable("SUPABASE_DB_URL_MAIN_DIRECT", "User")

Write-Host "Running health checks..."
supabase --version

docker version | Out-Null
docker ps | Out-Null

Write-Host "Starting local Supabase stack..."
supabase start
if ($LASTEXITCODE -ne 0) {
    throw "supabase start failed with exit code $LASTEXITCODE"
}

if ($ResetDb) {
    Write-Host "Resetting local DB (migrations + seed)..."
    supabase db reset
    if ($LASTEXITCODE -ne 0) {
        throw "supabase db reset failed with exit code $LASTEXITCODE"
    }
}

Write-Host ""
Write-Host "Local Supabase is ready."
Write-Host "API:    http://127.0.0.1:54321"
Write-Host "Studio: http://127.0.0.1:54323"
Write-Host ""
Write-Host "Frontend env should point to local while developing:"
Write-Host "VITE_SUPABASE_URL=http://127.0.0.1:54321"
Write-Host "VITE_SUPABASE_KEY=<local anon key from 'supabase status'>"

if ($OpenStudio) {
    Start-Process "http://127.0.0.1:54323"
}
