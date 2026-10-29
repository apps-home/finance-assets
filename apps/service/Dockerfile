# Base stage usando a plataforma do host (BUILDPLATFORM) para execução nativa sem emulação QEMU
FROM --platform=$BUILDPLATFORM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

# 1. Estágio de Dependências e Prisma (nativamente em $BUILDPLATFORM)
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/lib-finance-assets-db/package.json ./packages/lib-finance-assets-db/
COPY packages/lib-auth/package.json ./packages/lib-auth/
COPY packages/env/package.json ./packages/env/
COPY packages/config/package.json ./packages/config/
COPY apps/service/package.json ./apps/service/

RUN pnpm install --frozen-lockfile

COPY packages/lib-finance-assets-db/src/prisma ./packages/lib-finance-assets-db/src/prisma
WORKDIR /app/packages/lib-finance-assets-db
RUN pnpm exec prisma generate --schema=./src/prisma/schema.prisma

# 2. Estágio de Build (nativamente em $BUILDPLATFORM)
FROM --platform=$BUILDPLATFORM deps AS builder
WORKDIR /app

COPY packages/lib-finance-assets-db ./packages/lib-finance-assets-db
COPY packages/lib-auth ./packages/lib-auth
COPY packages/env ./packages/env
COPY packages/config ./packages/config
COPY apps/service ./apps/service

RUN cd /app/packages/lib-finance-assets-db && pnpm build && \
    cd /app/packages/lib-auth && pnpm build && \
    cd /app/apps/service && pnpm build

# 3. Estágio de Dependências de Produção (nativamente em $BUILDPLATFORM)
FROM base AS prod-deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/lib-finance-assets-db/package.json ./packages/lib-finance-assets-db/
COPY packages/lib-auth/package.json ./packages/lib-auth/
COPY packages/env/package.json ./packages/env/
COPY packages/config/package.json ./packages/config/
COPY apps/service/package.json ./apps/service/

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
COPY --from=prod-deps /app/packages/lib-finance-assets-db/node_modules ./packages/lib-finance-assets-db/node_modules
COPY --from=prod-deps /app/packages/lib-auth/node_modules ./packages/lib-auth/node_modules
COPY package.json pnpm-workspace.yaml ./

# Copia lib-auth compilado
COPY --from=builder /app/packages/lib-auth/dist ./packages/lib-auth/dist
COPY --from=builder /app/packages/lib-auth/package.json ./packages/lib-auth/package.json

# Copia lib-finance-assets-db compilado e Prisma Client gerado
COPY --from=builder /app/packages/lib-finance-assets-db/dist ./packages/lib-finance-assets-db/dist
COPY --from=builder /app/packages/lib-finance-assets-db/package.json ./packages/lib-finance-assets-db/package.json
COPY --from=builder /app/packages/lib-finance-assets-db/src/prisma/generated ./packages/lib-finance-assets-db/src/prisma/generated
COPY --from=builder /app/packages/lib-finance-assets-db/src/prisma/generated ./packages/lib-finance-assets-db/dist/prisma/generated

# Copia o build da API (dist)
COPY --from=builder --chown=nestjs:nodejs /app/apps/service/dist ./apps/service/dist
COPY --from=builder /app/apps/service/package.json ./apps/service/package.json

USER nestjs

EXPOSE 3333
ENV PORT=3333
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/service/dist/src/main.js"]
