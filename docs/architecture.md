# Architecture

## Overview

Merchant360 is a full-stack monorepo simulating an enterprise payments operations platform.

## System Diagram

```
Browser (Next.js)
      │
      ▼
GraphQL Gateway (Apollo Federation)
      │
      ├── payment-service    (REST, :3001)
      ├── refund-service     (REST, :3002)
      ├── merchant-service   (REST, :3003)
      └── notification-service (REST, :3004)
                │
                ▼
           MongoDB (:27017)
```

## Key Design Decisions

**Monorepo with Turborepo** — shared build cache, unified lint/type-check, per-package ownership.

**Fastify over Express** — lower overhead, schema-first request validation, built-in logging hooks.

**Apollo Federation 2** — each service owns its GraphQL subgraph; the gateway composes them at runtime.

**npm workspaces** — `@merchant360/shared-types` and `@merchant360/shared-utils` are consumed by all services without publishing to a registry.

**Keycloak (mock)** — OAuth2/OIDC flows with role-based access (`admin`, `analyst`, `merchant`).

## Data Flow — Refund

1. UI calls `POST /v1/refunds` on refund-service.
2. Refund-service validates idempotency key, checks transaction status via payment-service.
3. Refund record written to MongoDB.
4. notification-service event queued.
5. GraphQL gateway exposes updated refund state.

## Packages

| Package | Purpose |
|---|---|
| `@merchant360/shared-types` | Domain interfaces (Transaction, Refund, Merchant, User) |
| `@merchant360/shared-utils` | Retry, masking, request ID, amount formatting |
| `@merchant360/ui` | Shared React components (Badge, Card, StatusBadge, Spinner) |
| `@merchant360/eslint-config` | Shared ESLint flat config |
