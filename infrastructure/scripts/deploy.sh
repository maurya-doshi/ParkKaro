#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ParkKaro — Full Deployment Script (Linux/macOS)
# ═══════════════════════════════════════════════════════════════
#
# Usage:
#   ./scripts/deploy.sh                       # Deploy (safe: skips DynamoDB table creation)
#   ./scripts/deploy.sh --env staging         # Deploy to staging
#   ./scripts/deploy.sh --create-tables       # Deploy WITH DynamoDB table creation (first time)
#   ./scripts/deploy.sh --skip-build          # Deploy without rebuilding backend
#
# IMPORTANT: By default, DynamoDB tables are NOT created/managed.
# Existing tables and their data are preserved.
# Use --create-tables ONLY on first deployment when tables don't exist.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# Parse arguments
ENVIRONMENT="production"
CREATE_TABLES="false"
SKIP_BUILD="false"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --env)        ENVIRONMENT="$2"; shift 2;;
        --create-tables) CREATE_TABLES="true"; shift;;
        --skip-build) SKIP_BUILD="true"; shift;;
        staging)      ENVIRONMENT="staging"; shift;;
        production)   ENVIRONMENT="production"; shift;;
        *)            echo "Unknown arg: $1"; exit 1;;
    esac
done

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INFRA_DIR="$PROJECT_ROOT/infrastructure"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
STACK_NAME="parkkaro-${ENVIRONMENT}"

echo ""
echo "======================================================="
echo "  ParkKaro -- AWS Deployment"
echo "======================================================="
echo "  Environment:     $ENVIRONMENT"
echo "  Stack:           $STACK_NAME"
echo "  Region:          $(aws configure get region 2>/dev/null || echo 'ap-south-1')"
echo "  Create Tables:   $CREATE_TABLES"
echo "======================================================="

if [ "$CREATE_TABLES" = "false" ]; then
    echo ""
    echo "  [SAFE MODE] DynamoDB tables will NOT be created/managed."
    echo "  Existing tables and data will be preserved."
    echo "  Use --create-tables for first-time deployment only."
fi

echo ""

# --- Step 1: Build Backend ---
if [ "$SKIP_BUILD" = "false" ]; then
    echo "[Step 1] Building backend..."
    cd "$BACKEND_DIR"
    npm ci --prefer-offline 2>/dev/null || npm install
    npm run build

    # Install serverless-http (without modifying backend package.json)
    npm install --no-save serverless-http 2>/dev/null || true

    # Place Lambda handler into dist/ without modifying backend/src/
    if [ -f "$INFRA_DIR/lambda/lambda.js" ]; then
        mkdir -p "$BACKEND_DIR/dist"
        cp "$INFRA_DIR/lambda/lambda.js" "$BACKEND_DIR/dist/lambda.js"
    fi

    echo "  [OK] Backend built"
else
    echo "[Step 1] Skipping build (--skip-build)"
fi
echo ""

# --- Step 2: SAM Build ---
echo "[Step 2] SAM build..."
cd "$INFRA_DIR"
sam build --template-file template.yaml
echo "  [OK] SAM build complete"
echo ""

# --- Step 3: SAM Deploy ---
echo "[Step 3] Deploying SAM stack..."
sam deploy \
    --stack-name "$STACK_NAME" \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --parameter-overrides "Environment=$ENVIRONMENT CreateDynamoDBTables=$CREATE_TABLES" \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset \
    --resolve-s3 \
    --tags "Project=ParkKaro Environment=$ENVIRONMENT"
echo "  [OK] SAM stack deployed"
echo ""

# --- Step 4: Get Stack Outputs ---
echo "[Step 4] Reading stack outputs..."

API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
    --output text)

COGNITO_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolId'].OutputValue" \
    --output text)

COGNITO_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='CognitoClientId'].OutputValue" \
    --output text)

IMAGES_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='ImagesBucketName'].OutputValue" \
    --output text)

FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
    --output text)

FRONTEND_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketWebsiteURL'].OutputValue" \
    --output text)

echo ""
echo "  API Endpoint:     $API_ENDPOINT"
echo "  Cognito Pool ID:  $COGNITO_POOL_ID"
echo "  Cognito Client:   $COGNITO_CLIENT_ID"
echo "  Images Bucket:    $IMAGES_BUCKET"
echo "  Frontend Bucket:  $FRONTEND_BUCKET"
echo "  Frontend URL:     $FRONTEND_URL"
echo ""

# --- Step 5: Seed Cognito Users ---
echo "[Step 5] Seeding demo users in Cognito..."
cd "$INFRA_DIR"
COGNITO_USER_POOL_ID="$COGNITO_POOL_ID" npx ts-node scripts/cognito-setup.ts seed-demo 2>/dev/null || echo "  [SKIP] Cognito seeding skipped (may already exist)"
echo ""

# --- Step 6: Deploy Frontend ---
if [ -d "$FRONTEND_DIR/dist" ] || [ -d "$FRONTEND_DIR/build" ] || [ -d "$FRONTEND_DIR/out" ]; then
    echo "[Step 6] Deploying frontend to S3..."
    FRONTEND_BUILD_DIR="$FRONTEND_DIR/dist"
    [ -d "$FRONTEND_DIR/build" ] && FRONTEND_BUILD_DIR="$FRONTEND_DIR/build"
    [ -d "$FRONTEND_DIR/out" ] && FRONTEND_BUILD_DIR="$FRONTEND_DIR/out"

    aws s3 sync "$FRONTEND_BUILD_DIR" "s3://$FRONTEND_BUCKET" \
        --delete \
        --cache-control "public, max-age=31536000, immutable" \
        --exclude "index.html" --exclude "*.json"

    aws s3 sync "$FRONTEND_BUILD_DIR" "s3://$FRONTEND_BUCKET" \
        --cache-control "public, max-age=60" \
        --exclude "*" --include "index.html" --include "*.json"

    echo "  [OK] Frontend deployed to S3"
else
    echo "[Step 6] No frontend build found (skipping)"
fi
echo ""

# --- Step 7: Health Check ---
echo "[Step 7] Health check..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT/health" 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "  [OK] API is healthy! ($API_ENDPOINT/health)"
else
    echo "  [WARN] Health check returned $HTTP_STATUS (Lambda cold start is normal)"
fi

# --- Step 8: Verify DynamoDB tables ---
echo ""
echo "[Step 8] Verifying DynamoDB tables..."
aws dynamodb list-tables --query "TableNames[?starts_with(@, 'parkkaro')]" --output table 2>/dev/null || echo "  [SKIP] Could not verify tables"

echo ""
echo "======================================================="
echo "  Deployment Complete!"
echo "======================================================="
echo ""
echo "  API:      $API_ENDPOINT"
echo "  Frontend: $FRONTEND_URL"
echo ""
echo "  Test: curl $API_ENDPOINT/health"
echo ""
