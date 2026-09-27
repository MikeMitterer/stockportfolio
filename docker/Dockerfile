# syntax=docker/dockerfile:1
# ─── Stage 1: Bündel bauen ────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
# Cache-Mount für den npm-Download-Cache — bleibt über Builds erhalten, auch
# wenn dieser Layer wegen eines geänderten Lockfiles neu gebaut werden muss.
RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

# Die Adresse zur Bauzeit ist nur die Rückfallebene. Im Betrieb überschreibt
# der Entrypoint sie über config.js — sonst wäre das Abbild an ein Backend
# genagelt und jede Umgebung bräuchte einen eigenen Build.
ARG VITE_STOCKINFO_API_URL=""
ENV VITE_STOCKINFO_API_URL=${VITE_STOCKINFO_API_URL}

# `npm run build` beinhaltet den Typecheck — ein Abbild soll nicht entstehen,
# wenn die Typen nicht stimmen.
RUN npm run build

# ─── Stage 2: Statische Dateien ohne eigenes API-Backend ausliefern ────────────
FROM node:22-bookworm-slim

WORKDIR /app/server
COPY docker/runtime/package.json docker/runtime/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --ignore-scripts \
    && apt-get update \
    && apt-get install -y --no-install-recommends tzdata \
    && rm -rf /var/lib/apt/lists/*

COPY docker/runtime/serve.json /app/server/serve.json
COPY --from=build --chown=node:node /app/dist /app/public

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
USER node

# Für das Unraid-Template: Die Adresse der API ist die einzige Einstellung,
# die beim Start gesetzt werden muss.
ENV STOCKINFO_API_URL="" \
    NODE_ENV="production" \
    NO_UPDATE_CHECK="1" \
    TZ="UTC"

EXPOSE 8080

# Damit Unraid im Docker-Reiter „WebUI" anbietet und ein Symbol zeigt.
# `[PORT:8080]` ersetzt Unraid durch den gemappten Host-Port.
LABEL org.opencontainers.image.title="StockPortfolio" \
      org.opencontainers.image.description="Portfolio management with market data, valuation, charts and rebalancing" \
      org.opencontainers.image.source="https://github.com/MikeMitterer/stockportfolio" \
      org.opencontainers.image.licenses="LicenseRef-StockPortfolio-1.0" \
      net.unraid.docker.webui="http://[IP]:[PORT:8080]" \
      net.unraid.docker.icon="https://raw.githubusercontent.com/MikeMitterer/stockportfolio/master/public/stockportfolio-icon.png"

# Der Healthcheck färbt unter Unraid den Zustand im Docker-Reiter. Geprüft wird
# die index.html — einen eigenen /healthz gäbe es ohne Konfiguration nicht.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:8080/', {signal: AbortSignal.timeout(4000)}).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "/app/server/node_modules/serve/build/main.js", "/app/public", "--listen", "tcp://0.0.0.0:8080", "--config", "/app/server/serve.json", "--no-clipboard", "--no-port-switching"]
