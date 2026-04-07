# CarbonWallet — Carbon Registry & Trading System

A centralized carbon credit registry and trading platform for academic/demo use. Built with Next.js, TypeScript, Tailwind CSS, PostgreSQL, and Prisma.

## Features

- **Project Registration** — Create, submit, and review carbon offset projects natively. Includes Registry tracking (CCTS, VERRA, Gold Standard).
- **MRV (Monitoring, Reporting, Verification) Uploads** — Direct drag-and-drop secure file attachment for MRV compliance reports (PDF/DOC) saved directly into the database. 
- **Credit Issuance** — Issue credits with unique serial numbers after MRV verification.
- **Credit Transfer** — Transfer credits between users with integrity checks.
- **Credit Retirement** — Permanently retire credits with retirement certificates.
- **Audit Trail** — Complete timeline of all system actions natively tracked for compliance.
- **AI Anomaly Detection** — Automated rule-based scanning logic to flag suspicious platform behavior (e.g., duplicated records, rapid transfers).
- **Public Marketplace Registry** — Searchable public credit registry.
- **Role-Based Access Control (RBAC)** — Strict separation of powers across Admin, Project Owner, Verifier, and Buyer.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS (v4) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (jose + bcryptjs) |
| Validation | Zod |
| Charts | Recharts |
| Icons | Lucide React |

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL) or a PostgreSQL instance locally.

## Quick Start

### 1. Clone & Install Dependencies

```bash
git clone <repository>
cd carbon-trading
npm install
```

### 2. Configure Environment

Ensure you have a `.env` file present at the root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/carbon_trading?schema=public"
JWT_SECRET="your_secret_here"
```

### 3. Setup Database & Prisma

Synchronize the Prisma Client and physical schema:

```bash
npx prisma generate
npx prisma db push --accept-data-loss
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Accounts

All baseline demo accounts use the password: `password123`

| Email | Role | Capabilities |
|-------|------|-------------|
| admin@carbon.dev | Admin | Full access, issue credits, manage everything |
| owner@carbon.dev | Project Owner | Create projects, upload MRV reports, transfer credits |
| verifier@carbon.dev | Verifier | Review projects, verify MRV reports, run AI anomaly scans, audit logs |
| buyer@carbon.dev | Buyer | View marketplace, acquire and retire credits |

*(Note: The Auditor role is completely consolidated inside the Verifier dashboard).*

## End-to-End Website Flow

Here is the exact journey through the application tracking a carbon offset lifecycle:

1. **Project Creation (Owner)** 
   - Login as `owner@carbon.dev`
   - Hit **Create Project** on the dashboard.
   - Configure a project (Select Registry, Methodology, Dates, and manually input the Exact Location).
   - **Upload MRV File:** Directly attach your PDF compliance document dynamically storing the Base64 file inside the persistent database payload.

2. **Compliance & Auditing (Verifier)**
   - Login as `verifier@carbon.dev`.
   - Access the native **Verifier Dashboard**.
   - Validate pending MRV reports uploaded by Project Owners.
   - Run manual **Anomaly Scans** over the network logic catching discrepancies. 
   - Observe live **Audit Logs**. 

3. **Issuance (Admin/Verifier)**
   - Once a project is fully approved, the system generates strict credits tagging them natively via a physical Batch UUID guaranteeing uniqueness tied to the compliance interval. 

4. **Trading & Retirement (Buyer / Owner)**
   - Login as `buyer@carbon.dev`.
   - Buyers can navigate directly to the **Marketplace** or the Public Registry securing credits.
   - Upon final consumption, credits are permanently sent to **Retirement**, immutably locking up the volume guaranteeing against double-spending!

## Integrity Constraints

| Rule | Implementation |
|------|---------------|
| Unique serial numbers | `@unique` on CreditBatch.monitoringReportId |
| Immutable Logging | `logAudit()` invoked natively on every HTTP mutation |
| No transfer of retired credits | Prisma strictly blocks where status `!= ACTIVE` |
| Native Data Isolation | `ownerId` dynamically extracted off Auth Token bypassing headers entirely |

## Database Reset Command

If your local database configuration ever drastically desyncs from your client:

```bash
npx prisma db push --force-reset
npx prisma generate
npx tsx --env-file=.env prisma/seed.ts
```
