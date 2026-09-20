# ═══════════════════════════════════════════════════════════════
# ParkShare — Full Deployment Script (PowerShell/Windows)
# ═══════════════════════════════════════════════════════════════
#
# Usage:
#   .\scripts\deploy.ps1                              # Deploy (safe: skips DynamoDB table creation)
#   .\scripts\deploy.ps1 -Environment staging         # Deploy staging
#   .\scripts\deploy.ps1 -CreateTables                # Deploy with DynamoDB table creation (first time only)
#   .\scripts\deploy.ps1 -SkipBuild                   # Deploy without rebuilding
#
# Prerequisites:
#   - AWS CLI v2 configured (aws configure)
#   - AWS SAM CLI installed
#   - Node.js 18+
#
# IMPORTANT: By default, this script does NOT create DynamoDB tables.
# Existing tables and their data are preserved.
# Use -CreateTables only on first deployment when tables don't exist.
# ═══════════════════════════════════════════════════════════════

param(
    [string]$Environment = "production",
    [switch]$CreateTables = $false,
    [switch]$SkipBuild = $false
)

# Ensure Node.js, AWS CLI, and SAM CLI are in PATH for this session
if (Test-Path "C:\Program Files\nodejs") {
    $env:PATH = "C:\Program Files\nodejs;$env:PATH"
}
if (Test-Path "C:\Program Files\Amazon\AWSCLIV2") {
    $env:PATH = "C:\Program Files\Amazon\AWSCLIV2;$env:PATH"
}
if (Test-Path "C:\Program Files\Amazon\AWSSAMCLI\bin") {
    $env:PATH = "C:\Program Files\Amazon\AWSSAMCLI\bin;$env:PATH"
}

$ErrorActionPreference = "Stop"

$ProjectRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$InfraDir = "$ProjectRoot\infrastructure"
$BackendDir = "$ProjectRoot\backend"
$FrontendDir = "$ProjectRoot\frontend"
$StackName = "parkshare-$Environment"
$DynamoDBSafe = if ($CreateTables) { "true" } else { "false" }

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  ParkShare -- AWS Deployment" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Environment:     $Environment"
Write-Host "  Stack:           $StackName"
Write-Host "  Project Root:    $ProjectRoot"
Write-Host "  Create Tables:   $DynamoDBSafe"
Write-Host "=======================================================" -ForegroundColor Cyan

if (-not $CreateTables) {
    Write-Host ""
    Write-Host "  [SAFE MODE] DynamoDB tables will NOT be created/managed." -ForegroundColor Green
    Write-Host "  Existing tables and data will be preserved." -ForegroundColor Green
    Write-Host "  Use -CreateTables flag for first-time deployment only." -ForegroundColor Green
}

Write-Host ""

# --- Step 1: Build Backend ---
if (-not $SkipBuild) {
    Write-Host "[Step 1] Building backend..." -ForegroundColor Yellow
    Push-Location $BackendDir
    
    # Install dependencies
    $oldEAP = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    if (Test-Path "package-lock.json") {
        npm ci --prefer-offline 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) { npm install 2>&1 | Out-Null }
    } else {
        npm install 2>&1 | Out-Null
    }
    
    # Build TypeScript
    npm run build
    
    # Install serverless-http for Lambda (without touching backend package.json)
    npm install --no-save serverless-http 2>&1 | Out-Null
    $ErrorActionPreference = $oldEAP
    
    # Place Lambda handler into backend dist/ without touching backend/src/
    if (Test-Path "$InfraDir\lambda\lambda.js") {
        if (-not (Test-Path "$BackendDir\dist")) { New-Item -ItemType Directory -Path "$BackendDir\dist" -Force | Out-Null }
        Copy-Item "$InfraDir\lambda\lambda.js" "$BackendDir\dist\lambda.js" -Force
    }
    
    Pop-Location
    Write-Host "  [OK] Backend built" -ForegroundColor Green
} else {
    Write-Host "[Step 1] Skipping build (--SkipBuild)" -ForegroundColor DarkYellow
}
Write-Host ""

# --- Step 2: SAM Build ---
Write-Host "[Step 2] SAM build..." -ForegroundColor Yellow
Push-Location $InfraDir
sam build --template-file template.yaml
Pop-Location
Write-Host "  [OK] SAM build complete" -ForegroundColor Green
Write-Host ""

# --- Step 3: SAM Deploy ---
Write-Host "[Step 3] Deploying SAM stack..." -ForegroundColor Yellow
Push-Location $InfraDir
sam deploy `
    --stack-name $StackName `
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM `
    --parameter-overrides "Environment=$Environment CreateDynamoDBTables=$DynamoDBSafe" `
    --no-confirm-changeset `
    --no-fail-on-empty-changeset `
    --resolve-s3 `
    --tags "Project=ParkShare Environment=$Environment"
Pop-Location
Write-Host "  [OK] SAM stack deployed" -ForegroundColor Green
Write-Host ""

# --- Step 4: Get Stack Outputs ---
Write-Host "[Step 4] Reading stack outputs..." -ForegroundColor Yellow

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
Write-Host "  API Endpoint:     $ApiEndpoint"
Write-Host "  Cognito Pool ID:  $CognitoPoolId"
Write-Host "  Cognito Client:   $CognitoClientId"
Write-Host "  Images Bucket:    $ImagesBucket"
Write-Host "  Frontend Bucket:  $FrontendBucket"
Write-Host "  Frontend URL:     $FrontendUrl"
Write-Host ""

# --- Step 5: Seed Cognito Users ---
Write-Host "[Step 5] Seeding demo users in Cognito..." -ForegroundColor Yellow
Push-Location $InfraDir
$env:COGNITO_USER_POOL_ID = $CognitoPoolId
try {
    npx ts-node scripts/cognito-setup.ts seed-demo 2>$null
    Write-Host "  [OK] Demo users seeded" -ForegroundColor Green
} catch {
    Write-Host "  [SKIP] Cognito seeding skipped (may already exist)" -ForegroundColor DarkYellow
}
Pop-Location
Write-Host ""

# --- Step 6: Deploy Frontend ---
$FrontendBuildDir = $null
if (Test-Path "$FrontendDir\dist") { $FrontendBuildDir = "$FrontendDir\dist" }
elseif (Test-Path "$FrontendDir\build") { $FrontendBuildDir = "$FrontendDir\build" }
elseif (Test-Path "$FrontendDir\out") { $FrontendBuildDir = "$FrontendDir\out" }

if ($FrontendBuildDir) {
    Write-Host "[Step 6] Deploying frontend to S3..." -ForegroundColor Yellow
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

    Write-Host "  [OK] Frontend deployed to S3" -ForegroundColor Green
} else {
    Write-Host "[Step 6] No frontend build found (skipping)" -ForegroundColor DarkYellow
    Write-Host "  Person 1 needs to build: cd frontend; npm run build" -ForegroundColor DarkYellow
}
Write-Host ""

# --- Step 7: Health Check ---
Write-Host "[Step 7] Health check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$ApiEndpoint/health" -TimeoutSec 30
    Write-Host "  [OK] API is healthy! ($ApiEndpoint/health)" -ForegroundColor Green
    Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "  [WARN] Health check response pending (Lambda cold start is normal)" -ForegroundColor DarkYellow
}

# --- Step 8: Verify DynamoDB tables still exist ---
Write-Host ""
Write-Host "[Step 8] Verifying DynamoDB tables..." -ForegroundColor Yellow
try {
    $tables = aws dynamodb list-tables --query "TableNames[?starts_with(@, 'parkshare')]" --output json | ConvertFrom-Json
    Write-Host "  Found $($tables.Count) parkshare tables:" -ForegroundColor Green
    foreach ($t in $tables) {
        Write-Host "    - $t" -ForegroundColor Gray
    }
} catch {
    Write-Host "  [SKIP] Could not list tables (check AWS CLI config)" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  API:      $ApiEndpoint" -ForegroundColor White
Write-Host "  Frontend: $FrontendUrl" -ForegroundColor White
Write-Host ""
Write-Host "  Configuration for teammates:" -ForegroundColor White
Write-Host "    REACT_APP_API_URL=$ApiEndpoint"
Write-Host "    REACT_APP_COGNITO_USER_POOL_ID=$CognitoPoolId"
Write-Host "    REACT_APP_COGNITO_CLIENT_ID=$CognitoClientId"
Write-Host "    REACT_APP_S3_BUCKET=$ImagesBucket"
Write-Host "    REACT_APP_AWS_REGION=ap-south-1"
Write-Host ""
Write-Host "  Test: curl $ApiEndpoint/health" -ForegroundColor Gray
Write-Host ""
