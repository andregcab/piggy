# Budget Tracker

Multi-user, self-hosted budget tracking. Import bank CSVs, categorize transactions, track spending. Your data stays in your PostgreSQL database.

## Features

- **Multi-user** – Register and sign in; each user has their own accounts and data
- **CSV import** – Bank-agnostic import (Date, Description, Amount). Duplicates are skipped
- **Accounts** – Multiple bank accounts with transaction history
- **Categories** – Custom categories with auto-matching rules for imports
- **Transactions** – View, edit, and delete by month
- **Dashboard** – Monthly income, spending by category, and budget overview
- **Self-hosted** – Your data stays on your server (PostgreSQL)

## Stack

- **Backend:** NestJS, TypeScript, Prisma, PostgreSQL, JWT auth
- **Frontend:** Vite, React, TypeScript, Tailwind, shadcn/ui, React Query, React Router, Chart.js

## Prerequisites

Node.js 18+, PostgreSQL.

## Setup

**1. Install**

```bash
npm install
cd backend && npm install && cd ../frontend && npm install
```

**2. Database**

```bash
cp backend/.env.example backend/.env
# Set DATABASE_URL in backend/.env
npm run db:migrate
cd backend && npm run db:seed   # optional, default categories
```

**3. Run**

Two terminals: `npm run dev:backend` then `npm run dev:frontend`. Open http://localhost:5173, register, add an account, import a CSV from **Import**.

**Production:** `npm run build`; serve `frontend/dist` and run `backend` with `npm run start:prod`. Details: [DEPLOYMENT.md](./DEPLOYMENT.md).

## Scripts (repo root)

| Command | Description |
|---------|-------------|
| `npm run dev:backend` | Backend (watch) |
| `npm run dev:frontend` | Frontend dev server |
| `npm run build` | Build both |
| `npm run test` | Backend + frontend tests |
| `npm run db:migrate` | Prisma migrations |
| `npm run db:studio` | Prisma Studio |
| `npm run lint` | Lint backend and frontend |

**CSV import:** Required – Date, Description, Amount. Optional – Type, Balance, Category. Duplicates (same account/date/description/amount) are skipped.
