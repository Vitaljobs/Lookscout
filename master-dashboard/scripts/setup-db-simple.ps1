# Database Consolidation Setup - Clean Version
# Run this in PowerShell

Write-Host "Database Consolidation Setup" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Get credentials
Write-Host "Enter Lookscout Database Credentials:" -ForegroundColor Yellow
Write-Host ""
$SUPABASE_URL = Read-Host "SUPABASE_URL"
$SUPABASE_ANON_KEY = Read-Host "SUPABASE_ANON_KEY"  
$SUPABASE_SERVICE_KEY = Read-Host "SUPABASE_SERVICE_ROLE_KEY"

if (-not $SUPABASE_URL -or -not $SUPABASE_ANON_KEY -or -not $SUPABASE_SERVICE_KEY) {
    Write-Host ""
    Write-Host "Error: All credentials required!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Credentials received!" -ForegroundColor Green
Write-Host ""

# Project configurations
$VitalJobs = @{
    Name = "VitalJobs"
    Path = "C:\Users\james\Desktop\sites\VitalJobs"
    ProjectId = "vitaljobs"
}

$CommonGround = @{
    Name = "Common Ground"
    Path = "C:\Users\james\Desktop\sites\mindgarden"
    ProjectId = "commonground"
}

$VibeChain = @{
    Name = "VibeChain"
    Path = "C:\Users\james\Desktop\sites\VibeChain"
    ProjectId = "vibechain"
}

$projects = @($VitalJobs, $CommonGround, $VibeChain)

# Update each project
foreach ($proj in $projects) {
    Write-Host "Updating $($proj.Name)..." -ForegroundColor Yellow
    
    if (-not (Test-Path $proj.Path)) {
        Write-Host "  Directory not found, skipping" -ForegroundColor Red
        Write-Host ""
        continue
    }
    
    $envPath = Join-Path $proj.Path ".env.local"
    
    # Backup existing file
    if (Test-Path $envPath) {
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $backup = "$envPath.backup-$timestamp"
        Copy-Item $envPath $backup
        Write-Host "  Backup created" -ForegroundColor Gray
    }
    
    # Create new .env.local content
    $envContent = "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY
PROJECT_ID=$($proj.ProjectId)"
    
    # Write to file
    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    
    Write-Host "  Updated .env.local" -ForegroundColor Green
    Write-Host ""
}

Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test each project with 'npm run dev'" -ForegroundColor White
Write-Host "2. Verify tables in Lookscout Supabase" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
