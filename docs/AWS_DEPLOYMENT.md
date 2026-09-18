# ParkShare — AWS Deployment Guide

> **Owner:** Person 3 (AWS Infrastructure)
> **Last Updated:** 2026-09-18
> **Target Region:** `ap-south-1` (Mumbai)

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Local Development Setup](#local-development-setup)
4. [AWS Deployment](#aws-deployment)
5. [Post-Deployment Configuration](#post-deployment-configuration)
6. [Frontend Deployment](#frontend-deployment)
7. [Environment Variables Reference](#environment-variables-reference)
8. [Monitoring & Logs](#monitoring--logs)
9. [Rollback & Recovery](#rollback--recovery)
10. [Troubleshooting](#troubleshooting)
11. [Team Configuration](#team-configuration)

---

## Prerequisites

### Required Tools

| Tool | Version | Installation |
|------|---------|-------------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **npm** | 9+ | Comes with Node.js |
| **AWS CLI** | 2.x | [AWS CLI Install](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| **AWS SAM CLI** | 1.x | [SAM CLI Install](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) |
| **Docker** | 20+ | [docker.com](https://docker.com/) (optional, for DynamoDB Local) |

### AWS Account Setup

1. **Create/use an AWS account** with billing enabled
2. **Create an IAM user** with programmatic access:
   - Attach policies: `AdministratorAccess` (for hackathon) or specific policies:
     - `AmazonDynamoDBFullAccess`
     - `AmazonCognitoPowerUser`
     - `AmazonS3FullAccess`
     - `AWSLambda_FullAccess`
     - `AmazonAPIGatewayAdministrator`
     - `AmazonBedrockFullAccess`
     - `CloudWatchFullAccess`
     - `IAMFullAccess`
     - `AWSCloudFormationFullAccess`
3. **Configure AWS CLI:**
   ```bash
   aws configure
   # AWS Access Key ID: <your-key>
   # AWS Secret Access Key: <your-secret>
   # Default region name: ap-south-1
   # Default output format: json
   ```

---

## Quick Start

### One-Command Deployment

**Linux/macOS:**
```bash
cd infrastructure
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**Windows (PowerShell):**
```powershell
cd infrastructure
.\scripts\deploy.ps1
```

This will:
1. ✅ Build the backend (TypeScript → JavaScript)
2. ✅ Build the SAM template
3. ✅ Deploy the CloudFormation stack (all AWS resources)
4. ✅ Output all configuration values
5. ✅ Seed demo users in Cognito
6. ✅ Deploy frontend to S3 (if built)
7. ✅ Run health check

---

## Local Development Setup

### Step 1: Start DynamoDB Local

```bash
# Using Docker
docker run -p 8000:8000 amazon/dynamodb-local

# Or using DynamoDB Local JAR
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -port 8000
```

### Step 2: Create Local Tables

```bash
cd infrastructure
npm install
npm run create-tables-local
```

This creates all 14 DynamoDB tables with correct schemas and GSIs.

### Step 3: Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
# For local development
AWS_REGION=ap-south-1
DYNAMODB_TABLE_PREFIX=parkshare
DYNAMODB_ENDPOINT=http://localhost:8000
AUTH_MODE=demo
PORT=3001
NODE_ENV=development
PLATFORM_COMMISSION_PERCENT=10
TAX_PERCENT=0
```

### Step 4: Start Backend

```bash
cd backend
npm install
npm run dev
```

### Step 5: Seed Demo Data

```bash
cd backend
npm run seed
```

### Step 6: Test

```bash
# Health check
curl http://localhost:3001/health

# List parking (demo auth)
curl -H "X-Demo-User-Id: user_1" \
     -H "X-Demo-Role: DRIVER" \
     http://localhost:3001/parking
```

---

## AWS Deployment

### Step-by-Step Manual Deployment

#### 1. Install Infrastructure Dependencies

```bash
cd infrastructure
npm install
```

#### 2. Build Backend

```bash
cd backend
npm ci
npm run build
```

#### 3. Prepare Lambda Handler

The Lambda handler (`infrastructure/lambda/lambda.ts`) wraps the Express app:

```bash
# Copy to backend src and compile
cp infrastructure/lambda/lambda.ts backend/src/lambda.ts
cd backend
npx tsc src/lambda.ts --outDir dist --esModuleInterop --module commonjs --target ES2020 --resolveJsonModule --skipLibCheck
```

#### 4. Validate SAM Template

```bash
cd infrastructure
sam validate --template-file template.yaml
```

#### 5. Build SAM Application

```bash
sam build --template-file template.yaml
```

#### 6. Deploy

```bash
# First deployment (creates S3 bucket for artifacts)
sam deploy \
  --stack-name parkshare-production \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides Environment=production \
  --resolve-s3 \
  --tags "Project=ParkShare Environment=production"

# Subsequent deployments
sam deploy
```

#### 7. Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name parkshare-production \
  --query 'Stacks[0].Outputs' \
  --output table
```

Key outputs:
| Output | Description |
|--------|-------------|
| `ApiEndpoint` | Public API URL |
| `CognitoUserPoolId` | Cognito Pool ID |
| `CognitoClientId` | Cognito Client ID |
| `ImagesBucketName` | S3 bucket for images |
| `FrontendBucketName` | S3 bucket for frontend |
| `FrontendBucketWebsiteURL` | Frontend URL |

---

## Post-Deployment Configuration

### Seed Cognito Demo Users

```bash
cd infrastructure

# Set the Cognito Pool ID from stack outputs
export COGNITO_USER_POOL_ID=<pool-id-from-outputs>

# Seed demo users
npx ts-node scripts/cognito-setup.ts seed-demo
```

This creates:
| Email | Role | Password |
|-------|------|----------|
| admin@parkshare.com | ADMIN | Admin@2026! |
| host1@parkshare.com | HOST | Host@2026! |
| host2@parkshare.com | HOST | Host@2026! |
| driver1@parkshare.com | DRIVER | Driver@2026! |
| driver2@parkshare.com | DRIVER | Driver@2026! |

### Verify API Health

```bash
curl https://<api-id>.execute-api.ap-south-1.amazonaws.com/production/health
```

Expected response:
```json
{"status": "ok", "timestamp": "2026-09-18T..."}
```

---

## Frontend Deployment

### Step 1: Build Frontend

```bash
cd frontend
npm ci
npm run build
```

### Step 2: Configure Frontend Environment

Create/update the frontend environment file with stack outputs:

```env
REACT_APP_API_URL=https://<api-id>.execute-api.ap-south-1.amazonaws.com/production
REACT_APP_COGNITO_USER_POOL_ID=<cognito-pool-id>
REACT_APP_COGNITO_CLIENT_ID=<cognito-client-id>
REACT_APP_S3_BUCKET=<images-bucket-name>
REACT_APP_AWS_REGION=ap-south-1
```

### Step 3: Deploy to S3

```bash
# Get frontend bucket name
FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name parkshare-production \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text)

# Sync build to S3
aws s3 sync frontend/dist "s3://$FRONTEND_BUCKET" --delete

# The frontend URL is the S3 website endpoint:
# http://<frontend-bucket>.s3-website.ap-south-1.amazonaws.com
```

---

## Environment Variables Reference

### Backend Lambda (Auto-configured by CloudFormation)

| Variable | Value | Source |
|----------|-------|--------|
| `NODE_ENV` | `production`/`staging` | Parameter |
| `AWS_REGION_NAME` | `ap-south-1` | CloudFormation |
| `DYNAMODB_TABLE_PREFIX` | `parkshare` | Parameter |
| `COGNITO_USER_POOL_ID` | Auto | CloudFormation ref |
| `COGNITO_CLIENT_ID` | Auto | CloudFormation ref |
| `S3_BUCKET_NAME` | Auto | CloudFormation ref |
| `AUTH_MODE` | `cognito` | Template |
| `PLATFORM_COMMISSION_PERCENT` | `10` | Parameter |
| `TAX_PERCENT` | `0` | Parameter |

### Frontend (Manual configuration)

| Variable | Source |
|----------|--------|
| `REACT_APP_API_URL` | Stack output: `ApiEndpoint` |
| `REACT_APP_COGNITO_USER_POOL_ID` | Stack output: `CognitoUserPoolId` |
| `REACT_APP_COGNITO_CLIENT_ID` | Stack output: `CognitoClientId` |
| `REACT_APP_S3_BUCKET` | Stack output: `ImagesBucketName` |
| `REACT_APP_AWS_REGION` | `ap-south-1` |

---

## Monitoring & Logs

### View Lambda Logs

```bash
# Tail logs in real-time
sam logs --stack-name parkshare-production --tail

# View recent logs
sam logs --stack-name parkshare-production --start-time "5min ago"

# Filter for errors
sam logs --stack-name parkshare-production --filter "ERROR"
```

### CloudWatch Dashboard

Access the monitoring dashboard:
1. Go to AWS Console → CloudWatch → Dashboards
2. Open `ParkShare-production`

Metrics available:
- Lambda: Invocations, Errors, Duration (avg & p99), Throttles
- API Gateway: Request count, 4XX errors, 5XX errors, Latency
- DynamoDB: Read/Write capacity consumption
- Cognito: Sign-in successes

### CloudWatch Alarms

| Alarm | Triggers When |
|-------|---------------|
| `parkshare-lambda-errors-production` | > 10 errors in 5 min |
| `parkshare-api-5xx-production` | > 5 server errors in 5 min |
| `parkshare-lambda-duration-production` | p99 > 10s for 3 consecutive periods |

---

## Rollback & Recovery

### Rollback to Previous Deployment

```bash
# List recent deployments
aws cloudformation describe-stack-events \
  --stack-name parkshare-production \
  --max-items 20

# Rollback to previous version
aws cloudformation rollback-stack \
  --stack-name parkshare-production
```

### Rollback Lambda to Previous Version

```bash
# List Lambda versions
aws lambda list-versions-by-function \
  --function-name parkshare-backend-production

# Update alias to point to previous version
aws lambda update-alias \
  --function-name parkshare-backend-production \
  --name live \
  --function-version <previous-version>
```

### DynamoDB Recovery

- **Point-in-time recovery** is enabled for production tables
- Recovery window: up to 35 days
- Use AWS Console → DynamoDB → Tables → Backups → Restore

### Full Stack Deletion

> ⚠️ **WARNING:** This deletes all infrastructure EXCEPT DynamoDB tables and S3 buckets (which have DeletionPolicy: Retain).

```bash
sam delete --stack-name parkshare-production --no-prompts
```

To also delete retained resources:
```bash
# Delete DynamoDB tables
for table in users parking bookings slot-locks vehicles reviews favorites payments payouts notifications conversations messages disputes reports; do
  aws dynamodb delete-table --table-name "parkshare-$table" 2>/dev/null
done

# Empty and delete S3 buckets
aws s3 rb s3://parkshare-images-production-<account-id> --force
aws s3 rb s3://parkshare-frontend-production-<account-id> --force
```

---

## Troubleshooting

### Common Issues

#### Lambda Cold Start Slow
- **Symptom:** First request takes 3-5 seconds
- **Solution:** Normal behavior for Node.js Lambda. The 1024MB memory allocation helps minimize this.

#### "Internal Server Error" from API Gateway
- **Check:** Lambda CloudWatch logs for the actual error
  ```bash
  sam logs --stack-name parkshare-production --filter "ERROR"
  ```

#### CORS Errors from Frontend
- **Check:** API Gateway CORS configuration allows the frontend origin
- **Verify:** OPTIONS preflight requests return correct headers
- The template allows `*` origin by default; restrict for production

#### DynamoDB "ResourceNotFoundException"
- **Check:** Tables exist with correct prefix
  ```bash
  aws dynamodb list-tables --query "TableNames[?starts_with(@, 'parkshare')]"
  ```
- **Check:** `DYNAMODB_TABLE_PREFIX` environment variable matches

#### Cognito "NotAuthorizedException"
- **Check:** User exists and password is correct
- **Check:** User pool ID and client ID are correct
- **Check:** `AUTH_MODE=cognito` is set

#### S3 Access Denied
- **Check:** Lambda role has S3 permissions
- **Check:** Bucket policy allows the operation
- **Check:** Bucket name is correct in environment variables

### Useful Debug Commands

```bash
# Check stack status
aws cloudformation describe-stacks --stack-name parkshare-production \
  --query 'Stacks[0].StackStatus'

# Check Lambda configuration
aws lambda get-function-configuration \
  --function-name parkshare-backend-production

# Test API directly
curl -v https://<api-id>.execute-api.ap-south-1.amazonaws.com/production/health

# Check Cognito users
COGNITO_USER_POOL_ID=<pool-id> npx ts-node infrastructure/scripts/cognito-setup.ts list-users

# List DynamoDB tables
aws dynamodb list-tables

# Check CloudWatch alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix parkshare
```

---

## Team Configuration

### For Person 1 (Frontend)

After deployment, provide these values:

```env
REACT_APP_API_URL=<ApiEndpoint from stack outputs>
REACT_APP_COGNITO_USER_POOL_ID=<CognitoUserPoolId>
REACT_APP_COGNITO_CLIENT_ID=<CognitoClientId>
REACT_APP_S3_BUCKET=<ImagesBucketName>
REACT_APP_AWS_REGION=ap-south-1
```

Frontend authentication flow:
1. Use `amazon-cognito-identity-js` or `@aws-amplify/auth`
2. Call `signIn(email, password)` → get JWT tokens
3. Send `Authorization: Bearer <idToken>` with API requests

### For Person 2 (Backend)

After deployment, the Lambda environment is auto-configured. For local development:
```env
# Use these for local development with DynamoDB Local
AUTH_MODE=demo
DYNAMODB_ENDPOINT=http://localhost:8000

# Use these for local development with AWS services
AUTH_MODE=cognito
COGNITO_USER_POOL_ID=<from stack outputs>
COGNITO_CLIENT_ID=<from stack outputs>
S3_BUCKET_NAME=<from stack outputs>
```

### For Person 4 (AI)

Bedrock IAM permissions are already configured in the Lambda role:
```
bedrock:InvokeModel
bedrock:InvokeModelWithResponseStream
```

Available models: All foundation models in ap-south-1.

The backend exposes AI endpoints at `/ai/*` — implement the Bedrock calls in the AI handler.

---

## Staging vs Production

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production
```

| Aspect | Staging | Production |
|--------|---------|------------|
| Stack Name | parkshare-staging | parkshare-production |
| DynamoDB PITR | Disabled | Enabled |
| Change Confirmation | No | Yes |
| Purpose | Testing | Live |
