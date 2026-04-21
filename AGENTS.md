# Merchant360 AI Agent Instructions

## Purpose
This file helps AI coding agents work productively in Merchant360 by capturing repository-specific architecture, conventions, and commands.

## Key commands
- `npm ci`
- `npm run dev` — runs Turborepo development across workspaces
- `npm run build`
- `npm run test`
- `npm run lint`
- `npm run type-check`

Service-level commands are available inside each workspace, e.g. `cd apps/web && npm run dev`.

## Architecture overview
- `apps/web` — Next.js 14 App Router frontend using TypeScript and Tailwind CSS
- `services/graphql-gateway` — Apollo Server GraphQL gateway
- `services/payment-service`, `services/refund-service`, `services/merchant-service`, `services/notification-service` — Node.js services using REST and MongoDB
- `packages/shared-types` and `packages/shared-utils` — shared TypeScript types and utilities
- `tests/ui` — Playwright E2E
- `tests/api` — Vitest API integration tests
- `tests/graphql` — GraphQL integration tests

## Conventions and expectations
- Strict TypeScript and explicit types preferred
- Functional React components only
- Use server components for data fetching when appropriate
- Avoid hidden magic and duplicate utilities
- Keep files small, focused, and testable
- Prefer composition over inheritance
- No placeholder `TODO` logic unless requested

## Backend standards
- Internal service APIs should use REST
- Validate input with `zod` where present
- Use structured errors and request IDs
- Keep side effects isolated
- Log errors/warnings and never log secrets

## Testing guidance
- Use `npx turbo run test` for unit tests across workspaces
- Use `npx vitest run --config tests/api/vitest.config.ts` for service/API tests
- Use `npx vitest run --config tests/graphql/vitest.config.ts` for GraphQL tests
- Use Playwright in `tests/ui` for browser flows

## Useful documentation
- [README.md](README.md) — setup, architecture, and run instructions
- [CLAUDE.md](CLAUDE.md) — project mission, standards, and design goals
- [docs/local-dev.md](docs/local-dev.md) — local development details
- [docs/architecture.md](docs/architecture.md) — architecture guidance

## Notes for agents
- Focus changes on the minimum files required
- Preserve existing patterns and reuse shared packages
- Keep implementation production-ready and aligned with payments domain behavior
