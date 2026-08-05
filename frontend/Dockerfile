# syntax=docker/dockerfile:1

FROM node:22.22.0-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

FROM dependencies AS build
COPY frontend frontend
RUN npm run build --workspace=frontend

FROM nginx:1.29.8-alpine AS runtime
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/docker/default.conf /etc/nginx/conf.d/default.conf
COPY frontend/docker/runtime-config.template.js /opt/runtime-config.template.js
COPY frontend/docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/40-runtime-config.sh
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1
