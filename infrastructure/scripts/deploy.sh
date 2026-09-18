#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ParkShare — Full Deployment Script
# ═══════════════════════════════════════════════════════════════
#
# Deploys the entire ParkShare stack to AWS:
#   1. Builds the backend
#   2. Deploys SAM stack (API Gateway, Lambda, DynamoDB, Cognito, S3)
#   3. Seeds demo users in Cognito
#   4. Deploys frontend to S3
#
# Usage:
#   ./scripts/deploy.sh                  # Deploy to production
#   ./scripts/deploy.sh staging          # Deploy to staging
#   ./scripts/deploy.sh production       # Deploy to production (explicit)
#
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - AWS SAM CLI installed
#   - Node.js 18+ and npm installed
#
# Owner: Person 3 (AWS Infrastructure)
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

ENVIRONMENT="${1:-production}"
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INFRA_DIR="$PROJECT_ROOT/infrastructure"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
STACK_NAME="parkshare-${ENVIRONMENT}"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🅿️  ParkShare — Deployment"
echo "═══════════════════════════════════════════════════════════"
echo "  Environment:  $ENVIRONMENT"
echo "  Stack:        $STACK_NAME"
echo "  Region:       $(aws configure get region || echo 'ap-south-1')"
echo "  Project Root: $PROJECT_ROOT"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ─── Step 1: Build Backend ────────────────────────────────────
echo "📦 Step 1: Building backend..."
cd "$BACKEND_DIR"
npm ci --prefer-offline 2>/dev/null || npm install
npm run build

# Copy the Lambda handler into the build output
cp "$INFRA_DIR/lambda/lambda.ts" "$BACKEND_DIR/src/lambda.ts"
npx tsc src/lambda.ts --outDir dist --esModuleInterop --module commonjs --target ES2020 --resolveJsonModule --skipLibCheck 2>/dev/null || true

echo "   ✅ Backend built"
echo ""

# ─── Step 2: SAM Build ───────────────────────────────────────
echo "📦 Step 2: SAM build..."
cd "$INFRA_DIR"
sam build --template-file template.yaml
echo "   ✅ SAM build complete"
echo ""

# ─── Step 3: SAM Deploy ──────────────────────────────────────
echo "🚀 Step 3: Deploying SAM stack..."
sam deploy \
  --stack-name "$STACK_NAME" \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides "Environment=$ENVIRONMENT" \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  --resolve-s3 \
  --tags "Project=ParkShare Environment=$ENVIRONMENT"

echo "   ✅ SAM stack deployed"
echo ""

# ─── Step 4: Get Stack Outputs ────────────────────────────────
echo "📋 Step 4: Reading stack outputs..."

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
echo "   API Endpoint:     $API_ENDPOINT"
echo "   Cognito Pool ID:  $COGNITO_POOL_ID"
echo "   Cognito Client:   $COGNITO_CLIENT_ID"
echo "   Images Bucket:    $IMAGES_BUCKET"
echo "   Frontend Bucket:  $FRONTEND_BUCKET"
echo "   Frontend URL:     $FRONTEND_URL"
echo ""

# ─── Step 5: Seed Cognito Users ───────────────────────────────
echo "🌱 Step 5: Seeding demo users in Cognito..."
cd "$INFRA_DIR"
COGNITO_USER_POOL_ID="$COGNITO_POOL_ID" npx ts-node scripts/cognito-setup.ts seed-demo || echo "   ⚠️  Cognito seeding skipped (may already exist)"
echo ""

# ─── Step 6: Deploy Frontend ─────────────────────────────────
if [ -d "$FRONTEND_DIR/dist" ] || [ -d "$FRONTEND_DIR/build" ] || [ -d "$FRONTEND_DIR/out" ]; then
  echo "🌐 Step 6: Deploying frontend to S3..."
  FRONTEND_BUILD_DIR="$FRONTEND_DIR/dist"
  [ -d "$FRONTEND_DIR/build" ] && FRONTEND_BUILD_DIR="$FRONTEND_DIR/build"
  [ -d "$FRONTEND_DIR/out" ] && FRONTEND_BUILD_DIR="$FRONTEND_DIR/out"

  aws s3 sync "$FRONTEND_BUILD_DIR" "s3://$FRONTEND_BUCKET" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html" \
    --exclude "*.json"

  # HTML and JSON files: short cache
  aws s3 sync "$FRONTEND_BUILD_DIR" "s3://$FRONTEND_BUCKET" \
    --cache-control "public, max-age=60" \
    --exclude "*" \
    --include "index.html" \
    --include "*.json"

  echo "   ✅ Frontend deployed to S3"
else
  echo "⏭️  Step 6: No frontend build found (skipping)"
  echo "   Person 1 needs to build the frontend first:"
  echo "   cd frontend && npm run build"
fi

echo ""

# ─── Step 7: Health Check ────────────────────────────────────
echo "🏥 Step 7: Health check..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_ENDPOINT/health" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  echo "   ✅ API is healthy! ($API_ENDPOINT/health)"
else
  echo "   ⚠️  API health check returned $HTTP_STATUS"
  echo "   This may be normal if the Lambda is cold-starting for the first time."
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Deployment Complete!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  🔗 API:      $API_ENDPOINT"
echo "  🌐 Frontend: $FRONTEND_URL"
echo ""
echo "  📋 Configuration for Person 1 (Frontend) & Person 2 (Backend):"
echo "     REACT_APP_API_URL=$API_ENDPOINT"
echo "     REACT_APP_COGNITO_USER_POOL_ID=$COGNITO_POOL_ID"
echo "     REACT_APP_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID"
echo "     REACT_APP_S3_BUCKET=$IMAGES_BUCKET"
echo "     REACT_APP_AWS_REGION=$(aws configure get region || echo 'ap-south-1')"
echo ""
echo "  🧪 Test the API:"
echo "     curl $API_ENDPOINT/health"
echo "     curl $API_ENDPOINT/parking"
echo ""
