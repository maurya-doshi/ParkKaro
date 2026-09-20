# ParkKaro Backend

> **Airbnb for Parking** — Complete marketplace backend with Express.js, TypeScript, and Amazon DynamoDB.

## Architecture

```
Handler (HTTP) → Service (Business Logic) → Repository (Data Access) → DynamoDB
```

### Key Design Decisions

- **Source of Truth:** Backend owns all data — users, listings, prices, availability, bookings, payments
- **Auth:** Single `getAuthenticatedUser()` interface — demo headers for dev, Cognito JWT for prod
- **Double-booking prevention:** DynamoDB TransactWriteItems with slot-lock table
- **Pricing:** Server-side only — frontend never sets prices
- **Payment:** Isolated behind provider interface — mock for hackathon, real provider later

## Setup

### Prerequisites

- Node.js 18+
- npm 9+
- DynamoDB Local (for development) or AWS credentials

### Install

```bash
cd backend
npm install
```

### Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Run Locally

```bash
npm run dev
```

Server starts on `http://localhost:3001`.

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Seed Database

```bash
npm run seed
```

Creates deterministic demo parking listings across Bengaluru, 12 demo users (3 drivers, 8 hosts, 1 admin), vehicles, favorites, bookings, payments, payouts, reviews, notifications, conversations, and reports.

#### Demo Identities (for `x-demo-user-id` and `x-demo-role` headers)

| Role | User ID | Name | Email |
|------|---------|------|-------|
| `DRIVER` | `driver_demo_1` | Demo Driver Arjun | driver1@demo.parkkaro.com |
| `DRIVER` | `driver_demo_2` | Demo Driver Priya | driver2@demo.parkkaro.com |
| `DRIVER` | `driver_demo_3` | Demo Driver Rahul | driver3@demo.parkkaro.com |
| `HOST` | `host_demo_1` | Demo Host Vikram | host1@demo.parkkaro.com |
| `HOST` | `host_demo_2` | Demo Host Ananya | host2@demo.parkkaro.com |
| `HOST` | `host_demo_3` | Demo Host Rajesh | host3@demo.parkkaro.com |
| `ADMIN` | `admin_demo_1` | Demo Admin Pooja | admin@demo.parkkaro.com |

## API Documentation

See [docs/API_CONTRACT.md](../docs/API_CONTRACT.md) for complete API reference.

## Database Schema

See [docs/DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md) for DynamoDB table designs.

## Project Structure

```
backend/
├── src/
│   ├── app.ts                    # Express entry point
│   ├── config/                   # Environment & DynamoDB config
│   ├── handlers/                 # Route handlers by domain
│   │   ├── parking/              # Parking CRUD + search
│   │   ├── booking/              # Booking lifecycle
│   │   ├── availability/         # Availability checks
│   │   ├── vehicle/              # Vehicle management
│   │   ├── review/               # Reviews
│   │   ├── favorite/             # Favorites
│   │   ├── payment/              # Payment flow
│   │   ├── payout/               # Host payouts
│   │   ├── notification/         # Notifications
│   │   ├── message/              # Messaging
│   │   ├── dispute/              # Disputes
│   │   ├── report/               # Reports
│   │   ├── dashboard/            # Host & driver dashboards
│   │   ├── admin/                # Admin APIs
│   │   └── ai/                   # AI integration endpoints
│   ├── services/                 # Business logic
│   ├── repositories/             # DynamoDB data access
│   ├── models/                   # TypeScript interfaces
│   ├── middleware/                # Auth, role, validation, errors
│   ├── validators/               # Zod schemas
│   └── utils/                    # Response, errors, dates, pricing, QR
├── scripts/seed/                 # Demo data seeding
├── tests/                        # Jest tests
├── package.json
├── tsconfig.json
└── .env.example
```

## AWS Dependencies

| Service | Usage | Owner |
|---------|-------|-------|
| DynamoDB | Primary database | Person 3 provisions tables |
| Cognito | Authentication | Person 3 configures |
| S3 | Photo storage | Person 3 provisions |
| Bedrock | AI features | Person 4 implements |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AWS_REGION` | AWS region |
| `DYNAMODB_TABLE_PREFIX` | Table name prefix (default: `parkkaro`) |
| `DYNAMODB_ENDPOINT` | DynamoDB endpoint (for local dev) |
| `COGNITO_USER_POOL_ID` | Cognito user pool ID |
| `COGNITO_CLIENT_ID` | Cognito client ID |
| `S3_BUCKET_NAME` | S3 bucket for photos |
| `PORT` | Server port (default: 3001) |
| `AUTH_MODE` | `demo` or `cognito` |
| `PLATFORM_COMMISSION_PERCENT` | Platform fee % (default: 10) |
