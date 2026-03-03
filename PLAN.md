# Budget Tracker Application Plan (Finalized)

## 1. High-level architecture

- Web application with separate frontend and backend.
- Frontend: Vite + React + TypeScript, shadcn/ui for a clean financial-app feel.
- Backend: **NestJS** REST API (no GraphQL), SQL database for persistence, basic auth, and multi-user separation.
- Deployment target: your local server (single-node, no complex infra).

Assumptions:

- **TypeScript** for both frontend and backend.
- **PostgreSQL** as the SQL database (can switch to SQLite later if desired).
- Simple email + password auth with hashed passwords; JWT in HttpOnly cookies or similar.

## 2. Tech stack choices

### Backend

- **Framework: NestJS** (Node.js + TypeScript). Provides structure (modules, controllers, services, DI), built-in validation, auth guards, and good fit for learning modern backend patterns.
- **ORM:** Prisma (schema, migrations, type-safe queries).
- **Auth:** Email/password sign-up and login; bcrypt for hashing; JWT or session for protected routes.
- **Testing:** Jest (Nest default) for unit tests.

### Frontend

- **Tooling:** Vite + React + TypeScript.
- **UI:** Tailwind CSS + shadcn/ui.
- **Data:** React Query (TanStack Query) for API data; minimal local state.
- **Charts:** Chart.js (react-chartjs-2) for dashboard bar and pie.
- **Routing:** React Router.
- **Testing:** Vitest for unit tests (no RTL or E2E in v1).

### Database

- PostgreSQL with Prisma migrations. Models: `User`, `Account`, `Category`, `Transaction`, `ImportJob`.

## 3. Core features for v1.0

1. **User accounts & auth** – Sign up, login, logout; password hashing; all data scoped to user.
2. **Accounts management** – CRUD for financial accounts; optional default account for imports.
3. **CSV import (bank-agnostic)** – Upload CSV; parse date, description, amount, type, balance, optional category; dedupe by account+date+description+amount; return import summary.
4. **Transactions view** – Paginated, sortable table; filters (date range, category, amount); inline edit category and notes.
5. **Categories** – Seeded default set; users can enable/disable and add custom; v1 uses CSV category or "Uncategorized" (no AI).
6. **Basic analytics** – Monthly spend by category; simple charts; quick stats (e.g., this month vs last).
7. **Settings / profile** – Change password; manage default account.

## 4. Data model (Prisma sketch)

- **User:** id, email, passwordHash, createdAt.
- **Account:** id, userId, name, type, institution, isDefault?, createdAt.
- **Category:** id, userId (nullable for global), name, isDefault, isActive.
- **Transaction:** id, userId, accountId, date, description, amount, type, balanceAfter?, categoryId?, notes, externalId (dedupe), createdAt.
- **ImportJob:** id, userId, accountId, filename, status, createdAt, completedAt, summary (JSON).

## 5. CSV import design

- **Standard columns:** Required – Date, Description, Amount; Optional – Type, Balance, Category.
- Parser validates header, normalizes rows, maps category if present, generates externalId for dedupe.
- Batch insert in a DB transaction; return summary (imported, skipped, errors).
- Leave a clear extension point for future AI categorization (e.g., uncategorized rows).

## 6. Security & multi-user

- All non-auth routes require authentication (Nest guards).
- All queries scoped by userId.
- Passwords: bcrypt; consider JWT in HttpOnly cookie.
- Basic validation (e.g., class-validator) on DTOs.

## 7. Project structure

- **Backend (`backend/`)** – NestJS layout: `src/app.module.ts`, `main.ts`, `src/auth/`, `src/accounts/`, `src/transactions/`, `src/categories/`, `src/imports/`, `src/analytics/`, `src/prisma/`, `test/`.
- **Frontend (`frontend/`)** – Vite + React: `src/components/`, `src/pages/`, `src/api/`, `src/lib/`, `src/contexts/`. Pages: Login, Register, Dashboard, Accounts, Transactions, Import, Categories, Settings.

## 8. Implementation steps (completed)

1. Repo bootstrap – Backend (Nest + TS + Prisma), frontend (Vite + React + TS + shadcn); ESLint/Prettier.
2. Database & ORM – Prisma schema, PostgreSQL connection, migration, seed default categories; light tests for seeding.
3. Auth API (Nest) – AuthModule: register, login, me; bcrypt, JWT; guards; tests.
4. Accounts API – CRUD, default-account flag; user-scoped; tests.
5. Categories API – List active, toggle, add custom; tests.
6. Transactions API – List/filter, update category/notes; tests.
7. CSV import backend – Upload endpoint (FileInterceptor), bank CSV parser, dedupe, ImportJob + summary; tests with fixture CSVs.
8. Frontend shell & auth – Routing, layout, shadcn, login/register, auth state, protected routes.
9. Accounts & categories UI – CRUD dialogs, category toggles.
10. Transactions UI – Table, filters, pagination, inline edit.
11. CSV import UI – Drag-and-drop, account select, progress/summary.
12. Analytics UI – Dashboard, monthly totals, simple charts (Chart.js).
13. Polish & docs – README (env, DB, scripts), PLAN.md in repo.

## 9. Future enhancements (beyond v1)

- AI-assisted categorization; multiple bank CSV formats; budget planning and alerts; recurring transaction detection; richer analytics.
