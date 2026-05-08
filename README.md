# Demo
https://www.youtube.com/watch?v=cCtP6_X0VvA

# Merchant360 Payments Portal

Enterprise payments operations console — transactions, refunds, disputes, merchant management, and analytics. Built to production-grade standards with a full microservices backend, GraphQL gateway, and OAuth2/PKCE authentication.

---

## Prerequisites

- Node.js 20+
- Docker Desktop + Docker Compose

---

## Setup

```bash
# 1. Clone and install
git clone https://github.com/your-org/merchant360.git
cd merchant360
npm ci

# 2. Configure environment
cp .env.example .env
# Edit .env — required values:
#   JWT_SECRET          (min 32 chars)
#   NEXTAUTH_SECRET     (min 32 chars)
#   KEYCLOAK_CLIENT_SECRET
```

---

## Run

### Option A — Docker (full stack, recommended)

```bash
# Start all services
docker compose up -d

# Seed MongoDB with 10,000 transactions, merchants, refunds
docker compose --profile seed run --rm mongo-seed
```

Wait ~30 seconds for all health checks to pass, then open http://localhost:3000.

### Option B — Local dev (Next.js hot reload)

Requires Keycloak and MongoDB running in Docker:

```bash
# Start infrastructure only
docker compose up mongo keycloak -d

# Copy and configure web env
cp apps/web/.env.example apps/web/.env.local
# Edit apps/web/.env.local if needed (defaults work for local dev)

# Run all services via Turborepo
npx turbo run dev --concurrency=10

# Or run web only
cd apps/web && npm run dev
```

### Service URLs

| Service              | URL                           |
|----------------------|-------------------------------|
| Web Portal           | http://localhost:3000         |
| GraphQL Gateway      | http://localhost:4000/graphql |
| Payment Service      | http://localhost:3001         |
| Refund Service       | http://localhost:3002         |
| Merchant Service     | http://localhost:3003         |
| Notification Service | http://localhost:3004         |
| Keycloak Admin       | http://localhost:8080         |
| MongoDB              | localhost:27017               |

---

## Default Credentials

| Role     | Email                        | Password |
|----------|------------------------------|----------|
| Admin    | admin@merchant360.dev        | password |
| Analyst  | analyst@merchant360.dev      | password |
| Merchant | merchant@merchant360.dev     | password |

Login at http://localhost:3000 → "Continue with SSO" → enter credentials above.

---

## Architecture

```
merchant360/
├── apps/
│   └── web/                  # Next.js 14 App Router — TypeScript, Tailwind CSS
├── services/
│   ├── payment-service/      # Express + MongoDB — transactions CRUD & search
│   ├── refund-service/       # Express + MongoDB — idempotent refunds
│   ├── merchant-service/     # Express + MongoDB — merchant management
│   ├── notification-service/ # Express — webhook/email mock dispatcher
│   └── graphql-gateway/      # Apollo Server 4 — unified GraphQL API
├── packages/
│   ├── shared-types/         # TypeScript domain types shared across services
│   └── shared-utils/         # Common utility functions
├── infra/
│   ├── Dockerfile.web        # Next.js production image
│   ├── Dockerfile.service    # Shared service image (all Node services)
│   ├── keycloak/             # Realm config — auto-imported on first start
│   └── mongo-init/           # seed.js — 10,000 realistic transactions
├── .claude/
│   └── settings.json         # Claude Code MCP config (Playwright browser automation)
└── tests/
    ├── ui/                   # Playwright E2E (page objects, fixtures)
    ├── api/                  # Vitest integration tests
    └── graphql/              # GraphQL query/mutation tests
```

### Auth Flow

```
Browser → /api/auth/login → Keycloak (PKCE/OAuth2)
       ← authorization code
       → /api/auth/callback → token exchange
       ← two httpOnly cookies:
           m360_session      (~200 bytes) — AES-GCM encrypted user identity
           m360_session_tok              — AES-GCM encrypted TokenSet (tokens)
       → Next.js middleware decrypts m360_session on every request
```

### Roles

| Role       | Access                                              |
|------------|-----------------------------------------------------|
| `admin`    | Full platform access — all merchants, all data      |
| `analyst`  | Read-only — all merchants, no mutations             |
| `merchant` | Scoped — own transactions and refunds only          |

### Database (MongoDB 7)

Collections: `transactions`, `refunds`, `merchants`, `users`

Indexes on: `transactionId`, `merchantId`, `createdAt`, `status`

Seed data: 10,000 transactions across 5 merchants with realistic status distribution (CAPTURED 50%, REFUNDED 15%, AUTHORIZED 15%, CHARGEBACK 10%, FAILED 10%).

---

## GraphQL API

Endpoint: `http://localhost:4000/graphql`

Requires `Authorization: Bearer <access_token>` header. To get a token for testing:

```powershell
# PowerShell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:8080/realms/merchant360/protocol/openid-connect/token" `
  -Body @{ grant_type="password"; client_id="web-client"; client_secret="kc-client-secret-change-in-prod"; username="admin@merchant360.dev"; password="password" }
```

```bash
# bash
curl -s -X POST http://localhost:8080/realms/merchant360/protocol/openid-connect/token \
  -d "grant_type=password&client_id=web-client&client_secret=kc-client-secret-change-in-prod&username=admin@merchant360.dev&password=password" \
  | jq -r .access_token
```

Key queries:

```graphql
# List transactions (paginated, filterable)
query { transactions(filter: { page: 1, pageSize: 20 }) { data { id amount status } total } }

# Single transaction with merchant
query { transaction(id: "txn_xxx") { id amount status merchant { name } } }

# Merchants (admin/analyst only)
query { merchants { data { id name status country } total } }

# Issue refund
mutation { refundTransaction(input: { transactionId: "txn_xxx", amount: 1000, currency: "USD", idempotencyKey: "key_xxx" }) { id status } }
```

---

## MongoDB

Connect via mongosh:

```bash
# Interactive shell
docker exec -it m360_mongo mongosh -u admin -p "M3rchant_S3cr3t!" --authenticationDatabase admin merchant360

# Quick query
docker exec m360_mongo mongosh -u admin -p "M3rchant_S3cr3t!" --authenticationDatabase admin merchant360 \
  --eval "db.transactions.countDocuments()"
```

MongoDB Compass connection string:
```
mongodb://admin:M3rchant_S3cr3t!@localhost:27017/merchant360?authSource=admin
```

---

## Tests

```bash
# Unit tests (all packages)
npx turbo run test

# API integration tests (requires running services + MongoDB)
npx vitest run --config tests/api/vitest.config.ts

# GraphQL integration tests
npx vitest run --config tests/graphql/vitest.config.ts

# Playwright E2E
cd tests/ui
npx playwright install --with-deps chromium
npx playwright test

# Playwright with UI
npx playwright test --ui
```

CI runs on every push via GitHub Actions: lint → typecheck → unit tests → integration tests → Playwright smoke.

---

## Claude / AI Development

### Playwright MCP (browser automation)

The project includes a Playwright MCP server configured at `.claude/settings.json`. When opening this project in Claude Code, the MCP server starts automatically and gives Claude browser automation tools to interact with the running app.

Capabilities: navigate pages, click elements, fill forms, take screenshots, assert on DOM content — useful for exploratory testing and debugging UI flows against the live dev server.

**Requirements:** Node.js 20+, `npx` available on PATH. Chromium is used by default. The app must be running at `http://localhost:3000` before issuing browser commands.

To use a different browser, edit `.claude/settings.json`:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--browser", "firefox"]
    }
  }
}
```

Supported browsers: `chromium`, `firefox`, `webkit`.

---

## Environment Variables

Copy `.env.example` to `.env` and set:

| Variable              | Required | Description                              |
|-----------------------|----------|------------------------------------------|
| `JWT_SECRET`          | Yes      | Min 32 chars — service-to-service auth   |
| `NEXTAUTH_SECRET`     | Yes      | Min 32 chars — session cookie encryption |
| `KEYCLOAK_CLIENT_SECRET` | Yes   | Keycloak client secret                   |
| `MONGO_ROOT_PASSWORD` | No       | Default: `M3rchant_S3cr3t!`              |
| `NEXTAUTH_URL`        | No       | Default: `http://localhost:3000`         |
| `KEYCLOAK_PUBLIC_URL` | No       | Default: `http://localhost:8080`         |

For local dev outside Docker, copy `apps/web/.env.example` to `apps/web/.env.local` — all values default correctly for local development.
