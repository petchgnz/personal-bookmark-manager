# Codex Session 1 Log

## Metadata

- Date: 2026-08-04
- Session: 1 - Requirements, decisions, and delivery plan
- Agent: Rex
- Starting commit: unavailable; repository had no commits
- Ending commit: pending first repository commit
- Tools: Codex conversation, assignment text extraction and rendering, web documentation lookup, shell inspection, apply_patch
- Redactions: Auth0 test-user password and confidential source-document reproduction are intentionally omitted

## 1. Goal / Task

Read the confidential Bangkok Bank Full-Stack Developer assignment, explain the Personal Bookmark Manager requirements, resolve the important ambiguities with the user, define the architecture and security strategy, and produce a complete project/session plan suitable for continued work with Codex CLI.

## 2. Prompts and Material Actions

The user prompts progressed in this order:

1. Asked Rex to read the assignment under `documents/` and summarize the project.
2. Asked for requirements not covered by the first summary and a list of decisions that needed user input.
3. Selected Core-first delivery, npm, PostgreSQL through Docker Compose, Access Tokens, first-login provisioning, `SET NULL` collection deletion, deferred sharing, `404` privacy semantics, API response/error/update/filter/pagination rules, TanStack Query, layered testing, agent capabilities, CI, and transcript policy; requested clarification on repository layout, identity mapping, errors, PATCH null semantics, and authentication testing.
4. Confirmed npm-workspaces monorepo and internal database users mapped from unique `(issuer, subject)` with internal `User.id` as `ownerId`.
5. Asked for the full project plan and session plan.
6. Asked for local `ASSIGNMENT.md` and tracked `AGENTS.md` project instructions.
7. Asked for confidential/local material to be excluded with `.gitignore`.

Material agent actions:

- Inspected the repository and found the confidential eight-page assignment.
- Extracted the complete assignment text and visually reviewed rendered pages to preserve tables and layout-dependent requirements.
- Identified that only 10/100 rubric points concern the running application; the remaining points emphasize agent setup, API/data engineering, verification, ambiguity resolution, and process evidence.
- Compared design options and recorded the user's decisions.
- Consulted current official npm, Auth0, NestJS, OpenID Connect, and TanStack Query documentation where decisions depended on current behavior.
- Produced a 10-session core plan and three gated bonus sessions.
- Created local `ASSIGNMENT.md`, tracked `AGENTS.md`, and `.gitignore` rules for confidential/local files.

## 3. Code / Logic Created or Changed

No application feature code was created in Session 1. The session established these project rules:

- npm-workspaces monorepo with independent backend/frontend dependency declarations.
- TypeScript-only NestJS backend and React/Vite frontend.
- PostgreSQL through Docker Compose and Prisma for persistence.
- Authorization Code Flow with PKCE S256.
- Backend accepts only Access Tokens for the API audience and rejects ID Tokens.
- Verified `(issuer, subject)` maps to an internal persisted user; internal `User.id` is the resource `ownerId`.
- Every resource operation is owner-scoped; another user's resource is indistinguishable from a missing resource and returns `404`.
- Deleting a collection preserves bookmarks by setting `collectionId` to `NULL`.
- PUT fully replaces editable fields; PATCH omission means unchanged and explicit null clears nullable fields.
- Offset pagination, safe error envelopes, strict validation, and cross-owner privacy tests are required.
- MUI is the required component system; Tailwind CSS is limited to utility layout/styling.
- Core work precedes bonuses. Bonus order is `/all`, application Dockerfiles, then full-text search. CI is core.
- Session transcripts must preserve prompts, material commands, code changes, errors, verification, and outcomes honestly.

Files created during the planning handoff:

- `AGENTS.md`
- `.gitignore`
- Local-only ignored `ASSIGNMENT.md`

## 4. Errors and Debugging Steps

- Initial sandboxed PowerShell processes intermittently failed with Windows access-denied errors. Commands were rerun with narrowly scoped approved execution.
- Assignment text extraction stopped at page 6 because the default Windows output encoding could not represent a Unicode character. The remaining pages were extracted with Python UTF-8 mode.
- The initially assumed Poppler binary path was incorrect. The bundled runtime was inspected, the real executable path was found, and all pages were rendered successfully.
- The public-repository requirement conflicted with the source assignment's CONFIDENTIAL marking. The source assignment, rendered pages, temporary artifacts, and detailed local `ASSIGNMENT.md` were excluded from Git. `AGENTS.md` remains tracked because it is a graded agent-rules deliverable.
- The user requested Tailwind CSS while the assignment requires MUI. The resolution was to retain MUI as the component system and use Tailwind only for focused layout, spacing, and responsive utilities.

## 5. Final Output

- The product, security invariant, required stack, API behavior, frontend scope, verification strategy, ambiguity decisions, agent workflow, and submission artifacts were fully summarized.
- All pre-design decisions were resolved.
- A complete Session 1-13 delivery plan was produced, with a core quality gate before bonus work.
- Local confidential planning context is available to Codex CLI without being included in the public repository.
- Repository-facing agent instructions are self-contained and require lint, TypeScript typecheck, tests, builds, privacy verification, and honest transcripts before handoff.

## Known Limitations at Session Close

- No application scaffold or domain implementation was part of this planning session.
- Auth0 discovery, JWKS, and actual token claims still require live inspection during the authentication session.
- Exact validation length limits and filter parameter names remain to be finalized in `API_DESIGN.md` during implementation.
