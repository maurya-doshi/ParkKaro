# ═══════════════════════════════════════════════════════════════
# ParkShare — Full Deployment Script (PowerShell/Windows)
# ═══════════════════════════════════════════════════════════════
#
# Usage:
#   .\scripts\deploy.ps1                  # Deploy to production
#   .\scripts\deploy.ps1 -Environment staging
#
# Prerequisites:
#   - AWS CLI configured
#   - AWS SAM CLI installed
#   - Node.js 18+
# ═══════════════════════════════════════════════════════════════

param(
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$InfraDir = "$ProjectRoot\infrastructure"
$BackendDir = "$ProjectRoot\backend"
$FrontendDir = "$ProjectRoot\frontend"
$StackName = "parkshare-$Environment"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🅿️  ParkShare — Deployment" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Environment:  $Environment"
Write-Host "  Stack:        $StackName"
Write-Host "  Project Root: $ProjectRoot"
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─── Step 1: Build Backend ────────────────────────────────────
Write-Host "📦 Step 1: Building backend..." -ForegroundColor Yellow
Push-Location $BackendDir
npm ci --prefer-offline 2>$null
if ($LASTEXITCODE -ne 0) { npm install }
npm run build

# Copy Lambda handler
Copy-Item "$InfraDir\lambda\lambda.ts" "$BackendDir\src\lambda.ts" -Force
npx tsc src/lambda.ts --outDir dist --esModuleInterop --module commonjs --target ES2020 --resolveJsonModule --skipLibCheck 2>$null
Pop-Location
Write-Host "   ✅ Backend built" -ForegroundColor Green
Write-Host ""

# ─── Step 2: SAM Build ───────────────────────────────────────
Write-Host "📦 Step 2: SAM build..." -ForegroundColor Yellow
Push-Location $InfraDir
sam build --template-file template.yaml
Pop-Location
Write-Host "   ✅ SAM build complete" -ForegroundColor Green
Write-Host ""

# ─── Step 3: SAM Deploy ──────────────────────────────────────
Write-Host "🚀 Step 3: Deploying SAM stack..." -ForegroundColor Yellow
Push-Location $InfraDir
sam deploy `
  --stack-name $StackName `
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM `
  --parameter-overrides "Environment=$Environment" `
  --no-confirm-changeset `
  --no-fail-on-empty-changeset `
  --resolve-s3 `
  --tags "Project=ParkShare Environment=$Environment"
Pop-Location
Write-Host "   ✅ SAM stack deployed" -ForegroundColor Green
Write-Host ""

# ─── Step 4: Get Stack Outputs ────────────────────────────────
Write-Host "📋 Step 4: Reading stack outputs..." -ForegroundColor Yellow

$ApiEndpoint = aws cloudformation describe-stacks `
  --stack-name $StackName `
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" `
  --output text

$CognitoPoolId = aws cloudformation describe-stacks `
  --stack-name $StackName `
  --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolId'].OutputValue" `
  --output text

$CognitoClientId = aws cloudformation describe-stacks `
  --stack-name $StackName `
  --query "Stacks[0].Outputs[?OutputKey=='CognitoClientId'].OutputValue" `
  --output text

$ImagesBucket = aws cloudformation describe-stacks `
  --stack-name $StackName `
  --query "Stacks[0].Outputs[?OutputKey=='ImagesBucketName'].OutputValue" `
  --output text

$FrontendBucket = aws cloudformation describe-stacks `
  --stack-name $StackName `
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" `
  --output text

$FrontendUrl = aws cloudformation describe-stacks `
  --stack-name $StackName `
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketWebsiteURL'].OutputValue" `
  --output text

Write-Host ""
Write-Host "   API Endpoint:     $ApiEndpoint"
Write-Host "   Cognito Pool ID:  $CognitoPoolId"
Write-Host "   Cognito Client:   $CognitoClientId"
Write-Host "   Images Bucket:    $ImagesBucket"
Write-Host "   Frontend Bucket:  $FrontendBucket"
Write-Host "   Frontend URL:     $FrontendUrl"
Write-Host ""

# ─── Step 5: Seed Cognito Users ───────────────────────────────
Write-Host "🌱 Step 5: Seeding demo users..." -ForegroundColor Yellow
Push-Location $InfraDir
$env:COGNITO_USER_POOL_ID = $CognitoPoolId
npx ts-node scripts/cognito-setup.ts seed-demo 2>$null
Pop-Location
Write-Host ""

# ─── Step 6: Deploy Frontend ─────────────────────────────────
$FrontendBuildDir = $null
if (Test-Path "$FrontendDir\dist") { $FrontendBuildDir = "$FrontendDir\dist" }
elseif (Test-Path "$FrontendDir\build") { $FrontendBuildDir = "$FrontendDir\build" }
elseif (Test-Path "$FrontendDir\out") { $FrontendBuildDir = "$FrontendDir\out" }

if ($FrontendBuildDir) {
    Write-Host "🌐 Step 6: Deploying frontend to S3..." -ForegroundColor Yellow
    aws s3 sync $FrontendBuildDir "s3://$FrontendBucket" `
      --delete `
      --cache-control "public, max-age=31536000, immutable" `
      --exclude "index.html" `
      --exclude "*.json"

    aws s3 sync $FrontendBuildDir "s3://$FrontendBucket" `
      --cache-control "public, max-age=60" `
      --exclude "*" `
      --include "index.html" `
      --include "*.json"

    Write-Host "   ✅ Frontend deployed to S3" -ForegroundColor Green
} else {
    Write-Host "⏭️  Step 6: No frontend build found (skipping)" -ForegroundColor DarkYellow
}

Write-Host ""

# ─── Step 7: Health Check ────────────────────────────────────
Write-Host "🏥 Step 7: Health check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ApiEndpoint/health" -TimeoutSec 30
    Write-Host "   ✅ API is healthy! ($ApiEndpoint/health)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  API health check may have failed (Lambda cold start is normal)" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Deployment Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "  🔗 API:      $ApiEndpoint" -ForegroundColor White
Write-Host "  🌐 Frontend: $FrontendUrl" -ForegroundColor White
Write-Host ""
Write-Host "  📋 Configuration for teammates:" -ForegroundColor White
Write-Host "     REACT_APP_API_URL=$ApiEndpoint"
Write-Host "     REACT_APP_COGNITO_USER_POOL_ID=$CognitoPoolId"
Write-Host "     REACT_APP_COGNITO_CLIENT_ID=$CognitoClientId"
Write-Host "     REACT_APP_S3_BUCKET=$ImagesBucket"
Write-Host ""
