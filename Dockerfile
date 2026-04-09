FROM node:22-bookworm-slim AS base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder

WORKDIR /app
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/koru_crm?schema=public
ENV CHAT_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/koru_chat?schema=public
ENV JWT_SECRET=build-only-secret-key-123456
ENV NEXT_PUBLIC_APP_NAME=Koru
ENV PORT=3000
ENV NODE_ENV=production

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime-base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app /app

FROM runtime-base AS frontend

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start:frontend"]

FROM runtime-base AS backend

ENV PORT=4000
EXPOSE 4000

CMD ["sh", "docker/backend/start.sh"]
