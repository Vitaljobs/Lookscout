# Quick Test Script - Verify Database Consolidation
# Run this AFTER setup-db-consolidation.ps1

Write-Host "🧪 Testing Database Consolidation" -ForegroundColor Cyan
Write-Host "=================================`n" -ForegroundColor Cyan

$PROJECTS = @(
    "C:\Users\james\Desktop\sites\VitalJobs",
    "C:\Users\james\Desktop\sites\mindgarden",
    "C:\Users\james\Desktop\sites\VibeChain"
)

foreach ($projectPath in $PROJECTS) {
    $projectName = Split-Path $projectPath -Leaf
    $envPath = Join-Path $projectPath ".env.local"
    
    Write-Host "📂 $projectName" -ForegroundColor Yellow
    
    if (-not (Test-Path $projectPath)) {
        Write-Host "   ❌ Project directory not found`n" -ForegroundColor Red
        continue
    }
    
    if (-not (Test-Path $envPath)) {
        Write-Host "   ❌ .env.local not found`n" -ForegroundColor Red
        continue
    }
    
    # Read .env.local
    $envContent = Get-Content $envPath -Raw
    
    # Check for required variables
    $hasUrl = $envContent -match "NEXT_PUBLIC_SUPABASE_URL=https://"
    $hasAnonKey = $envContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ"
    $hasServiceKey = $envContent -match "SUPABASE_SERVICE_ROLE_KEY=eyJ"
    $hasProjectId = $envContent -match "PROJECT_ID="
    
    if ($hasUrl -and $hasAnonKey -and $hasServiceKey -and $hasProjectId) {
        Write-Host "   ✅ All credentials configured" -ForegroundColor Green
        
        # Extract PROJECT_ID
        if ($envContent -match "PROJECT_ID=(\w+)") {
            Write-Host "   📌 Project ID: $($matches[1])" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  Missing credentials:" -ForegroundColor Yellow
        if (-not $hasUrl) { Write-Host "      - SUPABASE_URL" -ForegroundColor Red }
        if (-not $hasAnonKey) { Write-Host "      - ANON_KEY" -ForegroundColor Red }
        if (-not $hasServiceKey) { Write-Host "      - SERVICE_KEY" -ForegroundColor Red }
        if (-not $hasProjectId) { Write-Host "      - PROJECT_ID" -ForegroundColor Red }
    }
    
    Write-Host ""
}

Write-Host "`n✅ Test Complete!" -ForegroundColor Green
Write-Host "`nNext: Start each project with 'npm run dev' to verify connection.`n" -ForegroundColor Cyan

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
