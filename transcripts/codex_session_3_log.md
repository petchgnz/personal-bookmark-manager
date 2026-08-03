# Codex Session 3 Log

## Metadata

- Date: 2026-08-04
- Session: 3 - Database model and invariants
- Branch: `codex/feat/data-model`
- Starting commit: `4d3c769`
- Ending commit: this session's feature commit; use Git history for the immutable hash
- Agent: Rex
- Tools: Codex shell, apply_patch, Docker Compose, npm, Prisma CLI, Jest, official Prisma documentation
- Redactions: no tokens or external credentials were used; local Docker development credentials are documented project defaults

## 1. Goal / Task

Create a feature branch from `dev`, then implement the Prisma/PostgreSQL data model, initial migration, deterministic two-user seed, and database-backed tests for identity uniqueness, collection deletion, and cross-owner collection relations.

## 2. Prompts and Material Actions

1. The user established `main -> dev -> feature branch` as the required branch workflow, confirmed `dev` was created and checked out, and instructed Rex to continue to the next session.
2. Verified that `dev` was clean and pointed to first commit `4d3c769`.
3. Created and checked out `codex/feat/data-model` from `dev`.
4. Read `AGENTS.md`, local `ASSIGNMENT.md`, backend configuration, Docker Compose, API/decision documentation, and agent review templates.
5. Consulted current official Prisma 7 documentation for generated-client output, PostgreSQL driver adapters, migrations, seeding, relations, and referential actions.
6. Explained the proposed schema and privacy effect before editing, including the internal composite collection-owner relation.
7. Added the Prisma schema, configuration, adapter dependencies, seed, database Jest configuration, and tests.
8. Validated the schema and generated Prisma Client.
9. Started PostgreSQL through Docker Compose and requested approval before creating/applying the migration.
10. Generated the migration with `--create-only`, reviewed it, added the custom same-owner CHECK constraint, and applied it.
11. Ran the deterministic seed twice and ran PostgreSQL-backed invariant tests.
12. Updated public documentation and this transcript with actual decisions, failures, and recovery.

## 3. Code and Logic Changes

- Added `User`, `Collection`, and `Bookmark` Prisma models with UUID IDs, timestamps, field limits, ownership relations, and indexes.
- Added unique external identity `(externalIssuer, externalSubject)`.
- Added a composite `Collection(id, ownerId)` target for bookmark collection relations.
- Added custom PostgreSQL CHECK constraint `bookmarks_collection_owner_consistency`.
- Configured collection deletion to set only bookmark collection relation fields to null.
- Added Prisma 7 PostgreSQL driver adapter and explicit generated client output.
- Added deterministic seed records for two users, two owned collections, categorised bookmarks for each user, and one uncategorised bookmark.
- Added database integration tests for identity uniqueness, `SET NULL` ownership preservation, and rejection of a cross-owner collection relation.
- Added root `test:db` and `verify` scripts.
- Moved local Docker PostgreSQL host mapping from 5432 to 5433 to avoid a host service conflict.

## 4. Errors and Debugging Steps

### Prisma migration reported a schema engine error

- The first `migrate dev --create-only` returned a generic schema engine error.
- Rerunning with engine diagnostics revealed `P1000` authentication failure.
- Docker health, container logs, `pg_isready`, and an internal read-only SQL query showed the container was healthy.
- A host `pg` query still failed authentication.
- Host port inspection showed Windows `postgres.exe` already owned port 5432, so Prisma was reaching the wrong database.
- The project mapping and local URLs were moved to host port 5433. Host authentication then succeeded and migration generation worked.

### Seed failed through ts-node

- Prisma 7 generated TypeScript imports internal modules using `.js` NodeNext specifiers.
- CommonJS `ts-node` could not resolve `./internal/class.js` to the generated TypeScript source.
- The seed runner was changed to development-only `tsx`; the seed then passed twice.

### Database tests required VM modules

- Prisma's query compiler invoked a dynamic import under Jest.
- The database-only test command was changed to launch Jest through Node with `--experimental-vm-modules`.
- Application runtime and normal unit tests do not use this flag.

### Cross-owner test assumed the wrong Prisma error code

- The database correctly rejected the CHECK-constraint violation.
- The initial test expected `P2004`; the Prisma 7 PostgreSQL adapter returned `P2039`.
- The expectation was corrected based on observed adapter behavior without weakening the rejection assertion.

### Quality-gate command used the wrong working directory

- The first final validation command ran from `backend/` while still passing `--workspace=backend` to npm.
- npm correctly returned `No workspaces found`; the migration-status portion still succeeded.
- Prisma validation and generation were rerun from the monorepo root with the correct workspace context and passed.

## 5. Final Output

- Prisma schema validates and client generation succeeds.
- Initial migration is applied to local PostgreSQL.
- The seed is repeatable.
- Database tests prove external identity uniqueness, collection deletion preserving bookmark ownership, and database rejection of cross-owner collection assignment.
- Documentation records the redundant internal relation field, custom CHECK constraint, port decision, and Prisma runtime trade-offs.

## Verification Results

- `npm run prisma:validate --workspace=backend`: passed.
- `npm run prisma:generate --workspace=backend`: passed; generated Prisma Client 7.9.1.
- `npx prisma migrate status`: passed; one migration found and the database schema is up to date.
- `npm run prisma:seed --workspace=backend`: passed twice, proving the deterministic seed can be rerun.
- `npm run verify`: passed.
  - Backend ESLint and frontend Oxlint passed.
  - Backend and frontend TypeScript checks passed.
  - Baseline Jest suite passed: 1 suite, 1 test.
  - PostgreSQL invariant suite passed: 1 suite, 3 tests.
  - NestJS and Vite production builds passed.
- `docker compose config`: passed with host port 5433 mapped to container port 5432.
- Read-only seed verification returned 2 users, 2 collections, and 3 bookmarks.
- Read-only PostgreSQL catalog verification confirmed `bookmarks_collection_owner_consistency` is installed with the intended expression.
- `git diff --check`: passed; only line-ending conversion warnings were reported.

## Security Review

- No HTTP endpoints or authentication paths changed in this session.
- Required ownership foreign keys use internal user UUIDs and `RESTRICT` user deletion.
- The collection relation uses a composite foreign key plus a CHECK constraint to reject cross-owner assignment at the database boundary.
- Database tests cover the new relation mutation and collection delete behavior.
- Seed failure logging emits a fixed message and does not print connection strings or database errors directly.
- No tokens, Auth0 credentials, external-user passwords, or environment files were added.

## Privacy Verification

- The database rejects a bookmark owned by User B referencing User A's collection.
- Deleting User A's collection clears the bookmark's collection relation while preserving the bookmark owner.
- Seed data includes two users with separate collections and bookmarks to support later request-level privacy tests.
- Request owner scoping, indistinguishable `404` responses, pagination isolation, and nested endpoint isolation remain pending because API endpoints are not implemented in Session 3.

## Known Limitations

- No NestJS Prisma service or request-level authorization is implemented yet.
- The custom CHECK constraint exists in migration SQL because Prisma schema syntax does not model it; future migrations must preserve it.
- Database tests emit Node's experimental VM Modules warning.
- Local database tests require the Docker PostgreSQL service to be running and migrated.
