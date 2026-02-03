# Database Consolidation Setup Script
# This script updates all projects to use the Lookscout Master Database

Write-Host "🗄️ Database Consolidation Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Step 1: Get Lookscout credentials
Write-Host "📋 Step 1: Lookscout Database Credentials" -ForegroundColor Yellow
Write-Host "Open Supabase Dashboard and copy the following from Lookscout project:`n"
Write-Host "Settings → API → Project URL and Keys`n" -ForegroundColor Gray

$SUPABASE_URL = Read-Host "Enter SUPABASE_URL (https://xxx.supabase.co)"
$SUPABASE_ANON_KEY = Read-Host "Enter SUPABASE_ANON_KEY (eyJhbGc...)"
$SUPABASE_SERVICE_KEY = Read-Host "Enter SUPABASE_SERVICE_ROLE_KEY (eyJhbGc...)"

if (-not $SUPABASE_URL -or -not $SUPABASE_ANON_KEY -or -not $SUPABASE_SERVICE_KEY) {
    Write-Host "`n❌ Error: All credentials are required!" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Credentials received!`n" -ForegroundColor Green

# Step 2: Define project paths
$PROJECTS = @(
    @{
        Name = "VitalJobs"
        Path = "C:\Users\james\Desktop\sites\VitalJobs"
        ProjectId = "vitaljobs"
    },
    @{
        Name = "Common Ground"
        Path = "C:\Users\james\Desktop\sites\mindgarden"
        ProjectId = "commonground"
    },
    @{
        Name = "VibeChain"
        Path = "C:\Users\james\Desktop\sites\VibeChain"
        ProjectId = "vibechain"
    }
)

# Step 3: Update each project
foreach ($project in $PROJECTS) {
    Write-Host "🔧 Updating $($project.Name)..." -ForegroundColor Yellow
    
    $envPath = Join-Path $project.Path ".env.local"
    
    # Check if project directory exists
    if (-not (Test-Path $project.Path)) {
        Write-Host "   ⚠️  Directory not found: $($project.Path)" -ForegroundColor Red
        Write-Host "   Skipping...`n" -ForegroundColor Gray
        continue
    }
    
    # Backup existing .env.local if it exists
    if (Test-Path $envPath) {
        $backupPath = "$envPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $envPath $backupPath
        Write-Host "   📦 Backup created: .env.local.backup" -ForegroundColor Gray
    }
    
    # Create new .env.local content
    $envContent = @"
# Lookscout Master Database (Consolidated)
# Updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_KEY

# Project Identifier
PROJECT_ID=$($project.ProjectId)

# Optional: Keep old credentials as backup (commented out)
# OLD_SUPABASE_URL=your-old-url
# OLD_SUPABASE_ANON_KEY=your-old-key
"@
    
    # Write to file
    Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    
    Write-Host "   ✅ Updated .env.local" -ForegroundColor Green
    Write-Host "   📍 Path: $envPath`n" -ForegroundColor Gray
}

# Step 4: Summary
Write-Host "`n🎉 Database Consolidation Complete!" -ForegroundColor Green
Write-Host "==================================`n" -ForegroundColor Green

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Test each project:" -ForegroundColor White
foreach ($project in $PROJECTS) {
    if (Test-Path $project.Path) {
        Write-Host "   cd $($project.Path)" -ForegroundColor Gray
        Write-Host "   npm run dev`n" -ForegroundColor Gray
    }
}

Write-Host "2. Verify in Supabase:" -ForegroundColor White
Write-Host "   Open Lookscout Supabase → Table Editor" -ForegroundColor Gray
Write-Host "   You should see tables from all projects`n" -ForegroundColor Gray

Write-Host "3. Optional: Pause old Supabase projects" -ForegroundColor White
Write-Host "   (After verifying everything works)`n" -ForegroundColor Gray

Write-Host "📚 Full documentation: walkthrough_db_consolidation.md`n" -ForegroundColor Cyan

# Pause for user to read
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
