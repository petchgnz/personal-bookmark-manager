# AI Workflow

This document records how AI assistance is used, reviewed, verified, and corrected during the assignment.

## Current Workflow

- Agent: Rex, acting as a senior software engineer.
- Required context before code changes: `ASSIGNMENT.md`, `AGENTS.md`, current repo structure, Git status, and relevant docs.
- Required guardrails: preserve confidentiality, avoid unverified dependency choices, keep changes small, and record real verification outcomes.

Session evidence is maintained in `transcripts/`.

## Review and Recovery Examples

- Session 3 used the repository's persistence review workflow before changing the schema and documented the compatibility, migration, privacy, and test impact.
- The first migration attempt failed because host port 5432 belonged to an unrelated Windows PostgreSQL service, not the Docker container. Container health, TCP authentication, and the owning host process were checked before moving the project mapping to port 5433.
- The first seed runner choice (`ts-node`) was incompatible with Prisma 7 generated NodeNext imports. The failure was reproduced and corrected with `tsx` rather than switching to a legacy generator.
- The first cross-owner database test expected Prisma error `P2004`; the PostgreSQL adapter actually maps this CHECK violation to `P2039`. The test was corrected based on observed behavior while retaining the security assertion.
- Session 4 validated the Auth0 discovery document and live JWKS before fixing the verifier contract to exact issuer/API audience and RS256. Cryptographic tests use generated local keys and never depend on tenant secrets.
- Initial authentication typecheck/lint failures exposed incorrect assumptions about the `jose` v6 key type, available Jest matchers, untyped Supertest bodies, and async mocks. Each test was narrowed and corrected without weakening compiler or lint rules.
- The first authentication e2e run failed with `ECONNREFUSED` because PostgreSQL was stopped. Docker state and a direct Prisma connection were checked, the existing container was started without resetting its volume, pending migrations were checked, and the same e2e suite then passed.
- Session 5's first Collection e2e run showed that `class-validator` treats `null` as optional under `@IsOptional()`. That contradicted the explicit PATCH contract and allowed a database error. The DTO now validates every value except `undefined`, so omitted means unchanged while explicit `null` returns a safe `400` before persistence.
- Session 6 reused the corrected conditional-validation pattern deliberately: PATCH omits `undefined`, rejects null for required Bookmark fields, and permits explicit null only for `notes` and `collectionId`. Two-user e2e tests exercise relation assignment and nested pagination rather than relying only on DTO inspection.
- Session 7 inventoried every controller and Prisma predicate before adding tests. The review found two boundary gaps—empty OIDC subjects and unbounded page offsets—then added narrow fixes plus route-wide authentication, error-leakage, enumeration, and concurrency regression coverage.
- Session 8 checked current official Auth0 React, MUI/Tailwind v4, TanStack Query, and React Router guidance before replacing the Vite demo. TypeScript 6 rejected parameter properties under `erasableSyntaxOnly`, and MUI 9 no longer typed several legacy Stack system props; the implementation was aligned with current APIs instead of weakening compiler settings.
- Vitest did not automatically clean Testing Library DOM state without globals enabled. The false protected-route failures were traced to retained nodes and corrected with explicit `afterEach(cleanup)`. CORS integration then exposed the expected distinction between allowed preflight (`204`) and untrusted origin with no CORS handling (`404`).
