# Base stage usando a plataforma do host (BUILDPLATFORM) para execução nativa sem emulação QEMU
FROM --platform=$BUILDPLATFORM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

# 1. Estágio de Dependências e Prisma (nativamente em $BUILDPLATFORM)
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/lib-db/package.json ./packages/lib-db/
COPY packages/env/package.json ./packages/env/
COPY packages/config/package.json ./packages/config/
COPY apps/service/package.json ./apps/service/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/lib-db/src/prisma ./packages/lib-db/src/prisma
WORKDIR /app/packages/lib-db
RUN pnpm exec prisma generate --schema=./src/prisma/schema.prisma

# 2. Estágio de Build (nativamente em $BUILDPLATFORM)
FROM --platform=$BUILDPLATFORM deps AS builder
WORKDIR /app

COPY packages/lib-db ./packages/lib-db
COPY packages/env ./packages/env
COPY packages/config ./packages/config
COPY apps/service ./apps/service

RUN cd /app/packages/lib-db && pnpm build && \
    cd /app/apps/service && pnpm build

# 3. Estágio de Dependências de Produção (nativamente em $BUILDPLATFORM)
FROM base AS prod-deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/lib-db/package.json ./packages/lib-db/
COPY packages/env/package.json ./packages/env/
COPY packages/config/package.json ./packages/config/
COPY apps/service/package.json ./apps/service/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --prod --frozen-lockfile

# 4. Estágio Final (Runner: imagem alvo linux/arm64 no CI)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copia dependências de produção preparadas no prod-deps (raiz e workspaces)
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/service/node_modules ./apps/service/node_modules
COPY --from=prod-deps /app/packages/lib-db/node_modules ./packages/lib-db/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copia lib-db compilado e Prisma Client gerado
COPY --from=builder /app/packages/lib-db/dist ./packages/lib-db/dist
COPY --from=builder /app/packages/lib-db/package.json ./packages/lib-db/package.json
COPY --from=builder /app/packages/lib-db/src/prisma/generated ./packages/lib-db/src/prisma/generated
COPY --from=builder /app/packages/lib-db/src/prisma/generated ./packages/lib-db/dist/prisma/generated

# Copia o build da API (dist)
COPY --from=builder --chown=nestjs:nodejs /app/apps/service/dist ./apps/service/dist
COPY --from=builder /app/apps/service/package.json ./apps/service/package.json

USER nestjs

EXPOSE 3333
ENV PORT=3333
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/service/dist/main.js"]
