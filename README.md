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

The core assignment is implemented: npm workspaces, PostgreSQL persistence, the complete owner-scoped API, Auth0 PKCE frontend authentication, required collection/bookmark screens, adversarial privacy tests, and deterministic CI verification. Optional edit UI and bonus features remain intentionally deferred.

## Confidentiality

Do not commit the confidential source assignment PDF, rendered PDF pages, local environment files, Auth0 credentials, tokens, cookies, database dumps, or temporary artifacts.

## Technology Stack

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

## All Bookmarks Bonus

`GET /all` and the protected `/all` frontend page show every owned collection with its bookmarks, retain empty collections, and display uncategorised bookmarks separately. The backend uses two owner-scoped reads in a transaction and groups results in memory, avoiding one query per collection. The page is read-only and links to the existing bookmark detail screens.

## Full-Text Search Bonus

The Bookmarks page supports PostgreSQL full-text search over bookmark titles and notes. Submit a 1–200 character query through the Search field; it can be combined with a collection or uncategorised filter and retains normal bounded pagination. Titles rank above notes, English word forms are stemmed, and ties use deterministic newest-first ordering.

The backend uses PostgreSQL `websearch_to_tsquery`, a weighted GIN expression index from the second migration, and parameter-bound Prisma raw SQL. Both result rows and totals are filtered by the authenticated internal owner ID. No search query, rank, or matching information from another user enters the response.

## Verification

With the PostgreSQL container running and migrated:

```shell
npm run verify
```

The command runs the frontend format check, lint, TypeScript checks, unit tests, PostgreSQL-backed database and authentication integration tests, and production builds. Database tests use isolated records and clean up their own data; they do not delete seed data.

Frontend `.tsx` files use the committed Prettier configuration. Run `npm run format --workspace=frontend` to apply it; `npm run verify` includes a non-mutating format check.

See `VERIFICATION.md` for the security review, two-user privacy matrix, real Auth0 smoke evidence, migration/seed checks, and external CI evidence boundary.

## Continuous Integration

GitHub Actions runs on pushes to `main`/`dev` and on pull requests. Each run installs the committed lockfile with `npm ci`, starts an isolated PostgreSQL 17 service, generates Prisma Client, applies the committed migration, runs the deterministic seed, and executes `npm run verify`. CI does not use real Auth0 credentials; token-validation tests use controlled local keys.

## Docker Application Stack Bonus

The default Compose behavior remains database-only for the local development workflow:

```shell
docker compose up -d
```

To build and run PostgreSQL, a one-shot migration job, the production NestJS API, and the Nginx-served React application:

```shell
docker compose --profile app up --build -d
docker compose --profile app ps
```

The full stack uses the existing ignored `backend/.env` and `frontend/.env` files. The backend container overrides `DATABASE_URL` to use the internal `postgres:5432` service while retaining the configured OIDC issuer/audience/JWKS values. The frontend container accepts only these public runtime values:

- `VITE_AUTH0_DOMAIN`
- `VITE_AUTH0_CLIENT_ID`
- `VITE_AUTH0_AUDIENCE`
- `VITE_API_BASE_URL`

Do not add an Auth0 Client Secret, password, Access Token, or other secret to frontend configuration. Nginx generates `/runtime-config.js` when the container starts, validates the public value formats, and serves the file with `Cache-Control: no-store`; the same frontend image can therefore be configured without rebuilding it. Local Vite development continues to use `frontend/.env` through the committed empty fallback file.

Service startup is ordered as follows:

```text
PostgreSQL healthy -> migration completed -> backend healthy -> frontend
```

Both application images use multi-stage builds. The backend runs as the non-root Node user and installs with `npm ci --omit=dev`; the separate migration target retains the full build workspace required for `prisma migrate deploy`. Prisma 7's production client currently brings its CLI/TypeScript packages transitively, so the runtime is larger than an ideal artifact-only Node image even though direct test/build dev dependencies such as Jest are omitted. The frontend final image contains only Nginx, static build output, and runtime-config templates.

Smoke endpoints and ports:

- Frontend: `http://localhost:3000`; unauthenticated health check at `/healthz`.
- Backend: `http://localhost:3001`; its Docker health check treats the expected authenticated-root `401` as proof that the HTTP boundary is ready.
- PostgreSQL host mapping remains `localhost:5433`; containers use `postgres:5432` internally.

Stop the full stack without deleting the database volume:

```shell
docker compose --profile app down
```

Add `--volumes` only when intentionally deleting local PostgreSQL data.

## Completed and Deferred Scope

Completed scope includes all required backend verbs, owner-scoped filters and nested routes, collection/bookmark list/detail/create/delete UI, pagination, destructive confirmations, real Auth0 login/callback/logout smoke testing, two-user privacy verification, the `/all` bonus overview, production-style application Dockerfiles with a verified full-stack Compose profile, and owner-scoped PostgreSQL full-text search.

Deferred by design:

- Frontend PUT/PATCH edit screens. The fully tested backend endpoints remain available.
- Sharing, because the assignment requires personal private resources; its design is recorded in `DECISIONS.md`.
- Frontend PUT/PATCH edit screens and sharing remain intentionally deferred as described above; all three planned bonus sessions are complete.
