# Verification Report

This report records the core quality evidence for the Personal Bookmark Manager. It distinguishes automated evidence, manual real-tenant evidence, and checks that require GitHub-hosted infrastructure.

## Automated Repository Gate

Run with PostgreSQL available and the committed migration applied:

```shell
npm run verify
```

The gate includes:

- Frontend Prettier check.
- Backend and frontend lint.
- Strict TypeScript checks.
- Backend unit tests.
- Frontend component and flow tests.
- PostgreSQL database-invariant tests.
- Authenticated backend end-to-end tests.
- Backend and frontend production builds.

Latest local Session 13 result (2026-08-05): frontend 31 tests, backend unit 16 tests, PostgreSQL integration 4 tests, backend end-to-end 50 tests, format check, lint, strict TypeScript checks, and both production builds passed.

Authentication tests use controlled local signing keys and deterministic JWKS behavior. They cover valid Access Tokens, missing/malformed credentials, invalid signatures and key IDs, disallowed algorithms, incorrect issuer/audience, ID Token rejection, temporal claims, missing/empty subject claims, and malformed tokens.

## Security Review

Review date: 2026-08-05.

- A Nest global guard protects every current controller route, including `/` and `/me`.
- Only RS256 Access Tokens for the configured issuer and API audience are accepted.
- Verified `(issuer, subject)` identities map atomically to internal users; raw external identity values and tokens are not returned.
- Collection and Bookmark reads, counts, updates, and deletes include the authenticated internal `ownerId` in persistence predicates.
- Bookmark relation changes verify the target collection with `(id, ownerId)` inside the mutation transaction.
- Unknown/system-managed fields, invalid URLs, unsafe URL schemes, invalid pagination, and ambiguous filters are rejected.
- Missing and cross-owner resources share the same safe `404` contract.
- Unexpected errors are normalized without stack, SQL, Prisma, path, credential, or token leakage.
- No high-severity security finding remains open.

## Two-User Privacy Verification

PostgreSQL-backed tests prove that User A cannot:

- Read, replace, patch, or delete User B's collections or bookmarks.
- Affect User B's list rows or pagination totals.
- Create or move a bookmark into User B's collection.
- Infer a foreign collection through bookmark filters or nested routes.
- Cause deletion of User A's collection to affect User B's bookmarks.
- Produce an orphan relation or internal error during the covered create/delete concurrency race.

The database also enforces the same-owner bookmark/collection invariant with a composite foreign key and CHECK constraint. This is defense in depth; application owner scoping remains mandatory.

## Real Auth0 Smoke Evidence

The user manually verified the company-provided Auth0 tenant outside deterministic CI:

- Login completed through the hosted page and returned through `/callback`.
- The protected application redirected to `/collections` and displayed the persisted user.
- `GET /me` reached the local API on port 3001 with successful CORS from the frontend on port 3000.
- Logout returned to the login page and removed access to protected content.
- Collection/bookmark create, filter, pagination, and confirmed deletion flows succeeded without CORS errors.
- Deleting a collection preserved its bookmarks as uncategorised.

No credentials, raw tokens, cookies, or screenshots containing authentication material are stored in the repository.

## Migration, Seed, and CI

- `prisma validate` confirms the schema is valid.
- `prisma migrate status` confirms the local database is up to date with the one committed migration.
- The deterministic seed uses stable IDs and upserts two distinct users, their private collections/bookmarks, and an uncategorised bookmark.
- The seed completed successfully twice in succession during Session 10, proving the fixture process is repeatable against the current local database.
- GitHub Actions provisions a fresh PostgreSQL 17 service, generates the ignored Prisma Client output, applies the committed migration, runs the seed, and executes the repository gate.

The first GitHub-hosted run exposed a clean-runner ordering gap: the seed imported the ignored generated Prisma Client before any generation step had run. The workflow now generates the client explicitly before migration and seed. The user confirmed the corrected GitHub-hosted CI run passed on 2026-08-05.

## Session 11 `/all` Privacy Verification

- `GET /all` remains covered by the global authentication route inventory.
- Two-user PostgreSQL e2e coverage proves the response contains only the current owner's collections, categorised bookmarks, and uncategorised bookmarks, while retaining owned empty collections.
- The implementation performs two owner-scoped reads in one transaction and groups in memory, so it introduces no per-collection N+1 query pattern.
- The response exposes no new internal relation fields, secrets, error detail, or cross-owner counts.

## Deferred Scope

- Frontend PUT/PATCH edit screens are optional and deferred; backend PUT/PATCH behavior is implemented and tested.
- Sharing is intentionally not implemented because it conflicts with the private personal-resource requirement.
- Frontend PUT/PATCH edit screens remain optional and deferred; sharing remains intentionally excluded by the private-resource decision. Planned bonus scope is implemented.

## Session 13 Full-Text Search Verification

- A committed non-destructive migration adds a weighted GIN expression index over title and notes; no bookmark data or column changes.
- Database integration inspects the live PostgreSQL index definition for GIN, English `to_tsvector`, and title/notes weights.
- PostgreSQL-backed e2e tests cover title and notes matches, stemming, plain-word prefix matching (`net` to `Netflix`), title-first relevance, collection and uncategorised filters, bounded pagination totals, injection-shaped punctuation, and two-user isolation.
- Both result and count queries bind values through `Prisma.sql` and contain authenticated `owner_id` predicates; no unsafe raw query API is used.
- Frontend tests cover URL encoding, trimmed search combined with the active filter, pagination reset, and the accessible external Search label/placeholder used by the responsive toolbar.

## Session 12 Container Verification

- Compose configuration validates with the application profile while the default profile remains PostgreSQL-only.
- Backend, migration, and frontend images build from the repository root with `.env`, dependency directories, build output, transcripts, and confidential material excluded from the build context.
- The migration container completed against the internal PostgreSQL hostname before the backend started.
- PostgreSQL, backend, and frontend container health checks reached healthy state.
- Nginx returned `200` for `/healthz`, served SPA deep-link fallback, generated runtime configuration without unresolved placeholders, and returned `Cache-Control: no-store` for that configuration.
- The containerized backend returned the expected unauthenticated `401` and allowed CORS only for the configured frontend origin during smoke verification.
- The backend final image runs as `node`, is installed with `--omit=dev`, and excludes Jest. Prisma 7's client still brings Prisma CLI/TypeScript packages transitively; this is documented rather than represented as a fully artifact-only runtime. Frontend public runtime configuration is injected at startup without a Client Secret.
