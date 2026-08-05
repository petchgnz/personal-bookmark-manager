# Backend API

NestJS 11 and Prisma 7 API for the private Personal Bookmark Manager. Every route is protected by the global OIDC guard and every resource query is scoped to the authenticated internal user ID.

## Configure

From the repository root, copy the public development defaults and database connection example:

```powershell
Copy-Item backend/.env.example backend/.env
```

The API accepts only RS256 Access Tokens for the configured issuer and API audience. It rejects frontend ID Tokens. Do not put a Client Secret, password, token, or private key in `backend/.env`.

## Database

Start PostgreSQL and prepare the schema from the repository root:

```powershell
docker compose up -d postgres
npm run prisma:migrate:deploy --workspace=backend
npm run prisma:seed --workspace=backend
```

The local API uses PostgreSQL on host port 5433 and listens on `http://localhost:3001`.

## Run and Verify

```powershell
npm run start:dev --workspace=backend
npm run lint --workspace=backend
npm run typecheck --workspace=backend
npm test --workspace=backend
npm run test:db --workspace=backend
npm run test:e2e --workspace=backend
npm run build --workspace=backend
```

Use `npm run verify` at the repository root for the complete frontend/backend quality gate. The database and e2e suites require the project PostgreSQL service.

See the root `README.md` for full-stack setup, `API_DESIGN.md` for the route and privacy contract, `DECISIONS.md` for trade-offs, and `VERIFICATION.md` for the two-user security evidence.
