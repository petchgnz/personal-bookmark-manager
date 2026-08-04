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

The npm-workspaces monorepo, complete owner-scoped backend API, adversarial security boundary, and required frontend flows are implemented. The frontend supports authenticated collection and bookmark list/detail/create/delete flows, filters, pagination, confirmations, and explicit loading/error/empty states. Final end-to-end verification, documentation audit, and optional bonuses remain.

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

## Frontend Setup

Copy `frontend/.env.example` to the ignored `frontend/.env` file and replace only the SPA Client ID placeholder with the company-provided public Client ID:

```shell
Copy-Item frontend/.env.example frontend/.env
npm run dev --workspace=frontend
```

The company Auth0 SPA application is preconfigured for `http://localhost:3000/callback` and `http://localhost:3000` logout/web-origin URLs. Vite therefore runs the frontend on port 3000 with `strictPort`; NestJS runs the API on port 3001. The frontend uses Authorization Code Flow with PKCE through the Auth0 React SDK, requests the API audience, and keeps Access Tokens in SDK-managed memory only. Do not put a Client Secret, password, or token in any frontend environment variable.

The backend accepts browser requests only from `FRONTEND_ORIGIN`, defaulting to `http://localhost:3000`. The frontend calls the local API at `http://localhost:3001`. Override both values together for another trusted deployment.

## Collections

Authenticated clients can create, list, view, replace, patch, and delete collections under `/collections`. Lists use `page`/`limit` offset pagination with defaults `1`/`20` and a maximum limit of `100`. Missing and cross-owner resources both return the same `404`; pagination rows and totals never include another user's collections. See `API_DESIGN.md` for the exact contract.

The frontend supports collection list, detail, create, and confirmed delete flows. Deletion clearly states that contained bookmarks survive as uncategorised bookmarks.

## Bookmarks

Authenticated clients can manage bookmarks under `/bookmarks`, filter by `collectionId` or `uncategorised=true`, and list an owned collection through `/collections/:id/bookmarks`. URLs accept only absolute HTTP/HTTPS values. Every row, total, mutation, and relation check is owner-scoped; external collection relations and bookmark resources are hidden behind the same `404` behavior as missing data.

The frontend supports bookmark list, detail, create, and confirmed delete flows, plus collection and uncategorised filters. External links open in a separate browsing context with `noopener noreferrer` protection.

## Verification

With the PostgreSQL container running and migrated:

```shell
npm run verify
```

The command runs lint, TypeScript checks, unit tests, PostgreSQL-backed database and authentication integration tests, and production builds. Database tests use isolated records and clean up their own data; they do not delete seed data.

Frontend `.tsx` files use the committed Prettier configuration. Run `npm run format --workspace=frontend` to apply it; `npm run verify` includes a non-mutating format check.
