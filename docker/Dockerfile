# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
ARG VITE_STOCKINFO_API_URL=""
ENV VITE_STOCKINFO_API_URL=${VITE_STOCKINFO_API_URL}
RUN npm run build

FROM node:22-bookworm-slim AS api-build
WORKDIR /app
# Native SQLite- und Argon2-Module brauchen auf Plattformen ohne fertiges
# Binary einen Compiler. Die Toolchain bleibt außerhalb des Laufzeitbilds.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY api/package.json api/package-lock.json ./api/
RUN --mount=type=cache,target=/root/.npm npm ci --prefix api
COPY api/src ./api/src
COPY api/tsconfig.json ./api/tsconfig.json
COPY api/drizzle ./api/drizzle
RUN npm run build --prefix api && npm prune --omit=dev --prefix api

FROM node:22-bookworm-slim
WORKDIR /app/api
RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /data /app/public \
    && chown -R node:node /data /app/public
COPY --from=api-build --chown=node:node /app/api/package.json /app/api/package-lock.json ./
COPY --from=api-build --chown=node:node /app/api/node_modules ./node_modules
COPY --from=api-build --chown=node:node /app/api/dist ./dist
COPY --from=api-build --chown=node:node /app/api/drizzle ./drizzle
COPY --from=frontend-build --chown=node:node /app/dist /app/public
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
USER node

ENV STOCKINFO_API_URL="" \
    STOCKPORTFOLIO_DATA_DIR="/data" \
    STOCKPORTFOLIO_PUBLIC_DIR="/app/public" \
    STOCKPORTFOLIO_SECURE_COOKIES="false" \
    NODE_ENV="production" \
    TZ="UTC"
VOLUME ["/data"]
EXPOSE 8080

LABEL org.opencontainers.image.title="StockPortfolio" \
      org.opencontainers.image.description="Portfolio management with market data, valuation, charts and rebalancing" \
      org.opencontainers.image.source="https://github.com/MikeMitterer/stockportfolio" \
      org.opencontainers.image.licenses="EUPL-1.2" \
      net.unraid.docker.webui="http://[IP]:[PORT:8080]" \
      net.unraid.docker.icon="https://raw.githubusercontent.com/MikeMitterer/stockportfolio/master/frontend/public/stockportfolio-icon.png"

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:8080/healthz', {signal: AbortSignal.timeout(4000)}).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "dist/index.js"]
