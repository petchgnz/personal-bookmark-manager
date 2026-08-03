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
