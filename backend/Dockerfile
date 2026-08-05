# syntax=docker/dockerfile:1

FROM node:22.22.2-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

FROM dependencies AS build
COPY backend backend
RUN npm run build --workspace=backend

FROM build AS migration
CMD ["npm", "run", "prisma:migrate:deploy", "--workspace=backend"]

FROM node:22.22.2-alpine AS production-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --omit=dev --workspace=backend

FROM node:22.22.2-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3001
WORKDIR /app
COPY --from=production-dependencies --chown=node:node /app/node_modules node_modules
COPY --from=production-dependencies --chown=node:node /app/package.json package.json
COPY --from=production-dependencies --chown=node:node /app/backend/package.json backend/package.json
COPY --from=build --chown=node:node /app/backend/dist backend/dist
USER node
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3001/').then(response => process.exit(response.status === 401 ? 0 : 1)).catch(() => process.exit(1))"
CMD ["npm", "run", "start:prod", "--workspace=backend"]
