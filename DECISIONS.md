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
