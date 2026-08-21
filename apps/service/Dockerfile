# Build stage
FROM node:22-alpine AS base

# 1. Estágio de Dependências
FROM base AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

# Copia arquivos de configuração da RAIZ
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copia o pacote de banco de dados (Necessário para o build)
COPY packages/lib-db ./packages/lib-db

# Copia a aplicação web
COPY apps/service ./apps/service

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

# Build do lib-db (o NestJS depende do dist compilado)
WORKDIR /app/packages/lib-db
RUN pnpm build

# Build do NestJS
WORKDIR /app/apps/service
RUN pnpm build

# 3. Estágio Final (Runner)
FROM base AS runner
WORKDIR /app

# Production stage
ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

RUN corepack enable && corepack prepare pnpm@11.0.9 --activate

# Copia arquivos base para instalar dependências de produção
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/lib-db ./packages/lib-db
COPY apps/service/package.json ./apps/service/package.json

RUN pnpm install --prod --frozen-lockfile

# Copia o Prisma Client gerado no estágio de dependências
COPY --from=deps /app/packages/lib-db/src/prisma/generated /app/packages/lib-db/src/prisma/generated
# Copia o lib-db compilado (dist) do estágio de build
COPY --from=builder /app/packages/lib-db/dist /app/packages/lib-db/dist

WORKDIR /app

# Copia o build do NestJS (pasta dist)
COPY --from=builder --chown=nestjs:nodejs /app/apps/service/dist ./apps/service/dist

USER nestjs

EXPOSE 3333
ENV PORT=3333
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/service/dist/main.js"]
