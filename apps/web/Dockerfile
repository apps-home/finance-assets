# Base stage usando a plataforma do host (BUILDPLATFORM) para execução nativa sem emulação QEMU
FROM --platform=$BUILDPLATFORM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

# 1. Estágio de Dependências (nativamente em $BUILDPLATFORM)
FROM base AS deps
WORKDIR /app

# Copia arquivos de configuração da RAIZ e manifestos para cache das dependências
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/lib-db/package.json ./packages/lib-db/
COPY packages/env/package.json ./packages/env/
COPY packages/config/package.json ./packages/config/
COPY apps/web/package.json ./apps/web/
COPY apps/service/package.json ./apps/service/

RUN pnpm install --frozen-lockfile

# Copia schema do Prisma e gera o Prisma Client (CRITICO: Sem isso o build falha)
COPY packages/lib-db/src/prisma ./packages/lib-db/src/prisma
WORKDIR /app/packages/lib-db
RUN pnpm exec prisma generate --schema=./src/prisma/schema.prisma
WORKDIR /app

# 2. Estágio de Build (nativamente em $BUILDPLATFORM)
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

# Copia node_modules e artefatos do Prisma do estágio deps
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/lib-db/src/prisma/generated ./packages/lib-db/src/prisma/generated
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copia código-fonte dos pacotes e da aplicação web
COPY packages/lib-db ./packages/lib-db
COPY packages/env ./packages/env
COPY packages/config ./packages/config
COPY apps/web ./apps/web

# Recebe os argumentos do GitHub Actions
ARG NEXT_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_AVATAR_URL

# Transforma em ENV para o processo de build do Next.js ler
ENV NEXT_PUBLIC_SERVER_URL=$NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_AVATAR_URL=$NEXT_PUBLIC_AVATAR_URL

ENV NEXT_TELEMETRY_DISABLED=1
# Skip server env validation during build (validated at runtime)
ENV SKIP_ENV_VALIDATION=true

RUN cd /app/apps/web && pnpm build

# 3. Estágio Final (Runner: imagem alvo linux/arm64 no CI)
FROM node:22-alpine AS runner
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
