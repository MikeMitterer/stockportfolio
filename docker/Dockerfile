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

# ─── Stage 2: Ausliefern ──────────────────────────────────────────────────────
#
# Der Drop-in regelt nur das Caching, kein Routing: Dank Hash-Modus sieht der
# Server ohnehin nur "/". Warum er trotzdem nötig ist, steht in der Datei.
FROM nginx:1.27-bookworm

COPY docker/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Für das Unraid-Template: Die Adresse der API ist die einzige Einstellung,
# die beim Start gesetzt werden muss.
ENV STOCKINFO_API_URL=""

EXPOSE 80

# Damit Unraid im Docker-Reiter „WebUI" anbietet und ein Symbol zeigt.
# `[PORT:80]` ersetzt Unraid durch den gemappten Host-Port.
LABEL org.opencontainers.image.title="StockPortfolio" \
      org.opencontainers.image.description="Rebalancing-Oberfläche für die StockInfo-API" \
      org.opencontainers.image.source="https://github.com/MikeMitterer/StockPortfolio" \
      net.unraid.docker.webui="http://[IP]:[PORT:80]" \
      net.unraid.docker.icon="https://raw.githubusercontent.com/MikeMitterer/StockPortfolio/main/public/favicon.svg"

# Der Healthcheck färbt unter Unraid den Zustand im Docker-Reiter. Geprüft wird
# die index.html — einen eigenen /healthz gäbe es ohne Konfiguration nicht.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -fsS http://localhost/ >/dev/null || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
