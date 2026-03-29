# Deployment Guide (Home Server)

This guide covers deploying the budget tracker on your home server.

## Architecture

- **Backend**: NestJS API on port 3000 (configurable)
- **Frontend**: Static files (Vite build) + reverse proxy
- **Database**: PostgreSQL

## Prerequisites

- Node.js 18+
- PostgreSQL
- Reverse proxy (nginx, Caddy, Traefik, etc.)

---

## 1. Database

Create a PostgreSQL database and user:

```sql
CREATE DATABASE budget_tracker;
CREATE USER budget_user WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE budget_tracker TO budget_user;
```

---

## 2. Backend Environment

Copy and edit `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | `postgresql://user:password@host:5432/budget_tracker` |
| `JWT_SECRET` | Yes (prod) | Generate: `openssl rand -base64 32` |
| `PORT` | No | Default 3000 |
| `CORS_ORIGIN` | No | Comma-separated allowed origins, e.g. `https://budget.home` |
| `NODE_ENV` | No | Set to `production` for prod |

---

## 3. Frontend Environment (optional)

Only needed if the API is on a different origin than the frontend. If you use a reverse proxy that serves both from the same origin, skip this.

Create `frontend/.env.production`:

```
VITE_API_URL=https://api.yourserver.local/api
```

---

## 4. Build & Run

```bash
# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Generate Prisma client
npm run db:generate

# Run migrations (requires DATABASE_URL in backend/.env)
npm run db:migrate

# Seed default categories (optional)
cd backend && npm run db:seed

# Build
npm run build
```

**Run the backend:**

```bash
cd backend && NODE_ENV=production npm run start:prod
```

**Serve the frontend:** Use your reverse proxy to serve `frontend/dist` as static files.

---

## 5. Reverse Proxy (nginx example)

Serve frontend and proxy `/api` to the backend:

```nginx
server {
    listen 80;
    server_name budget.home;

    # Frontend
    root /path/to/budget-tracker/frontend/dist;
    index index.html;
    try_files $uri $uri/ /index.html;

    # API
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

With this setup, the frontend uses `/api` (same origin), so no `VITE_API_URL` needed.

---

## 6. Caddy example

```caddy
budget.home {
    root * /path/to/budget-tracker/frontend/dist
    file_server
    try_files {path} /index.html

    handle /api/* {
        reverse_proxy 127.0.0.1:3000
    }
}
```

---

## 7. Process manager (optional)

Use systemd, PM2, or Docker to keep the backend running.

**systemd** (`/etc/systemd/system/budget-api.service`):

```ini
[Unit]
Description=Budget Tracker API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/budget-tracker/backend
Environment=NODE_ENV=production
EnvironmentFile=/path/to/budget-tracker/backend/.env
ExecStart=/usr/bin/node dist/src/main.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

---

## Checklist

- [ ] PostgreSQL running, database created
- [ ] `backend/.env` with `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`
- [ ] `CORS_ORIGIN` set if frontend origin differs (or use same-origin via reverse proxy)
- [ ] Migrations run (`npm run db:migrate`)
- [ ] Build completed (`npm run build`)
- [ ] Reverse proxy configured (frontend + `/api` → backend)
- [ ] Backend running (systemd, PM2, or manual)
