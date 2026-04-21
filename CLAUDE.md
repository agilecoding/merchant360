# CLAUDE.md

# Merchant360 Payments Portal

Production-grade repository guidance for Claude.
This file defines persistent project context so prompts can stay short, precise, and token-efficient.

---

# 1. Mission

Merchant360 Payments Portal is a modern full-stack portfolio project that simulates a real enterprise payments operations platform.

Primary goals:

- Demonstrate senior full-stack engineering capability
- Showcase frontend + backend + data + auth + testing skills
- Reflect production-grade architecture
- Support automation and maintainability
- Remain realistic to fintech / payments industry standards

---

# 2. Product Summary

Merchant operations console used to:

- authenticate users with OAuth2
- view transactions
- search/filter payments
- issue refunds
- review disputes / chargebacks
- manage merchants
- monitor dashboards
- consume backend APIs
- query GraphQL data layer

---

# 3. Tech Stack

## Frontend

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- React Server / Client Components where appropriate

## Backend

- Node.js
- TypeScript
- Express or Fastify (prefer Fastify if new service)

## Services

- payment-service
- refund-service
- merchant-service
- notification-service

## API Layer

- Apollo GraphQL Gateway

## Database

- MongoDB

## Auth

- Keycloak mock OAuth2 / OpenID Connect

## Testing

- Playwright
- API integration tests
- Unit tests (Vitest or Jest)

## DevOps

- Docker Compose
- GitHub Actions

---

# 4. Repository Layout

apps/web

services/payment-service
services/refund-service
services/merchant-service
services/notification-service
services/graphql-gateway

packages/shared-types
packages/shared-utils

tests/ui
tests/api
tests/graphql

docs

---

# 5. Engineering Standards

## General

- Use strict TypeScript
- Prefer explicit types
- Keep files focused and small
- Prefer composition over inheritance
- Avoid hidden magic behavior
- Use clear domain naming
- Use consistent folder conventions

## Code Quality

- No dead code
- No placeholder TODO logic unless requested
- No duplicated utility functions
- Reuse shared packages

## Maintainability

- Keep functions testable
- Separate concerns
- Keep side effects isolated
- Favor readability over cleverness

---

# 6. Frontend Standards

## UI Style

Merchant portal / enterprise admin UI.

Use:

- responsive layout
- sidebar nav
- top header
- cards
- charts
- data tables
- filters
- modals
- badges
- toasts

## UX

- fast load states
- skeleton loaders
- clear error states
- optimistic updates only when safe
- accessible forms
- keyboard friendly interactions

## React

- Functional components only
- Use hooks cleanly
- Avoid unnecessary re-renders
- Keep state local when possible
- Use server components for data fetching when beneficial

---

# 7. Backend Standards

## APIs

Use REST internally between services.

Requirements:

- input validation with zod
- structured errors
- request IDs
- health endpoints
- typed responses

## Logging

Use pino.

Log:

- errors
- warnings
- service lifecycle
- key business events

Never log secrets.

## Reliability

- graceful error handling
- retry transient downstream failures
- timeouts for outbound requests
- idempotency for refunds where applicable

---

# 8. GraphQL Standards

Use Apollo Gateway.

Schema should include:

- Transaction
- Merchant
- Refund
- User

Rules:

- thin resolvers
- call backend services cleanly
- paginate lists
- validate auth context
- role-based access control

---

# 9. Database Standards

MongoDB is source of truth for demo data.

Collections:

- transactions
- merchants
- refunds
- users

Use indexes for:

- transactionId
- merchantId
- createdAt
- status

---

# 10. Payments Domain Rules

## Transaction Statuses

AUTHORIZED
CAPTURED
FAILED
PENDING
REFUNDED
CHARGEBACK
CANCELLED

## Refund Rules

- partial refund cannot exceed remaining amount
- full refund closes refundable balance
- duplicate idempotency keys rejected
- refunded transactions remain auditable

## Sensitive Data

- never expose full PAN
- mask card numbers
- no raw secrets in UI

---

# 11. Security Standards

- OAuth2 / OIDC flows
- role-based authorization
- secure cookies where relevant
- validate JWT/session tokens
- sanitize inputs
- no secrets in source code
- use env vars

Roles:

- admin
- analyst
- merchant

---

# 12. Testing Standards

## Required Coverage

- unit tests for business logic
- integration tests for services
- GraphQL tests
- Playwright E2E flows

## Playwright

Use:

- page object model
- fixtures
- deterministic selectors
- parallel runs
- retries only when justified
- traces/screenshots on failure

## Critical Flows

- login
- transaction search
- refund flow
- role restrictions
- GraphQL query rendering

---

# 13. CI/CD Standards

GitHub Actions pipelines:

- install
- lint
- typecheck
- unit tests
- integration tests
- playwright smoke
- artifact upload

Nightly optional:

- full regression

---

# 14. Performance Expectations

Optimize for:

- quick local startup
- responsive UI
- efficient queries
- minimal overfetching
- lazy loading where useful

---

# 15. Documentation Standards

Whenever adding features, update docs if meaningful.

Use concise README sections:

- setup
- run locally
- architecture
- scripts
- testing

---

# 16. Response Behavior for Claude

Default behavior:

- be concise
- prefer code over explanation
- preserve architecture
- touch minimum files necessary
- output patch-ready content
- avoid repeating known context
- minimize token usage

When modifying existing code:

- show changed files only
- do not rewrite unrelated files
- keep style consistent

When requirements are ambiguous:

- choose pragmatic production defaults
- note assumptions briefly

---

# 17. Token Efficiency Rules

Prefer:

- diffs
- changed files only
- short explanations
- reuse repo context

Avoid:

- repeating prompt requirements
- long summaries
- verbose tutorials unless asked
- generating unnecessary files

---

# 18. Priority Order

1. correctness
2. maintainability
3. security
4. developer experience
5. performance
6. visual polish

---

# 19. When Asked to Build New Features

Process:

1. inspect existing structure
2. reuse patterns
3. add minimum required files
4. include tests when practical
5. keep implementation production-ready

---

# 20. Examples of Good Short Prompts

- Build refund API with idempotency.
- Add transactions filters to UI.
- Create Playwright tests for login and refund flow.
- Add GraphQL pagination to transactions query.
- Improve dashboard loading states.

---

# 21. Avoid:

- repeating prompt requirements
- long summaries
- verbose tutorials unless asked
- generating unnecessary files

# 22. Final Rule

Merchant360 should look like software built by a strong full-stack engineer in a real payments company.
Every output should reinforce that standard.