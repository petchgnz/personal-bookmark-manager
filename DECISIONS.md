# Decisions

Decision records for the Personal Bookmark Manager.

## 2026-08-04 - Initial Scaffold Without Dependency Installation

The repository was scaffolded as an npm workspaces monorepo with separate `backend` and `frontend` workspaces, but dependencies were not installed yet.

Reason: the assignment requires verifying required package versions and compatibility before installation, especially React Router v8+ and MUI v9+. Creating the structure first keeps this change small and avoids premature dependency or lockfile changes.

Impact: workspace scripts exist as placeholders until the actual toolchains are selected and installed.

## 2026-08-04 - React Router v8 Requires Newer Node 22

The npm registry has React Router 8.3.0 and MUI 9.2.0, satisfying the assignment's required frontend major versions. Installing React Router 8.3.0 produced an npm engine warning because the local runtime is Node 22.19.0 while React Router 8.3.0 requires Node >=22.22.0.

Decision: keep React Router v8 to satisfy the assignment and update the root Node engine requirement to >=22.22.0. Developers should upgrade Node before running install or project scripts.

Impact: this is a development/runtime prerequisite change only. It does not change API behavior, data privacy, or database schema.

## 2026-08-04 - Internal User Identity and Restricted Ownership

Decision: persist users with an internal UUID and a unique `(externalIssuer, externalSubject)` identity mapping. Collections and bookmarks reference the internal `User.id`. Email remains nullable profile data and is not an identity key.

Reason: OIDC subjects are scoped by issuer, while email can change and may not be present. Internal IDs keep the domain model independent from Auth0 identifiers.

Trade-off: every authenticated request needs a user lookup or atomic upsert. This is accepted to provide stable foreign keys and future identity-provider flexibility.

User deletion is not part of the assignment API. Ownership foreign keys use `RESTRICT` rather than cascade deletion to avoid accidental loss of all private data.

## 2026-08-04 - Database-Enforced Same-Owner Collection Relation

Decision: bookmarks store internal nullable `collectionId` and `collectionOwnerId` relation fields. A composite foreign key references `Collection(id, ownerId)`, and a custom migration CHECK constraint requires `collectionOwnerId = Bookmark.ownerId` whenever a bookmark is categorised.

Reason: a foreign key on `collectionId` alone proves only that a collection exists; it does not prove same-user ownership. Reusing `Bookmark.ownerId` directly in a composite `ON DELETE SET NULL` foreign key would incorrectly attempt to clear bookmark ownership when a collection is deleted. The separate internal relation field allows PostgreSQL to clear only the collection relation while preserving `Bookmark.ownerId`.

Trade-off: `collectionOwnerId` is redundant internal persistence data and must never be exposed by the API. Prisma does not model CHECK constraints directly, so future migrations must preserve and review the custom `bookmarks_collection_owner_consistency` constraint. Application authorization remains mandatory even with this defense-in-depth constraint.

## 2026-08-04 - Local PostgreSQL Uses Host Port 5433

Decision: map Docker PostgreSQL container port 5432 to host port 5433.

Reason: a Windows PostgreSQL service already owns host port 5432. Initial Prisma migration attempts reached that unrelated database and failed authentication even though the Docker container was healthy.

Impact: local connection examples and defaults use port 5433. Container-internal PostgreSQL remains on its standard port 5432. Non-local environments must provide `DATABASE_URL`.

## 2026-08-04 - Prisma 7 Client and Test Runtime

Decision: use the Prisma 7 `prisma-client` generator with an explicit ignored output directory and the PostgreSQL driver adapter. Use `tsx` for the TypeScript seed and enable Node VM modules only for the database Jest command.

Reason: Prisma 7 requires an explicit generated-client output and a driver adapter. The generated NodeNext TypeScript imports do not execute correctly through CommonJS `ts-node`; `tsx` resolves them correctly. Prisma's query compiler uses dynamic imports under Jest and requires VM modules for this integration suite.

Trade-off: database tests currently emit Node's experimental VM Modules warning. Application runtime does not require that flag.

## 2026-08-04 - API Access Tokens and RS256 Verification

Decision: accept only OIDC access tokens whose audience contains the configured API identifier. Verify them against the trusted issuer JWKS with an explicit RS256 allowlist, exact issuer and audience checks, temporal claim validation, and a required subject. Reject ID tokens whose audience is the frontend client.

Reason: an ID token proves authentication to the frontend and is not an API authorization credential. Explicit algorithm and claim checks avoid trusting unverified payload data or an unexpected signing mode. Live discovery confirmed the configured Auth0 tenant exposes the expected issuer, discovery endpoints, and RSA signing keys.

Impact: `OIDC_ISSUER`, `OIDC_AUDIENCE`, and `OIDC_JWKS_URI` are public configuration values with documented development defaults; they are not secrets. Verification failures intentionally collapse to a generic `401`. Raw tokens are never logged or persisted.

## 2026-08-04 - Global Authentication and Atomic Provisioning

Decision: install authentication as a Nest global guard. After token verification, atomically upsert a user by unique `(externalIssuer, externalSubject)` and attach a safe internal-user projection to the request. `GET /me` returns that projection.

Reason: global protection makes authenticated access the default for current and future controllers. Atomic upsert makes concurrent first requests idempotent, while `User.id` remains the stable domain owner identifier.

Trade-off: every authenticated request currently performs a database upsert. Caching can be evaluated only if profiling justifies it; correctness and immediate provisioning take priority. Email and display name remain null until a verified profile-data policy is implemented.

## 2026-08-04 - Owner-Scoped Collection Mutations and Errors

Decision: every Collection read, count, update, and delete includes the authenticated internal `ownerId` in its database predicate. Updates and deletes use atomic owner-scoped mutations; missing and cross-owner resources return the same `RESOURCE_NOT_FOUND` response. Paginated rows and totals are computed with the same owner predicate.

Reason: controller-level checks or separate existence prechecks can disclose another user's resource or create time-of-check/time-of-use gaps. Owner predicates at the data-access boundary make privacy part of the operation itself.

Decision: use a global validation pipe and exception filter to reject unknown fields and emit a safe `{ statusCode, code, message, details? }` contract. Request IDs remain deferred because adding them now would require request-context plumbing without improving the core privacy behavior.

Impact: Collection PUT requires the full editable shape (`name`); PATCH changes only an explicit `name`, while omitted/empty or explicit `null` input is invalid. No database schema change was required.

## 2026-08-04 - Bookmark Filters, Validation, and Relation Authorization

Decision: bookmark lists accept either `collectionId=<uuid>` or `uncategorised=true`, never both. `uncategorised=false` is rejected because it is ambiguous with an omitted filter. Full-text search remains bonus scope. Pagination retains the Collection defaults and maximum.

Decision: URLs must be trimmed absolute HTTP/HTTPS URLs up to 2,048 characters; titles are trimmed non-empty strings up to 300; notes are nullable trimmed strings up to 10,000. The notes limit is an API safety constraint over PostgreSQL `TEXT` and does not require a schema migration.

Decision: any non-null `collectionId` is checked with `(id, ownerId)` inside the same transaction as bookmark creation/update. Bookmark mutations and read-backs also include the authenticated `ownerId`; nested routes authorize the collection and scope rows/totals by both owner and collection.

Reason: these predicates prevent mass assignment and cross-owner relation creation while ensuring filters, totals, and nested endpoints do not reveal another user's private data. Missing and foreign relations deliberately share the same safe response.

## 2026-08-04 - API Hardening Limits and Regression Boundary

Decision: reject an empty OIDC `sub` even when it is technically a string. Cap pagination `page` at 1,000,000 in addition to the existing `limit` cap of 100.

Reason: the internal identity mapping requires a meaningful non-empty subject. An unbounded page can produce unsafe or database-invalid offsets even though it passes integer validation; a high explicit cap preserves predictable offset behavior without silently changing the request.

Decision: maintain an adversarial regression suite that enumerates every controller route without credentials, checks that invalid token values are not echoed, verifies unexpected errors are normalized, compares foreign and missing filter behavior, and exercises a concurrent Bookmark-create/Collection-delete race.

Impact: no route was made public, no schema or dependency changed, and no sensitive logging was added. The concurrency result is deliberately either successful creation followed by `SET NULL`, or a safe Collection `404`; a `500` or orphan relation is invalid.

## 2026-08-04 - Frontend Authentication and Server-State Foundation

Decision: use `@auth0/auth0-react` with Authorization Code Flow plus PKCE, API audience configuration, a dedicated `/callback` route, and SDK-managed memory caching. Do not use Implicit Flow, `localStorage`, a Client Secret, or custom token persistence.

Reason: the SDK handles PKCE, callback validation, token renewal, and in-memory caching for a public SPA. The frontend requests an API Access Token and the centralized API client attaches it immediately before each request; ID Tokens are never used as Bearer credentials.

Decision: wrap the app with React Router, Auth0, a single application QueryClient, and MUI theme providers. Create a fresh QueryClient per test when query behavior is tested. Use MUI as the component system and Tailwind v4 utilities for layout, with explicit CSS layer ordering and MUI `enableCssLayer`.

Decision: fail closed with a visible configuration error when any required `VITE_*` public value is missing. Permit browser API requests only from `FRONTEND_ORIGIN`; untrusted origins receive no CORS grant.

Trade-off: the initial production JavaScript chunk is about 621 KB before gzip (about 191 KB gzip), triggering Vite's 500 KB advisory. Route-level code splitting is deferred to Session 9 when real feature pages provide meaningful split boundaries; this is a performance warning, not a correctness failure.

### Local Port Correction

The company Auth0 application allows only `http://localhost:3000/callback` and `http://localhost:3000` logout. Because the React SPA handles the PKCE callback, the frontend—not the resource API—must own port 3000. Vite is fixed to port 3000 with `strictPort`, NestJS moves to port 3001, the frontend API base URL becomes port 3001, and CORS trusts only the frontend on port 3000.

This supersedes the initial Session 8 assumption that Vite could remain on its default port 5173. No Auth0 Dashboard access or configuration change is required.

## 2026-08-05 - Deterministic CI Uses an Ephemeral PostgreSQL Service

Decision: GitHub Actions uses a PostgreSQL 17 service container, installs only from the committed npm lockfile, applies the committed Prisma migration, runs the deterministic two-user seed, and then executes the same `npm run verify` gate used locally.

Reason: database and privacy behavior cannot be represented honestly by SQLite or mocked persistence. A fresh service per CI job proves migration compatibility and prevents state from one run affecting another. Real Auth0 credentials are deliberately excluded; cryptographic and API authentication tests use controlled local keys, while the real tenant flow remains a documented manual smoke test.

Security impact: workflow permissions are read-only, no repository secrets are required, and the database credentials exist only inside the disposable CI job. CI runs on Linux because GitHub service containers require a Linux runner.

## 2026-08-05 - `/all` Uses Two Owner-Scoped Reads

Decision: expose the first-priority bonus as authenticated `GET /all`, returning owned collections with nested bookmarks and a separate uncategorised list. Empty collections are retained. The frontend `/all` page is a read-only overview linking to existing bookmark details.

Decision: query owned collections and owned bookmarks once each inside a transaction, then group bookmarks in application memory. Do not query bookmarks once per collection and do not add a schema change or dependency.

Reason: the two-query design has constant database query count, produces a consistent overview, and makes privacy predicates explicit on both resource tables. The endpoint is deliberately unpaginated to match the assignment's small-scale “all” bonus; production-scale unbounded data would require a revised bounded or cursor-paginated contract.

## 2026-08-05 - Application Containers Preserve the Database-Only Workflow

Decision: keep PostgreSQL as the default Compose service and place the migration, backend, and frontend services behind the `app` profile. `docker compose up -d` therefore remains compatible with local development, while `docker compose --profile app up --build -d` verifies the production-style stack.

Decision: use multi-stage Node builds, a non-root backend runtime, a one-shot Prisma migration target, and an Nginx static frontend. Health/dependency conditions enforce PostgreSQL healthy, migration completed, backend healthy, then frontend. The existing `start:prod` command is corrected to the actual Nest output at `dist/src/main.js`.

Decision: frontend Auth0/API values are public runtime configuration, not build-time secrets. Nginx generates a non-cacheable `runtime-config.js` after validating a conservative character set. Local Vite loads an empty public fallback then uses `import.meta.env`; the container overrides those values at startup. A Client Secret or token is never accepted or required.

Trade-off: the official Nginx image starts with its standard root entrypoint/master process so it can generate configuration and bind port 80; worker processes use the image's `nginx` account and Compose applies `no-new-privileges`. The backend application itself runs as the non-root `node` user. A stricter arbitrary-UID/read-only Nginx deployment would require writable tmp/cache mounts and is beyond this take-home bonus.

## 2026-08-05 - Weighted PostgreSQL Full-Text Search

Decision: extend `GET /bookmarks` with optional trimmed `search` input of 1–200 characters. Search title and notes with PostgreSQL's English configuration, assign title weight A and notes weight B, and rank with `ts_rank_cd` before deterministic timestamp/ID ordering. Plain letter/number input is normalized into bound prefix `to_tsquery` terms so partial words match; advanced syntax continues through `websearch_to_tsquery`. Search may be combined with one existing collection/uncategorised filter and retains bounded offset pagination.

Decision: create a GIN expression index in a committed migration rather than add a stored search column. Prisma's schema DSL does not represent this weighted PostgreSQL expression index, so migration SQL is the authoritative definition. CRUD remains unchanged, existing rows require no data rewrite, and rollback consists only of dropping the new index.

Decision: use `$queryRaw` with `Prisma.sql` fragments and value binding for this database-specific feature; never use `$queryRawUnsafe`, concatenate search input, or make table/column names dynamic. Both data and count statements begin with the authenticated `owner_id` predicate and apply identical search/filter predicates.

Reason: this provides stemming, phrase/web syntax, relevance ordering, and an indexable query while retaining the privacy and pagination contract. Title weighting produces more useful ranking than treating long notes and concise titles equally.

Follow-up: manual acceptance testing showed that exact lexeme matching made `net` fail to find `Netflix`. Prefix behavior is limited to plain input so it improves incremental search without changing quoted phrase, `OR`, exclusion, or punctuation semantics. PostgreSQL derives the normalized lexemes and all user values remain bound parameters.

## Agent Steering Evidence

The decisions above were translated into explicit guardrails rather than left to framework defaults:

- The agent was directed away from accepting whichever OIDC token decoded successfully. `AGENTS.md`, exact issuer/API-audience/RS256 verification, and negative ID-token tests enforce the chosen Access Token boundary.
- The agent was directed away from a typical cascade-delete or speculative sharing model. The schema uses `SET NULL`, relation ownership is enforced in application queries and database constraints, and sharing is documented but intentionally absent.
- The agent was directed away from generic partial-update helpers. Separate PUT/PATCH DTOs, explicit omitted-versus-null semantics, rejected system fields, and two-user mutation tests encode the contract.

These constraints were reviewed through the reusable `.agent/security-review.md` and `.agent/verify-privacy.md` workflows whenever endpoints or persistence behavior changed.

## 2026-08-05 - One Edit Action with Method-Specific Mutations

Decision: add optional edit UI after manual testing showed that create/delete-only frontend flows were frustrating. Keep HTTP vocabulary out of the interface. Collection rename uses PATCH because it changes one editable field; Bookmark edit uses PUT because the dialog loads and submits the complete editable shape.

Reason: asking a person to choose PUT versus PATCH would expose transport semantics and create a poor UX. Reusing the create dialogs preserves validation and error behavior, while method-specific hooks keep the API contract explicit and testable.

Trade-off: edit remains detail-page driven rather than adding inline controls to every list card. This keeps lists uncluttered and gives destructive/edit actions one predictable location. Successful mutations update detail caches immediately and invalidate every affected list/overview family.

## 2026-08-05 - Collection Name Filtering Completes the Core Contract

Decision: support optional `name` filtering on `GET /collections` as a trimmed, case-insensitive contains match with the existing Collection name limit of 120 characters. The required frontend Collection flow does not demand a filter control, so the backend contract remained independently usable; after the user verified the API and requested the UI, the existing Collections page gained a URL-backed search control using that contract.

Reason: the assignment requires filtering for both resources but does not define a useful Collection predicate. Name contains matching is predictable for people, needs no schema change at the take-home data scale, and preserves duplicate-name behavior. Exact matching would be unnecessarily rigid; owner filtering alone is authorization, not the product-level filtering requested by the contract.

Privacy impact: both result and count queries combine the same name predicate with the authenticated internal `ownerId`. PostgreSQL-backed tests include a matching foreign collection and prove it affects neither rows nor pagination totals.

Frontend impact: query keys include the optional name so cached filtered/unfiltered lists remain distinct. Search submission and clearing reset pagination, pagination retains the current search, and the empty state names the active filter. The UI sends no new data beyond the documented API query.

Compatibility follow-up: align the project engine, CI, and Docker build/runtime images on Node `22.22.2` within the Node 22 release line. A clean Session 16 Compose rebuild showed that the current frontend test dependency requires at least this patch version; the earlier `22.22.0` pin still built but emitted `EBADENGINE`. Restricting the root engine to `<23` also matches the documented Node 22 support policy.
