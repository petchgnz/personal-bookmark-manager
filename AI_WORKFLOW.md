# AI Workflow

This project was built with Rex (Codex, GPT-5) acting as a senior software-engineering agent, plus PowerShell, Git, npm workspaces, Docker Compose, PostgreSQL, Prisma, browser developer tools, and GitHub Actions. The user made the product and risk decisions; the agent inspected, implemented, tested, documented, and corrected work in small branches. Real chronological evidence is preserved in `transcripts/`.

## Decomposition and Guardrails

Work was split into ten core sessions and three gated bonus sessions. Requirements and ambiguities were resolved first; repository rules, persistence, authentication, resource APIs, adversarial hardening, frontend flows, and submission readiness followed. Bonuses began only after the core `npm run verify` gate and hosted CI passed. Each feature branch came from `dev`, used focused checks while iterating, then ran broader verification before handoff.

`AGENTS.md` carries the architecture, npm-only rule, TypeScript/Prettier conventions, privacy invariant, database boundaries, and required verification into fresh agent sessions. Three reusable workflows in `.agent/` guide security review, two-user privacy verification, and transcript writing. The private invariant is always expressed as executable behavior: every read, count, relation check, and mutation is scoped by authenticated internal `ownerId`; foreign and missing resources receive indistinguishable responses.

## What AI Did Well

1. **Decomposed a security-sensitive API into reviewable increments.** Separate database, auth, Collection, Bookmark, and hardening sessions made it possible to test each boundary before the frontend depended on it. The resulting tests cover token validation, every route without credentials, cross-owner CRUD, pagination totals, relation assignment, deletion behavior, and concurrency.
2. **Turned under-specified requirements into explicit contracts.** The agent helped compare Access Token versus ID Token use, PUT versus PATCH semantics, collection deletion, sharing, pagination, and identity mapping. The user selected the decisions; they were encoded in DTOs, database constraints, tests, `API_DESIGN.md`, and `DECISIONS.md` rather than remaining conversational assumptions.
3. **Recovered effectively from concrete evidence.** Logs, compiler errors, database error codes, browser screenshots, and CI output were used to narrow failures. Fixes stayed local: use `tsx` for Prisma 7 seeding, generate Prisma Client before CI seed, move the SPA to the fixed Auth0 callback port, and correct MUI/Tailwind form layout without weakening validation or adding unnecessary packages.

## Where AI Failed and How It Was Corrected

1. **Framework-default assumptions:** the first frontend foundation retained Vite's port 5173 even though the provided Auth0 application allowed only `http://localhost:3000/callback`. Real login produced a callback mismatch. The PDF was reread, the SPA was moved to 3000 with `strictPort`, the API moved to 3001, and CORS/runtime examples were updated together.
2. **Plausible validation that was semantically wrong:** the first Collection PATCH DTO used `@IsOptional()`, which treats explicit `null` as absent. A PostgreSQL-backed test exposed the mismatch. Conditional validation now skips only `undefined`; nullable Bookmark fields accept `null` deliberately, while required fields reject it.
3. **Clean-runner ordering gap:** local generated Prisma output hid a CI dependency. The first hosted seed failed with `MODULE_NOT_FOUND`. The supplied Actions log led to an explicit generation step before migration and seed. Generated files remain ignored, so CI continues to prove reproducibility from a clean checkout.

Additional corrections are kept in the transcripts: wrong Prisma error-code expectations, stale Testing Library DOM between tests, MUI 9 API changes, incomplete query invalidation, Docker runtime packaging, and exact-word search that did not meet the user's prefix expectation.

## Prompt Evidence

**A prompt that worked:** the user reported the Auth0 callback error with the PDF screenshot, the browser error, the observed ports, and then explicitly said to fix it on the current branch. That prompt supplied evidence, acceptance criteria, and change scope. The result was easy to verify: login returned to `/collections`, `/me` reached port 3001, logout returned to login, and the callback mismatch disappeared.

**A prompt/specification that did not work:** the earlier instruction to continue with the frontend-foundation session did not restate the fixed Auth0 callback constraint. The agent followed Vite's default port and produced a locally plausible but tenant-incompatible result. The recovery changed the workflow: relevant source requirements and environment constraints are now reread before implementation, and manual authentication evidence is treated separately from mocked deterministic tests.

## Review, Verification, and Cost Awareness

AI output was never accepted only because it compiled. Narrow tests were run during iteration; full formatting, lint, strict TypeScript checks, unit tests, PostgreSQL integration/e2e suites, production builds, privacy review, secret review, and diff review were used at session boundaries. Real Auth0 behavior and hosted CI were verified by the user where local deterministic tests could not substitute for external state.

The project optimized effort rather than tracking a fabricated dollar or token total. Context was made reusable through `AGENTS.md`, contracts, decisions, and session transcripts so later sessions did not repeatedly rediscover the system. Narrow checks reduced feedback cost; full verification was reserved for meaningful gates. Core work preceded lightly weighted bonuses, dependencies were not added for decoration, sharing remained deferred, and generated/build artifacts were kept out of prompts and Git. Frontend edit UI was added only after the user identified a concrete workflow problem in manual testing, and it reused existing forms/contracts instead of creating parallel screens. This follows the brief's instruction to prefer a submission that can be understood, verified, and defended.
