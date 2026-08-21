# Build stage
FROM node:22-alpine AS base

# 1. Estágio de Dependências
FROM base AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

# Copia arquivos de configuração da RAIZ
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copia todos os pacotes do workspace (necessários para o build)
COPY packages/lib-db ./packages/lib-db
COPY packages/env ./packages/env
COPY packages/config ./packages/config

# Copia a aplicação web
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile

# Gera o Prisma Client (CRITICO: Sem isso o build falha)
WORKDIR /app/packages/lib-db
RUN pnpm exec prisma generate --schema=./src/prisma/schema.prisma

# 2. Estágio de Build
FROM base AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Recebe os argumentos do GitHub Actions
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_AVATAR_URL

# Transforma em ENV para o processo de build do Next.js ler
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_AVATAR_URL=$NEXT_PUBLIC_AVATAR_URL

# Build do Next.js
WORKDIR /app/apps/web

ENV NEXT_TELEMETRY_DISABLED=1
# Skip server env validation during build (validated at runtime)
ENV SKIP_ENV_VALIDATION=true

RUN pnpm build

# 3. Estágio Final (Runner)
FROM base AS runner
WORKDIR /app

# Production stage
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia apenas o necessário para rodar (Standalone mode inclui node_modules rastreados)
# COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]

