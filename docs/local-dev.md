# Local Development

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- Docker + Docker Compose

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env
cp .env.example .env

# 3. Start infrastructure (MongoDB, Keycloak)
docker compose up -d mongo keycloak

# 4. Seed database
docker compose run --rm mongo-init

# 5. Start all services
npm run dev
```

## Service Ports

| Service | Port |
|---|---|
| apps/web | 3000 |
| payment-service | 3001 |
| refund-service | 3002 |
| merchant-service | 3003 |
| notification-service | 3004 |
| graphql-gateway | 4000 |
| MongoDB | 27017 |
| Keycloak | 8080 |

## Running Tests

```bash
# Unit + integration
npm run test

# Playwright E2E
npx playwright test --config tests/ui/playwright.config.ts

# API integration (services must be running)
npx vitest run --config tests/api/vitest.config.ts
```

## Useful Scripts

```bash
npm run lint          # ESLint all packages
npm run type-check    # TypeScript across monorepo
npm run build         # Full production build
```

## Keycloak Dev Users

| Email | Password | Role |
|---|---|---|
| admin@merchant360.dev | password | admin |
| analyst@merchant360.dev | password | analyst |
| merchant@merchant360.dev | password | merchant |
