# Personal Bookmark Manager

Private bookmark manager assignment using an npm workspaces monorepo.

## Repository Layout

```text
backend/       NestJS, TypeScript, Prisma, PostgreSQL API
frontend/      React, Vite, TypeScript web app
.agent/        Reusable agent workflows
transcripts/   Session logs and verification evidence
```

## Status

The npm-workspaces monorepo and generated NestJS/React application baselines are scaffolded. Dependencies and baseline lint, typecheck, test, and production-build commands are configured. The assignment domain model, Prisma schema and migrations, Auth0 integration, privacy controls, and product UI are not implemented yet.

## Confidentiality

Do not commit the confidential source assignment PDF, rendered PDF pages, local environment files, Auth0 credentials, tokens, cookies, database dumps, or temporary artifacts.

## Planned Stack

- npm workspaces
- Backend: Node.js, TypeScript, NestJS, Prisma, PostgreSQL
- Frontend: React, Vite, TypeScript, React Router, MUI, Tailwind CSS utilities, Auth0 React SDK, TanStack Query
- Local database: PostgreSQL through Docker Compose
