FROM node:22.14-bookworm-slim AS deps

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./

RUN npm ci


FROM deps AS dev

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        xvfb \
        libgtk-3-0 \
        libgbm1 \
        libnss3 \
        libxss1 \
        libasound2 \
        libatk-bridge2.0-0 \
        libx11-xcb1 \
        libdrm2 \
    && rm -rf /var/lib/apt/lists/*

CMD ["sh", "-c", "cd /app/frontend && npm run dev -- --hostname 0.0.0.0 --port 3000"]


FROM node:22.14-bookworm-slim AS builder

WORKDIR /app

COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY frontend ./frontend

ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/frontend

RUN npm run build


FROM node:22.14-bookworm-slim AS prod

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public ./frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./frontend/.next/static

USER nextjs

ENV PORT=8080

CMD ["node", "frontend/server.js"]