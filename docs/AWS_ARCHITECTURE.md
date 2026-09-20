# ParkKaro — AWS Architecture

> **Owner:** Person 3 (AWS Infrastructure)
> **Last Updated:** 2026-09-18
> **Region:** `ap-south-1` (Mumbai)

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          USERS / BROWSERS                           │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    S3 (Frontend Hosting)                             │
│            parkkaro-frontend-{env}-{accountId}                     │
│         Static website: index.html, JS, CSS, assets                 │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ API calls
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (REST)                              │
│               parkkaro-api-{environment}                            │
│                                                                      │
│   Routes:                                                            │
│     ANY /              → Lambda (proxy)                              │
│     ANY /{proxy+}      → Lambda (proxy)                              │
│                                                                      │
│   Features:                                                          │
│     • CORS enabled                                                   │
│     • Access logging → CloudWatch                                    │
│     • X-Ray tracing                                                  │
│     • Rate limiting (50 req/s, burst 100)                            │
│     • Request/response metrics                                       │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    LAMBDA FUNCTION                                    │
│             parkkaro-backend-{environment}                           │
│                                                                      │
│   Runtime:  Node.js 18.x                                             │
│   Handler:  dist/lambda.handler                                      │
│   Memory:   1024 MB                                                  │
│   Timeout:  30s                                                      │
│                                                                      │
│   ┌──────────────────────────────────────────────────┐               │
│   │          serverless-http adapter                  │               │
│   │                    ↓                              │               │
│   │          Express.js Application                   │               │
│   │                    ↓                              │               │
│   │   ┌─────────┐ ┌──────────┐ ┌──────────────┐     │               │
│   │   │ Handlers│→│ Services │→│ Repositories  │     │               │
│   │   └─────────┘ └──────────┘ └──────────────┘     │               │
│   └──────────────────────────────────────────────────┘               │
│                                                                      │
│   Environment Variables:                                             │
│     DYNAMODB_TABLE_PREFIX, COGNITO_USER_POOL_ID,                     │
│     COGNITO_CLIENT_ID, S3_BUCKET_NAME, AUTH_MODE                     │
└───┬──────────┬──────────┬──────────┬──────────┬──────────────────────┘
    │          │          │          │          │
    ▼          ▼          ▼          ▼          ▼
┌────────┐┌────────┐┌────────┐┌────────┐┌──────────┐
│DynamoDB││Cognito ││  S3    ││Bedrock ││CloudWatch│
│(14 tbl)││(Auth)  ││(Images)││(AI)    ││(Logs)    │
└────────┘└────────┘└────────┘└────────┘└──────────┘
```

---

## AWS Services

### 1. Amazon Cognito — Authentication

**Resource:** `CognitoUserPool`, `CognitoUserPoolClient`

| Property | Value |
|----------|-------|
| Pool Name | `parkkaro-users-{env}` |
| Client Name | `parkkaro-web-{env}` |
| Sign-in | Email (case-insensitive) |
| Verification | Email auto-verified |
| Password Policy | 8+ chars, upper, lower, numbers |
| Token Validity | Access: 1h, ID: 1h, Refresh: 30d |
| Auth Flows | USER_PASSWORD_AUTH, SRP_AUTH, REFRESH_TOKEN |

**User Groups:**

| Group | Description | Precedence |
|-------|-------------|------------|
| `ADMIN` | Platform administrators | 0 |
| `HOST` | Parking space owners | 1 |
| `DRIVER` | Drivers/renters | 2 |

**Custom Attributes:**

| Attribute | Type | Purpose |
|-----------|------|---------|
| `custom:role` | String | `DRIVER`, `HOST`, `ADMIN` |

**Authentication Flow:**
```
Frontend → Cognito SDK → USER_PASSWORD_AUTH / SRP_AUTH
    ↓
JWT tokens (id_token, access_token, refresh_token)
    ↓
Frontend sends: Authorization: Bearer <id_token>
    ↓
Lambda verifies JWT against Cognito User Pool
    ↓
Extracts: sub (userId), email, name, custom:role
```

**Integration with Backend:**
- Backend's `auth.ts` middleware reads `Authorization: Bearer <jwt>` header
- In `cognito` auth mode, JWT is verified against the User Pool
- Claims extracted: `sub` → userId, `email`, `name`, `custom:role` → role

---

### 2. Amazon DynamoDB — Database

**14 Tables, 24 GSIs** (see `docs/DATABASE_SCHEMA.md` for complete schema)

| # | Table | PK | SK | GSIs |
|---|-------|----|----|------|
| 1 | parkkaro-users | userId | — | email-index, role-index |
| 2 | parkkaro-parking | listingId | — | hostId-index, area-price-index, city-index, status-index |
| 3 | parkkaro-bookings | bookingId | — | driverId-index, hostId-index, listingId-index, status-index |
| 4 | parkkaro-slot-locks | listingId | slotKey | — |
| 5 | parkkaro-vehicles | vehicleId | — | userId-index |
| 6 | parkkaro-reviews | reviewId | — | listingId-index, userId-index, bookingId-index |
| 7 | parkkaro-favorites | userId | listingId | — |
| 8 | parkkaro-payments | paymentId | — | bookingId-index, userId-index |
| 9 | parkkaro-payouts | payoutId | — | hostId-index |
| 10 | parkkaro-notifications | userId | notificationId | — |
| 11 | parkkaro-conversations | conversationId | — | participant1-index, participant2-index |
| 12 | parkkaro-messages | conversationId | messageId | — |
| 13 | parkkaro-disputes | disputeId | — | bookingId-index, status-index, reportedBy-index |
| 14 | parkkaro-reports | reportId | — | status-index, reportedBy-index |

**Configuration:**
- Billing: PAY_PER_REQUEST (on-demand)
- Point-in-time recovery: Enabled in production
- Deletion policy: Retain (tables preserved on stack deletion)

---

### 3. Amazon S3 — Storage

#### Images Bucket
**Resource:** `ParkKaroImagesBucket`

| Property | Value |
|----------|-------|
| Bucket | `parkkaro-images-{env}-{accountId}` |
| Versioning | Enabled |
| Public Access | Blocked (all 4 settings) |
| CORS | GET, PUT from any origin |
| Lifecycle | Abort incomplete multipart after 1 day |

**Object Key Structure:**
```
listings/{listingId}/{uuid}.jpg     — Parking listing photos
profiles/{userId}/{uuid}.jpg        — Profile images
disputes/{disputeId}/{uuid}.jpg     — Dispute evidence
```

**Upload Flow:**
```
Frontend                    Backend (Lambda)                S3
   │                            │                           │
   ├─ POST /parking/upload-url ─►│                           │
   │                            ├─ Generate presigned PUT URL│
   │                            │  (15 min expiry)          │
   │  ◄── { uploadUrl, key } ──┤                           │
   │                            │                           │
   ├─ PUT <presigned-url> ──────┼───────────────────────────►│
   │  (direct upload)          │                           │
   │                            │                           │
   ├─ POST /parking { photos: [key] } ──►│                  │
   │                            │  Store key in DynamoDB    │
```

#### Frontend Bucket
**Resource:** `FrontendBucket`

| Property | Value |
|----------|-------|
| Bucket | `parkkaro-frontend-{env}-{accountId}` |
| Website Hosting | Enabled (index.html) |
| Public Access | Allowed (read-only) |

---

### 4. API Gateway — REST API

**Resource:** `ParkKaroApi`

| Property | Value |
|----------|-------|
| Type | REST API |
| Stage | `{environment}` |
| Integration | Lambda Proxy (ANY /{proxy+}) |
| Tracing | X-Ray enabled |
| Logging | CloudWatch access logs |
| Throttling | 50 req/s steady, 100 burst |

**Route Mapping:**
All routes defined in `docs/API_CONTRACT.md` are handled by the Express.js Lambda:

```
API Gateway (ANY /{proxy+})
    → Lambda (serverless-http adapter)
    → Express Router
        → /parking          (listings)
        → /bookings         (booking lifecycle)
        → /vehicles         (vehicle management)
        → /reviews          (reviews)
        → /favorites        (favorites)
        → /payments         (payments)
        → /host/*           (host dashboard, earnings, payouts)
        → /driver/*         (driver dashboard)
        → /notifications    (notifications)
        → /conversations    (messaging)
        → /disputes         (disputes)
        → /reports          (reports)
        → /admin/*          (admin APIs)
        → /ai/*             (AI integration)
        → /health           (health check)
```

---

### 5. AWS Lambda — Compute

**Resource:** `ParkKaroBackendFunction`

| Property | Value |
|----------|-------|
| Name | `parkkaro-backend-{env}` |
| Runtime | Node.js 18.x |
| Memory | 1024 MB |
| Timeout | 30 seconds |
| Architecture | x86_64 |
| Tracing | X-Ray Active |
| Handler | `dist/lambda.handler` |

**How it works:**
1. API Gateway receives HTTP request
2. Invokes Lambda with API Gateway proxy event
3. `serverless-http` adapter translates event → Express req/res
4. Express routes handle business logic
5. Response flows back through the adapter to API Gateway

---

### 6. Amazon Bedrock — AI (Person 4)

**IAM Only** — Person 3 provides permissions; Person 4 implements logic.

```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel",
    "bedrock:InvokeModelWithResponseStream"
  ],
  "Resource": "arn:aws:bedrock:{region}::foundation-model/*"
}
```

**Integration Points:**
- `POST /ai/search` — AI-assisted parking search
- `POST /ai/recommend` — Personalized recommendations
- `POST /ai/pricing` — Pricing suggestions
- `POST /ai/listing-description` — Auto-generate descriptions

---

### 7. Amazon CloudWatch — Monitoring

**Log Groups:**
| Log Group | Source | Retention |
|-----------|--------|-----------|
| `/aws/apigateway/parkkaro-api-{env}` | API Gateway access logs | 30 days |
| `/aws/lambda/parkkaro-backend-{env}` | Lambda execution logs | 30 days |

**Alarms:**

| Alarm | Metric | Threshold | Period |
|-------|--------|-----------|--------|
| Lambda Errors | Errors (Sum) | > 10 | 5 min |
| API 5XX | 5XXError (Sum) | > 5 | 5 min |
| Lambda Duration | Duration (p99) | > 10s | 5 min × 3 |

**Dashboard:** `ParkKaro-{environment}`

Widgets:
- Lambda Invocations, Errors, Throttles
- Lambda Duration (avg, p99)
- API Gateway Request Count, 4XX, 5XX
- API Gateway Latency
- DynamoDB Read/Write Capacity
- Cognito Sign-ins
- Recent Lambda Errors (log query)

---

## IAM Permissions

The Lambda execution role has **least-privilege** access:

| Service | Actions | Resource |
|---------|---------|----------|
| DynamoDB | Get/Put/Update/Delete/Query/Scan/Batch/Transact | `parkkaro-*` tables + indexes |
| S3 | PutObject, GetObject, DeleteObject, ListBucket | Images bucket |
| Cognito | Admin user operations | User Pool |
| Bedrock | InvokeModel, InvokeModelWithResponseStream | Foundation models |
| CloudWatch | CreateLogGroup/Stream, PutLogEvents | All |

---

## Security

- **No hardcoded secrets** — all sensitive values are environment variables injected by CloudFormation
- **S3 images bucket** — public access fully blocked; presigned URLs for uploads
- **Cognito** — password policy enforced; HTTPS only
- **API Gateway** — throttling enabled; access logging
- **Lambda** — IAM role with least privilege
- **DynamoDB** — PITR enabled in production

---

## Environment Variables (Lambda)

| Variable | Source | Description |
|----------|--------|-------------|
| `DYNAMODB_TABLE_PREFIX` | Parameter | `parkkaro` |
| `COGNITO_USER_POOL_ID` | CloudFormation | Auto-populated |
| `COGNITO_CLIENT_ID` | CloudFormation | Auto-populated |
| `S3_BUCKET_NAME` | CloudFormation | Auto-populated |
| `AUTH_MODE` | Template | `cognito` |
| `NODE_ENV` | Parameter | `production`/`staging` |
| `PLATFORM_COMMISSION_PERCENT` | Parameter | `10` |
| `TAX_PERCENT` | Parameter | `0` |
| `AWS_REGION_NAME` | CloudFormation | `ap-south-1` |

---

## Infrastructure as Code

**Framework:** AWS SAM (Serverless Application Model)

```
infrastructure/
├── template.yaml              # Main SAM/CloudFormation template
├── samconfig.toml             # SAM CLI configuration
├── package.json               # Scripts & dependencies
├── lambda/
│   └── lambda.ts              # Lambda handler adapter
└── scripts/
    ├── deploy.sh              # Full deployment script (Linux/macOS)
    ├── deploy.ps1             # Full deployment script (Windows)
    ├── cognito-setup.ts       # Cognito user management CLI
    ├── create-tables-local.ts # DynamoDB Local table setup
    └── s3-presign.ts          # S3 presigned URL generator
```

---

## Cost Estimation (On-Demand)

| Service | Free Tier | Est. Hackathon Cost |
|---------|-----------|---------------------|
| Lambda | 1M req/mo | $0 (within free tier) |
| API Gateway | 1M req/mo | $0 (within free tier) |
| DynamoDB | 25 RCU/WCU | $0 (within free tier) |
| S3 | 5GB | $0 (within free tier) |
| Cognito | 50K MAU | $0 (within free tier) |
| CloudWatch | Basic | $0 (within free tier) |
| **Total** | | **~$0** |
