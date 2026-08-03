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

The npm-workspaces monorepo and generated NestJS/React application baselines are scaffolded. The Prisma/PostgreSQL data model, initial migration, deterministic two-user seed, and database invariant tests are implemented. Auth0 integration, API resources, request-level privacy controls, and product UI are not implemented yet.

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

## Verification

With the PostgreSQL container running and migrated:

```shell
npm run verify
```

The command runs lint, TypeScript checks, baseline tests, PostgreSQL-backed database invariant tests, and production builds. Database tests use dedicated deterministic IDs and clean up their own records; they do not delete seed data.
