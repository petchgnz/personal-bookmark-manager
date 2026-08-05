# Codex Session 14 Log

- Date: 2026-08-05
- Session: 14 - Final submission audit
- Agent/model: Rex (Codex, GPT-5)
- Tools: PowerShell, Git, npm workspaces, Docker Compose, PostgreSQL, Prisma, Poppler, document extraction tooling, Jest, Vitest
- Starting commit: `30c0951`
- Ending commit: reported in the Git handoff after this log is staged
- Working branch: `codex/chore/final-submission-audit`
- Redactions: confidential assignment contents beyond requirement summaries, credentials, environment values, raw tokens, cookies, screenshots, and hidden reasoning are excluded

## 1. Goal/Task

- Perform a final submission-readiness audit after all planned core and bonus sessions were merged into `dev`.
- Re-read the assignment and decide whether PUT/PATCH must also be implemented in the frontend.
- Verify submission artifacts, documentation consistency, security/privacy evidence, confidential-file hygiene, repository gates, and the production-style Compose stack.

## 2. Prompts and Commands

### User prompts

1. Asked whether any sessions remained after Session 13.
2. Approved a Session 14 final audit and asked for a fresh comparison with the assignment to determine whether PUT/PATCH was required.

### Material actions and commands

1. Confirmed the Session 13 branch was merged and `dev` matched `origin/dev` at `30c0951`; created `codex/chore/final-submission-audit`.
2. Read the complete eight-page assignment with document extraction tooling and visually inspected rendered pages 5-8 with Poppler.
3. Compared backend verbs, required frontend flows, submission artifacts, and rubric language with the implemented scope.
4. Inventoried tracked files, reusable agent workflows, commit history, ignore rules, environment examples, CI, and documentation.
5. Corrected stale/duplicated documentation and made the required agent corrections, steering evidence, prompt evidence, and cost-awareness sections explicit.
6. Scanned tracked paths and secret-shaped patterns without printing environment values or credentials.
7. Ran Prisma validation, migration deployment/status, deterministic seed, and the complete repository verification gate.
8. Validated, rebuilt, and started the full Compose application profile; checked container health, frontend routes/runtime configuration, backend authentication boundary, and trusted/untrusted CORS behavior.
9. Found and replaced the tracked Nest starter `backend/README.md` with project-specific workspace setup and verification guidance; clarified that all four optional items listed in the brief are implemented.

## 3. Code/Logic Created or Modified

- No application code, API behavior, database schema, migration, package, lockfile, environment file, or CI workflow changed.
- README now states that all planned bonuses are complete and explains why frontend edit UI is deferred while backend PUT/PATCH remains required and complete.
- `API_DESIGN.md` now calls out three concrete incorrect first attempts and their evidence-backed corrections, as explicitly requested by the assignment rubric.
- `DECISIONS.md` now summarizes how agent defaults were steered into the chosen authentication, deletion/sharing, and update semantics.
- `AI_WORKFLOW.md` was reorganized into a concise rubric-aligned account of tools/models, decomposition, strengths, failures/recovery, prompt evidence, verification, and cost/token awareness.
- `VERIFICATION.md` now records current test/migration counts and this final audit evidence.
- The backend workspace README no longer contains unrelated Nest starter badges, deployment marketing, or commands that ignore the npm-workspaces context.

## 4. Errors and Debugging Steps

- Bundled Poppler wrappers were not available through the default PATH, and the first document extraction attempt used a Windows encoding that could not print one Unicode symbol. The bundled executable was invoked directly and Python stdout was configured for UTF-8; all relevant pages were then rendered and inspected.
- The first repository verification attempt found Docker running but no repository Compose services. Migration, seed, and database tests failed with connection errors while formatting, lint, typecheck, unit, and frontend tests had passed. `docker compose up -d postgres` restored the existing database without deleting its volume; migration, seed, and full verification then passed.
- The first runtime-placeholder check matched `window.__APP_CONFIG__` and incorrectly reported unresolved content. Inspecting the template showed that real placeholders use `${VITE_...}`. The corrected check confirmed all runtime values were substituted without printing them.

## 5. PUT/PATCH Requirement Decision

- Assignment section 3.1 explicitly requires both `/collections` and `/bookmarks` to support update (PUT) and patch (PATCH). The backend implements and tests both verbs, including full-replacement versus omitted/null semantics and cross-owner privacy.
- Assignment section 3.2 explicitly requires Collection list/view/create/delete and Bookmark list/view/create/delete/filter UI. It does not list frontend update or patch flows.
- The rubric's summary phrase “Auth + CRUD + Prisma + MUI” does not override the more specific frontend list. The defensible scope is complete backend CRUD plus the explicitly listed UI flows.
- Frontend edit screens remain optional and intentionally deferred. Adding them now would increase unrequired surface area and verification cost contrary to the brief's smaller, defensible submission guidance.

## 6. Final Output

- All required submission artifacts are present and tracked; confidential/local artifacts remain ignored.
- Documentation now matches the implemented core and three completed bonuses.
- `npm run verify` passed: frontend 32 tests, backend unit 16 tests, PostgreSQL integration 4 tests, backend e2e 50 tests, format, lint, strict TypeScript, and both production builds.
- Both migrations are current and deterministic seed succeeds.
- PostgreSQL, backend, and frontend production-style containers rebuilt and reached healthy state; HTTP/authentication/CORS/runtime-config smoke checks passed.
- No application or security behavior changed in this audit.

# Your Tasks

- Merge this branch into `dev`, push it, and confirm the GitHub Actions run passes on the resulting commit.
- Before making the repository public/submitting it, confirm `documents/`, `ASSIGNMENT.md`, local `.env` files, `tmp/`, screenshots, tokens, and credentials are absent from GitHub.
- Do not squash the meaningful commit history.

# Tests

- Assignment text extraction and visual inspection: pages 5-8 verified.
- `npm run prisma:validate --workspace=backend`: passed.
- `npm run prisma:migrate:deploy --workspace=backend`: two migrations, none pending.
- `npm exec --workspace=backend prisma migrate status`: schema current.
- `npm run prisma:seed --workspace=backend`: passed.
- `npm run verify`: passed with the counts above.
- `docker compose --profile app config --quiet`: passed.
- `docker compose --profile app build`: passed.
- `docker compose --profile app up -d`: migration completed; all long-running services healthy.
- HTTP smoke checks: frontend health/deep-link/runtime-config `200`; backend unauthenticated `401`; trusted preflight `204`; untrusted origin received no allow-origin header; runtime values substituted with `no-store` caching.
- `git diff --check`: passed before final commit.
