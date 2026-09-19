# ParkShare Infrastructure

> AWS-powered serverless infrastructure for ParkShare — the parking marketplace.

## Overview

This directory contains the complete AWS infrastructure-as-code for ParkShare using **AWS SAM (Serverless Application Model)**.

## Architecture

```
Users → S3 (Frontend) → API Gateway → Lambda (Express.js) → DynamoDB
                                  ↗ Cognito (Auth)
                                  ↗ S3 (Images)
                                  ↗ Bedrock (AI)
                                  ↗ CloudWatch (Monitoring)
```

## Structure

```
infrastructure/
├── .env.example               # Environment variables template for prod and local
├── template.yaml              # SAM/CloudFormation template (all AWS resources)
├── samconfig.toml             # SAM CLI deployment configuration (safe mode default)
├── package.json               # Scripts & dependencies
├── lambda/
│   ├── lambda.ts              # TypeScript Lambda handler (wraps Express app)
│   └── lambda.js              # Pre-compiled JS Lambda handler (keeps backend/src clean)
└── scripts/
    ├── deploy.sh              # Full deployment script (Linux/macOS)
    ├── deploy.ps1             # Full deployment script (Windows)
    ├── cognito-setup.ts       # Cognito user management CLI
    ├── create-tables-local.ts # Create DynamoDB tables locally
    └── s3-presign.ts          # S3 presigned URL generator
```

## DynamoDB Safety (Preserving Existing Data)

> 🛡️ **Zero Data Loss Guarantee:**
> - `samconfig.toml` defaults to `CreateDynamoDBTables=false` in production.
> - Deploy scripts default to **safe mode**, leaving existing tables untouched.
> - All tables have `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain`.
> - The Lambda IAM role uses wildcard ARNs (`parkshare-*`) to access any pre-existing or CloudFormation-managed tables.
> - To deploy to a clean account where tables do NOT exist yet, pass `-CreateTables` (PowerShell) or `--create-tables` (Bash), or use the `production-fresh` SAM profile.

## Quick Start

### Deploy to AWS (Safe Mode — preserves existing tables)

```bash
cd infrastructure
npm install
./scripts/deploy.sh          # Linux/macOS (safe mode)
.\scripts\deploy.ps1         # Windows (safe mode)

# For fresh deployment with table creation:
./scripts/deploy.sh --create-tables
.\scripts\deploy.ps1 -CreateTables
```

### Local Development

```bash
# Start DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Create tables
npm run create-tables-local

# Start backend
cd ../backend && npm run dev
```

## AWS Services Used

| Service | Purpose | Resource Count |
|---------|---------|---------------|
| **DynamoDB** | Database | 14 tables, 24 GSIs |
| **Cognito** | Authentication | 1 pool, 3 groups |
| **S3** | Image + frontend storage | 2 buckets |
| **API Gateway** | REST API | 1 API, proxy integration |
| **Lambda** | Backend compute | 1 function |
| **Bedrock** | AI inference | IAM permissions |
| **CloudWatch** | Monitoring | Logs, alarms, dashboard |

## NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run deploy` | Build and deploy SAM stack |
| `npm run deploy:staging` | Deploy to staging |
| `npm run deploy:prod` | Deploy to production |
| `npm run create-tables-local` | Create DynamoDB Local tables |
| `npm run cognito:seed` | Seed demo users |
| `npm run cognito:list` | List Cognito users |
| `npm run validate` | Validate SAM template |
| `npm run logs` | Tail Lambda logs |
| `npm run stack:outputs` | Show stack outputs |

## Documentation

- [AWS Architecture](../docs/AWS_ARCHITECTURE.md) — Full architecture reference
- [AWS Deployment](../docs/AWS_DEPLOYMENT.md) — Deployment guide & troubleshooting
- [API Contract](../docs/API_CONTRACT.md) — API routes (Person 2)
- [Database Schema](../docs/DATABASE_SCHEMA.md) — DynamoDB tables (Person 2)

## Owner

**Person 3** — AWS Infrastructure, Auth, Storage, API Deployment, CI/CD
