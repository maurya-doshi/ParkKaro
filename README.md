# ParkKaro 🅿️🚗

![ParkKaro Banner](https://via.placeholder.com/1200x400/1e293b/ffffff?text=ParkKaro+-+AI+Powered+Parking+Marketplace)

**ParkKaro** is a next-generation, AI-powered marketplace for parking spaces, often described as the "Airbnb for Parking." It seamlessly connects **Hosts** with available parking spots to **Drivers** who need a place to park, enriched by intelligent features powered by **Amazon Bedrock**.

---

## 🚀 Live Demo

Try the live application here:
👉 **[ParkKaro Production Demo](http://parkkaro-frontend-production-742986823789.s3-website.ap-south-1.amazonaws.com/)**

---

## 🌟 Key Features

### 🤖 AI-Powered Capabilities (Amazon Bedrock)
- **Natural Language Search:** Find parking using conversational queries (e.g., "cheap covered parking near MG Road tomorrow").
- **Smart Recommendations:** Context-aware suggestions based on user preferences and booking history.
- **Pricing Assistant:** Helps hosts set competitive prices with market-aware AI estimates.
- **Listing Generator:** Automatically writes beautiful, grounded listing descriptions based on basic host-provided facts.

### 🚘 Driver Experience
- Search and filter parking listings in real-time.
- View availability and book instantly.
- Leave reviews and manage favorite locations.

### 🏠 Host Experience
- Easily list parking spaces with intelligent AI suggestions.
- View analytics, manage pricing, and handle bookings.
- Accept or reject bookings, manage disputes, and receive payouts.

---

## 🏗️ Architecture & Project Structure

The repository is built as a monorepo consisting of four primary modules:

- **`/frontend`** — The client-side application (React, TypeScript, Vite, Tailwind CSS).
- **`/backend`** — The server API (Node.js, Express, TypeScript). Handles business logic, auth, and database interactions.
- **`/ai`** — Dedicated AI module leveraging Amazon Bedrock for reasoning, complete with strict Zod schema validation and anti-hallucination grounding.
- **`/infrastructure`** — AWS Serverless Application Model (SAM) configuration, Lambda handlers, and deployment scripts.
- **`/docs`** — Comprehensive architectural and design documentation.

### Technologies
- **Frontend:** React, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend:** Node.js, Express, TypeScript, Jest
- **Database:** Amazon DynamoDB
- **AI/ML:** Amazon Bedrock (Claude 3 Haiku)
- **Deployment:** AWS Lambda, API Gateway, S3, CloudFront

---

## 📚 Documentation

Detailed documentation can be found in the [`/docs`](./docs) directory:

- [**API Contract**](./docs/API_CONTRACT.md) — Comprehensive API specifications.
- [**Database Schema**](./docs/DATABASE_SCHEMA.md) — DynamoDB tables, indexes, and access patterns.
- [**Bedrock AI Integration**](./docs/BEDROCK_AI.md) — Details on the AI layer, grounding schemas, and prompt strategies.
- [**AWS Architecture**](./docs/AWS_ARCHITECTURE.md) — Infrastructure design and cloud resource map.
- [**AWS Deployment**](./docs/AWS_DEPLOYMENT.md) — Step-by-step guides for deploying to AWS.

---

## 🛠️ Getting Started Locally

### Prerequisites
- Node.js (v18+)
- AWS CLI configured (for DynamoDB/Bedrock access)
- Local DynamoDB (optional, for offline dev)

### 1. Backend & AI
```bash
cd backend
npm install
npm run dev
```
*(Note: The AI module is compiled as part of the backend.)*

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🤝 Contribution & Team

This project was built collaboratively by the ParkKaro engineering team, divided into dedicated responsibilities across the frontend UI, backend systems, AWS infrastructure, and the Amazon Bedrock AI integration.

---

*ParkKaro — Making urban mobility seamless, one spot at a time.*