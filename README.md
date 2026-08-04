# Personal Bookmark Manager

Private bookmark manager assignment using an npm workspaces monorepo.

## Repository Layout

```text
backend/       NestJS, TypeScript, Prisma, PostgreSQL API
frontend/      React, Vite, TypeScript web app
.agent/        Reusable agent workflows
transcripts/   Session logs and verification evidence
```

## Status

The npm-workspaces monorepo and NestJS/React application baselines are scaffolded. The Prisma/PostgreSQL model, authentication boundary, atomic user provisioning, authenticated `GET /me`, and complete owner-scoped Collection CRUD API are implemented. Bookmark resources, their ownership controls, and product UI are not implemented yet.

## Confidentiality

Do not commit the confidential source assignment PDF, rendered PDF pages, local environment files, Auth0 credentials, tokens, cookies, database dumps, or temporary artifacts.

## Planned Stack

- npm workspaces
- Backend: Node.js, TypeScript, NestJS, Prisma, PostgreSQL
- Frontend: React, Vite, TypeScript, React Router, MUI, Tailwind CSS utilities, Auth0 React SDK, TanStack Query
- Local database: PostgreSQL through Docker Compose

## Prerequisites

- Node.js 22.22.0 or newer within the Node 22 release line
- npm 10 or newer
- Docker with Docker Compose

## Database Setup

The project maps PostgreSQL to host port `5433` to avoid collisions with a locally installed PostgreSQL service on the default port.

```shell
docker compose up -d postgres
npm run prisma:migrate:deploy --workspace=backend
npm run prisma:seed --workspace=backend
```

The default local connection is documented in `backend/.env.example`. Override `DATABASE_URL` for non-local environments.

## Backend Authentication

The API accepts only Bearer access tokens issued for the configured API audience. It validates the signature through the issuer JWKS plus exact issuer, audience, expiry/not-before, RS256 algorithm, and subject claims. An ID token whose audience is the frontend client is rejected. Configure the public OIDC values in `backend/.env` from `backend/.env.example`; do not store tokens or client secrets there.

On the first valid request, the API atomically creates a user mapped by `(issuer, subject)`. `GET /me` returns only the internal user profile and never returns the external identity pair.

## Collections

Authenticated clients can create, list, view, replace, patch, and delete collections under `/collections`. Lists use `page`/`limit` offset pagination with defaults `1`/`20` and a maximum limit of `100`. Missing and cross-owner resources both return the same `404`; pagination rows and totals never include another user's collections. See `API_DESIGN.md` for the exact contract.

## Verification

With the PostgreSQL container running and migrated:

```shell
npm run verify
```

The command runs lint, TypeScript checks, unit tests, PostgreSQL-backed database and authentication integration tests, and production builds. Database tests use isolated records and clean up their own data; they do not delete seed data.
