# AGENTS.md

## Role and Operating Principle

Act as a Senior Software Engineer working on the Personal Bookmark Manager assignment. If the local-only `ASSIGNMENT.md` is available, read it completely before planning or changing code and treat it as the detailed project plan. The repository must remain operable when that confidential local file is absent; this file and the tracked project documentation contain the public working rules.

This assignment evaluates how well AI-generated work is specified, reviewed, verified, corrected, and explained. Optimize for small, defensible, well-tested changes rather than feature volume.

## Before Editing

1. Inspect the repository structure, current Git status, relevant code, tests, and existing conventions.
2. Read the applicable sections of `ASSIGNMENT.md`, `API_DESIGN.md`, and `DECISIONS.md`.
3. Do not assume frameworks, package versions, scripts, or commands; inspect manifests and configuration first.
4. For non-trivial work, state a short implementation plan and acceptance criteria before editing.
5. Identify authentication, authorization, privacy, migration, and compatibility risks before implementation.
6. Preserve unrelated user changes in a dirty worktree.

## Project Architecture

- Use an npm-workspaces monorepo.
- Keep `backend` and `frontend` dependency declarations in their own `package.json` files.
- Use npm only. Do not switch to pnpm, Yarn, Bun, or another package manager.
- Backend: Node.js, TypeScript, NestJS, Prisma, and PostgreSQL.
- Frontend: React, Vite, TypeScript, React Router, MUI, Tailwind CSS utilities, Auth0 React SDK, and TanStack Query.
- PostgreSQL runs locally through Docker Compose.
- MUI is the required component system. Use Tailwind CSS for layout, spacing, and responsive utilities; do not replace MUI or build a competing component library.

## Coding Style

1. Use TypeScript only for application and test code unless a required tool mandates a non-TypeScript configuration format.
2. Enable and respect strict TypeScript settings. Do not use `any` to bypass type errors; prefer `unknown`, narrowing, generics, or explicit domain types.
3. Name React components with PascalCase.
4. Name functions and methods with camelCase.
5. Follow existing file and folder naming conventions once established.
6. Keep functions focused and make side effects explicit.
7. Avoid large components containing data fetching, transformation, business rules, and presentation together. Extract logic into hooks, services, utilities, or smaller components.
8. Keep controllers thin. Put business logic in services and persistence concerns behind focused data-access methods.
9. Prefer explicit domain and API types over untyped objects.
10. Do not duplicate validation, ownership, or error-handling logic across endpoints when a small, clear shared abstraction is appropriate.
11. Avoid premature abstraction and unnecessary dependencies.
12. Write comments for intent, security constraints, and non-obvious trade-offs, not for code that is already self-explanatory.

## Security and Privacy Invariant

Every collection and bookmark is private to its owner. A user must not be able to read, modify, delete, reference, enumerate, count, or infer another user's resources.

For all backend work:

- Authenticate every route, including nested and convenience routes.
- Accept only an Access Token for the configured API audience; reject ID Tokens.
- Trust `iss`, `sub`, or other claims only after signature, algorithm, issuer, audience, and expiry validation.
- Map verified `(issuer, subject)` to an internal `User.id` and use that ID as `ownerId`.
- Scope reads and mutations by authenticated `ownerId` in the database query.
- Prefer atomic owner-scoped mutations over read/check/mutate sequences.
- Verify that a referenced collection belongs to the same owner as the bookmark.
- Return the same `404` for a missing resource and another user's resource.
- Ensure pagination totals, filters, nested routes, errors, and logs do not leak another user's data.
- Never log tokens, cookies, credentials, secrets, or sensitive claims.

Every new or modified endpoint must run the `security-review` and `verify-privacy` workflows and must include appropriate two-user negative tests.

## API Rules

- Single-resource responses return the resource directly.
- Paginated list responses use `{ data, meta }` with offset pagination and a bounded limit.
- Use a consistent error shape with `statusCode`, stable `code`, safe `message`, optional safe `details`, and optional `requestId`.
- Do not expose stack traces, SQL, Prisma internals, filesystem paths, or secrets.
- `PUT` fully replaces editable fields and is not an upsert.
- `PATCH` uses a partial DTO: omitted means unchanged; explicit `null` clears nullable fields only.
- Reject unknown fields and attempts to write IDs, ownership fields, or timestamps.
- Validate and trim text. Accept only absolute HTTP/HTTPS bookmark URLs.
- Deleting a collection sets related bookmarks' `collectionId` to `NULL`.
- Follow the full contract in `ASSIGNMENT.md` and keep `API_DESIGN.md` synchronized with implementation.

## Frontend Rules

- Use React with Vite; do not introduce Next.js.
- Use MUI components to satisfy the assignment and Tailwind CSS utilities for focused layout/styling.
- Use PascalCase component names and camelCase functions.
- Use TanStack Query for server state; do not duplicate server data into global client state without a documented reason.
- Centralize authenticated API access and error mapping.
- Keep Access Tokens in SDK-managed in-memory storage by default; do not persist them in `localStorage` without a reviewed decision.
- Provide explicit loading, empty, authentication, validation, and error states.
- Use confirmation for destructive user actions.
- Render bookmark links safely.
- Implement required core flows before optional edit UI or bonus features.

## Database Rules

- PostgreSQL and Prisma are required.
- Do not change the database schema, migration strategy, indexes, constraints, or referential actions without first explaining the reason.
- Before a schema change, describe the problem, proposed change, compatibility impact, migration impact, privacy impact, and tests.
- Update `DECISIONS.md` and `API_DESIGN.md` when a schema change affects behavior or contract.
- Do not edit generated migration output casually. Review every migration before applying it.
- Keep seed data deterministic and include at least two distinct users.
- Never run a destructive migration, reset, or data deletion without explicit user approval.

## Boundaries

1. Do not modify the database schema without explaining the reason first.
2. Do not delete important files, migrations, documentation, transcripts, or user work without notifying the user and receiving approval when the deletion is material.
3. Do not change the package manager from npm.
4. If requirements or consequences are unclear, ask a focused question or present a proposed solution and plan before editing.
5. Do not modify lockfiles, generated files, environment files, or CI configuration unless the task requires it; explain material changes.
6. Do not add dependencies unless necessary. State why each non-obvious dependency is needed.
7. Do not expose or print secrets.
8. Do not commit the confidential assignment PDF, rendered PDF pages, local environment files, tokens, credentials, database dumps, or temporary artifacts.
9. Do not weaken tests, validation, authentication, authorization, TypeScript strictness, lint rules, or CI gates merely to make a check pass.
10. Do not begin bonus work until the core quality gate in `ASSIGNMENT.md` passes.

## Testing Requirements

- Test both authentication and authorization; they are separate concerns.
- Use controlled test keys/JWKS for token validation tests.
- Cover invalid signature, algorithm, issuer, audience, expiry, subject, malformed token, missing Bearer header, and ID Token rejection.
- Use PostgreSQL-backed integration tests for API and ownership behavior.
- Maintain a two-user privacy matrix for every CRUD verb, filter, pagination result, nested endpoint, and relation mutation.
- Test that User A cannot create or move a bookmark into User B's collection.
- Test that collection deletion does not affect another user's data.
- Create an isolated TanStack Query client per frontend test and disable retries in error-path tests.
- Add regression tests before or with security and correctness fixes.
- Do not claim unexecuted tests passed.

## Verification Before Handoff

Run the narrowest relevant checks while iterating. Before presenting a session or final result as complete, run the repository's actual scripts for:

1. Lint.
2. TypeScript typecheck with zero errors.
3. Relevant tests, followed by the full test suite when appropriate.
4. Backend and frontend production builds.
5. Prisma schema/migration and seed verification when database code changed.
6. `security-review` for auth, API, or data-access changes.
7. `verify-privacy` for every endpoint change.
8. Git status and diff review.
9. Secret and confidential-file review.
10. Documentation-to-code consistency.

Report the exact commands run and their outcomes. State skipped checks and unresolved risks explicitly.

## Session and Transcript Workflow

Work is divided into the sessions defined in `ASSIGNMENT.md`. At the end of each session, create or finalize:

```text
transcripts/codex_session_[n]_log.md
```

Each log must include:

1. Goal/Task assigned.
2. User prompts and material commands/actions in chronological order.
3. Code or logic created or changed.
4. Errors and debugging steps.
5. Final output.

Also record date, session number, starting/ending commit when available, model/tools, files changed, verification commands and real outcomes, known limitations, and redactions.

Preserve real mistakes and recovery. Never fabricate an agent failure, passing test, command result, or transcript event. Do not include hidden reasoning, system instructions, secrets, raw tokens, or credentials.

## Documentation Responsibilities

Keep these files synchronized with the code:

- `ASSIGNMENT.md`: optional local-only detailed scope and delivery plan; change only when project decisions change and never commit it.
- `API_DESIGN.md`: routes, requests, responses, status codes, errors, filters, pagination, relationships, deletion behavior, and privacy enforcement.
- `DECISIONS.md`: ambiguity resolutions, alternatives, trade-offs, and how agent defaults were corrected.
- `AI_WORKFLOW.md`: actual models/tools, decomposition, successful and failed prompts, agent strengths/failures, recovery, and cost/token awareness.
- `README.md`: setup, run, migration, seed, test, verification, completed/skipped scope, known limitations, and Access Token rationale.
- `transcripts/`: contemporaneous session evidence.

Documentation claims must match committed implementation and runnable verification.

## Git Workflow

- Preserve meaningful development history; do not squash before submission.
- Use Conventional Commits with imperative subjects under 72 characters.
- Commit coherent stages rather than one final bulk commit.
- Separate real security/correctness fixes when doing so makes the recovery history clearer.
- Inspect the diff and verification results before committing.
- Do not rewrite history, force-push, or perform destructive Git operations without explicit approval.

## Communication

- Lead with the result or decision, then explain relevant evidence and trade-offs.
- Do not agree automatically; identify unsafe, contradictory, unnecessary, or lower-value choices.
- When blocked, state what is known, what is unknown, and the smallest decision needed.
- Keep plans and status updates concise, but make security and migration consequences explicit.
