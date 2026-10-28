# Preparação para Múltiplos Sistemas: `@lib/db`, `@lib/auth` e Infra Compartilhada

> Guia das mudanças no **Finance Assets** para que um segundo sistema (o primeiro é o Car Expenses, descrito em `CAR_EXPENSES_CONCEPT.md`) possa começar reaproveitando banco, autenticação e design system, sem afetar o que já está em produção.

---

## 1. Objetivo e Escopo

Hoje os submódulos atendem um único sistema. O objetivo é deixá-los prontos para N sistemas, cada um com **seus próprios usuários e banco**, mas com **uma única implementação** de conexão, autenticação e UI.

| Entra neste guia | Fica para o projeto do novo sistema |
|---|---|
| `@lib/db` com um schema Prisma por sistema | O schema `car-expenses` e suas migrations |
| Novo submódulo `@lib/auth` (Better Auth no Next e guard no NestJS) | O app Next e o serviço NestJS do Car Expenses |
| Finance Assets consumindo `@lib/auth` no lugar do código próprio | Telas e regras de negócio do Car Expenses |
| Isolamento de Redis/BullMQ, Novu, R2 e cookies entre sistemas | Criar o banco `car_expenses_db` (só um `CREATE DATABASE`) |
| Atualização dos `AGENTS.md` | |

**Critério de pronto:**
- O Finance Assets funciona e faz deploy exatamente como antes: mesmos dados, sessões ativas continuam válidas e nenhuma migration nova é aplicada.
- Para começar o novo sistema, basta adicionar os submódulos `lib-db`, `lib-auth` e `lib-ui`, criar o schema dele e chamar as fábricas do `@lib/auth`.

**Ordem recomendada:** etapa 1 (`@lib/db`) → etapa 2 (`@lib/auth`) → etapa 3 (infra) → etapa 4 (documentação). As etapas 1 e 2 são independentes: cada uma pode ir para produção sozinha.

---

## 2. Como Está Hoje

| Peça | Onde | Problema para um segundo sistema |
|---|---|---|
| Um único `schema.prisma` (`better-auth` + `finance-assets`) | `packages/lib-db/src/prisma/schema.prisma` | Tabelas e migrations de sistemas diferentes se misturariam |
| `prisma.config.ts` lendo `DATABASE_URL` | `packages/lib-db/prisma.config.ts` | Rodar o `migrate` de outro sistema com o `.env` atual **aplicaria as tabelas dele no `personal_db`** |
| `index.ts` exportando `prisma`, `prismaFinanceAssets`, `prismaAuth` e todo o client gerado | `packages/lib-db/src/index.ts` | Dois clients gerados exportam os mesmos nomes (`PrismaClient`, `User`…) e não cabem na mesma raiz |
| Singleton em `globalThis.prisma` | `packages/lib-db/src/index.ts` | Chave única, sem distinguir clients |
| `prisma generate --schema=./src/prisma/schema.prisma` | `apps/web/Dockerfile`, `apps/service/Dockerfile` | Caminho fixo, quebra se o schema mudar de lugar |
| `betterAuth({...})` com origens, n8n e plugins | `apps/web/src/shared/lib/auth.ts` | Cada sistema copiaria e manteria a própria cópia |
| `createAuthClient` + reexports | `apps/web/src/shared/lib/auth-client.ts` | Idem |
| `getCurrentSession`/`getCurrentUser` | `apps/web/src/shared/lib/current-user.ts` | Idem |
| `SessionAuthGuard`, `@CurrentUserId()`, `AuthModule` | `apps/service/src/infra/auth/` | Idem, no NestJS |
| BullMQ sem `prefix` | `apps/service/src/infra/queue/queue.module.ts` | Num Redis compartilhado, as filas dos sistemas dividiriam o namespace `bull:` |

Consumidores do `@lib/db` hoje: **25 arquivos** em `apps/service` e `apps/web`, todos importando da raiz (`from '@lib/db'`).

---

## 3. Etapa 1: `@lib/db` com um Schema por Sistema

### 3.1 Estrutura alvo

```text
packages/lib-db/
├── prisma.finance-assets.config.ts      # schema + migrations do Finance, lê FINANCE_ASSETS_DATABASE_URL
├── src/
│   ├── client/
│   │   └── index.ts                     # createDriver(connectionString) – Pool pg + PrismaPg
│   ├── prisma/
│   │   └── finance-assets/
│   │       ├── schema.prisma            # (movido de src/prisma/schema.prisma)
│   │       ├── migrations/              # (movido de src/prisma/migrations)
│   │       └── generated/               # output do generate
│   ├── finance-assets.ts                # prismaFinanceAssets, prismaAuth, tipos e reexport do client gerado
│   └── index.ts                         # alias temporário: export * from './finance-assets'
└── package.json
```

O Car Expenses depois só **adiciona** `prisma.car-expenses.config.ts`, `src/prisma/car-expenses/` e `src/car-expenses.ts`. Nada do Finance é tocado.

### 3.2 Mover schema e migrations

```bash
cd packages/lib-db
git mv src/prisma/schema.prisma   src/prisma/finance-assets/schema.prisma
git mv src/prisma/migrations      src/prisma/finance-assets/migrations
rm -rf src/prisma/generated       # será gerado no novo lugar
```

O `output = "./generated/prisma"` do `generator client` é relativo ao schema, então continua igual e passa a gerar em `src/prisma/finance-assets/generated/prisma`.

**As migrations não são reaplicadas.** O Prisma identifica cada migration pelo **nome da pasta** (gravado em `_prisma_migrations`), não pelo caminho. Depois de mover, confirme nos dois ambientes:

```bash
pnpm --filter @lib/db migrate:finance-assets:status   # deve listar as 16 como aplicadas, nenhuma pendente
```

### 3.3 Um config do Prisma por sistema (com variável própria)

`prisma.finance-assets.config.ts`:

```ts
import 'dotenv/config'

import { defineConfig } from 'prisma/config'

export default defineConfig({
	schema: 'src/prisma/finance-assets/schema.prisma',
	migrations: {
		path: 'src/prisma/finance-assets/migrations'
	},
	datasource: {
		url: process.env.FINANCE_ASSETS_DATABASE_URL
	}
})
```

- Remova o `prisma.config.ts` atual. Sem um config padrão, rodar o CLI sem `--config` falha em vez de usar o banco errado.
- No `packages/lib-db/.env`, renomeie `DATABASE_URL` para `FINANCE_ASSETS_DATABASE_URL`. O Car Expenses terá `CAR_EXPENSES_DATABASE_URL` no mesmo arquivo.
- **Em runtime nada muda:** os apps continuam lendo `DATABASE_URL`, porque cada app roda no próprio processo com o próprio banco. A variável por sistema existe só para o CLI do lib-db, que enxerga todos os schemas.

### 3.4 Scripts e `exports` do `package.json`

```jsonc
{
	"exports": {
		".": "./dist/index.js",                          // alias do finance-assets (temporário)
		"./finance-assets": "./dist/finance-assets.js"
	},
	"scripts": {
		"build": "pnpm generate && tsc",
		"generate": "prisma generate --config=prisma.finance-assets.config.ts",
		"migrate:finance-assets": "prisma migrate dev --config=prisma.finance-assets.config.ts",
		"migrate:finance-assets:deploy": "prisma migrate deploy --config=prisma.finance-assets.config.ts",
		"migrate:finance-assets:status": "prisma migrate status --config=prisma.finance-assets.config.ts",
		"studio:finance-assets": "prisma studio --config=prisma.finance-assets.config.ts"
	},
	"files": ["dist", "src/prisma/*/schema.prisma", "src/prisma/*/generated"]
}
```

- O subpath funciona sem `typesVersions` porque os dois apps usam `moduleResolution: "bundler"`, que lê o `exports`. Um consumidor futuro com `"node"` (node10) precisaria dele.
- Quando o Car Expenses entrar, o `generate` passa a rodar os dois configs (`prisma generate --config=... && prisma generate --config=...`).
- O `migrate dev` de schema único (`pnpm --filter @lib/db migrate`) some. Atualize quem o usa: `AGENTS.md` e hábitos do dia a dia.

### 3.5 Client por sistema

`src/client/index.ts` passa a criar o driver a partir de uma URL, sem cache global único:

```ts
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

export function createDriver(connectionString = process.env.DATABASE_URL) {
	return new PrismaPg(new Pool({ connectionString }))
}
```

`src/finance-assets.ts` concentra o que hoje está em `index.ts`, com a chave do `globalThis` própria do sistema:

```ts
import { createDriver } from './client'
import { PrismaClient } from './prisma/finance-assets/generated/prisma/client'

export * from './prisma/finance-assets/generated/prisma/client'

const globalForPrisma = globalThis as unknown as {
	prismaFinanceAssetsClient?: PrismaClient
}

// ...getPrismaClient(), prisma, basePrisma, prismaFinanceAssets e prismaAuth
// exatamente como hoje, trocando globalForPrisma.prisma por
// globalForPrisma.prismaFinanceAssetsClient e getDriver() por createDriver()
```

`src/index.ts`:

```ts
// Alias temporário: o Finance Assets ainda importa de '@lib/db'
export * from './finance-assets'
```

### 3.6 Imports nos apps

Troque os 25 imports de `'@lib/db'` por `'@lib/db/finance-assets'`. Encontre com:

```bash
grep -rln "from '@lib/db'" apps/*/src apps/*/test
```

Com o alias da raiz, isso pode ser feito depois, num commit separado. Quando não sobrar nenhum, remova o alias (`src/index.ts` e a entrada `"."`), para o Car Expenses nunca importar o client do Finance por engano.

### 3.7 Dockerfiles

Nos dois Dockerfiles (`apps/web/Dockerfile` e `apps/service/Dockerfile`):

| Hoje | Depois |
|---|---|
| `COPY packages/lib-db/src/prisma ./packages/lib-db/src/prisma` | idem, mais `COPY packages/lib-db/prisma.*.config.ts ./packages/lib-db/` |
| `RUN pnpm exec prisma generate --schema=./src/prisma/schema.prisma` | `RUN pnpm exec prisma generate --config=prisma.finance-assets.config.ts` |
| `.../lib-db/src/prisma/generated` (nos `COPY --from=...`) | `.../lib-db/src/prisma/finance-assets/generated` |

O `generate` não conecta no banco, mas o config lê `FINANCE_ASSETS_DATABASE_URL`. Se o Prisma reclamar da variável vazia no build, passe `FINANCE_ASSETS_DATABASE_URL=postgresql://build:build@localhost/build` só no `RUN` do generate.

Hoje nenhum workflow ou Dockerfile roda `migrate deploy`: as migrations de produção são aplicadas à mão. Daqui em diante, use `migrate:finance-assets:deploy` com `FINANCE_ASSETS_DATABASE_URL` apontando para o banco de produção.

### 3.8 Verificação da etapa 1

1. `pnpm --filter @lib/db build` gera em `src/prisma/finance-assets/generated` e compila `dist/finance-assets.js`.
2. `pnpm --filter @lib/db migrate:finance-assets:status` mostra tudo aplicado, em DEV e em PROD.
3. `pnpm --filter api test`, `pnpm --filter api test:e2e` e `pnpm --filter web build` passam.
4. `docker build` dos dois apps passa localmente antes do push para `main`.
5. Commit no submódulo `lib-db`, depois commit do novo ponteiro no Finance Assets.

---

## 4. Etapa 2: Submódulo `@lib/auth`

### 4.1 Decisões

| Decisão | Motivo |
|---|---|
| **Cada sistema tem os próprios usuários**: o `@lib/auth` só tem código, nunca uma conexão própria | Um banco por sistema (`personal_db`, `car_expenses_db`), cada um com seu schema `better-auth` |
| O lib **não depende do `@lib/db`** e **não lê `process.env`** | Cada app passa o próprio client Prisma e as próprias variáveis. O lib funciona com qualquer schema |
| `better-auth` é **dependência do lib** (versão fixada), e os apps não importam mais `better-auth` diretamente | Uma única versão para todos os sistemas, como no `@lib/ui` (sem `catalog:`, porque o submódulo é usado em outros repositórios) |
| Build com `tsc` para `dist/` em **ESM** (`"type": "module"`, `module: "NodeNext"`), diferente do `@lib/db` (CommonJS) | O `better-auth` só publica ESM, e o `apps/service` também é ESM (`"type": "module"`, SWC com `es6`). O NestJS não transpila TypeScript de dentro de `node_modules`, por isso o `dist`. O Next consome o `dist` sem `transpilePackages` |
| Entradas separadas por ambiente (`/server`, `/next`, `/client`, `/nest`) | O serviço NestJS não pode carregar `next/headers`, e o browser não pode carregar código de servidor |
| Os models Prisma do Better Auth **continuam no schema de cada sistema** | O `User` precisa das relações inversas do domínio (`assetCategories`, `vehicles`…), e o Prisma não importa models de outro arquivo fora da pasta do schema. O lib traz o modelo de referência para copiar |

### 4.2 Estrutura

```text
packages/lib-auth/                       # submódulo git: github.com/apps-home/lib-auth
├── AGENTS.md
├── README.md
├── package.json
├── tsconfig.json
├── prisma/
│   └── better-auth.prisma               # modelo de referência: User, Session, Account, Verification
└── src/
    ├── server/index.ts                  # createAuth(options) → instância do betterAuth
    ├── next/index.ts                    # createAuthRouteHandler, createSessionHelpers (server-only)
    ├── client/index.ts                  # createAppAuthClient(options)
    └── nest/
        ├── index.ts
        ├── session-store.ts             # interface SessionStore + token de DI
        ├── session-auth.guard.ts        # SessionAuthGuard (Bearer token → userId)
        ├── current-user-id.decorator.ts # @CurrentUserId()
        └── auth.module.ts               # AuthModule.forRoot({ sessionStore })
```

`package.json` (essencial):

```jsonc
{
	"name": "@lib/auth",
	"type": "module",
	"exports": {
		"./server": "./dist/server/index.js",
		"./next": "./dist/next/index.js",
		"./client": "./dist/client/index.js",
		"./nest": "./dist/nest/index.js",
		"./prisma/better-auth.prisma": "./prisma/better-auth.prisma"
	},
	"scripts": { "build": "tsc", "dev": "tsc --watch", "typecheck": "tsc --noEmit" },
	"dependencies": { "better-auth": "1.7.2" },
	"peerDependencies": {
		"@nestjs/common": ">=11",
		"@nestjs/core": ">=11",
		"next": ">=16",
		"react": ">=19"
	},
	"peerDependenciesMeta": {
		"@nestjs/common": { "optional": true },
		"@nestjs/core": { "optional": true },
		"next": { "optional": true },
		"react": { "optional": true }
	}
}
```

Os peers são opcionais porque cada app usa só a sua parte: o serviço não tem `next`, o web não tem `@nestjs/*`.

### 4.3 `@lib/auth/server`: `createAuth`

Recebe tudo o que hoje está fixo em `apps/web/src/shared/lib/auth.ts`:

```ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'

export interface CreateAuthOptions {
	/** Nome do sistema, usado como prefixo dos cookies (ex.: 'finance-assets') */
	appName: string
	secret: string
	baseURL: string
	trustedOrigins?: string[]
	/** Client Prisma do sistema (precisa ter os models de prisma/better-auth.prisma) */
	prisma: unknown
	/** Envio do e-mail de redefinição de senha (n8n, Resend…) */
	sendResetPassword?: (data: {
		user: { email: string; name: string }
		url: string
		token: string
	}) => Promise<void>
	/** Provedores OAuth opcionais (ex.: { google: { clientId, clientSecret } }) */
	socialProviders?: Parameters<typeof betterAuth>[0]['socialProviders']
}

export function createAuth(options: CreateAuthOptions) {
	return betterAuth({
		appName: options.appName,
		secret: options.secret,
		baseURL: options.baseURL,
		trustedOrigins: options.trustedOrigins,
		database: prismaAdapter(options.prisma as never, { provider: 'postgresql' }),
		emailAndPassword: {
			enabled: true,
			autoSignIn: true,
			sendResetPassword: options.sendResetPassword
		},
		socialProviders: options.socialProviders,
		advanced: {
			// Sistemas no mesmo domínio (ou no mesmo host com basePath) não sobrescrevem a sessão um do outro
			cookiePrefix: options.appName
		},
		plugins: [nextCookies()]
	})
}

export type AppAuth = ReturnType<typeof createAuth>
```

**Cookie prefix e sessões ativas:** hoje o cookie é `better-auth.session_token`. Ao migrar o Finance Assets, use `appName: 'better-auth'` na primeira versão, para manter o mesmo nome de cookie e não deslogar ninguém. Troque para `'finance-assets'` quando for conveniente (todos precisam logar de novo uma vez). O Car Expenses já nasce com `'car-expenses'`.

Revise também o `disabledPaths` atual (`/sign-up`, `/sign-in`, `/forgot-password`, `/reset-password`). Os endpoints reais do Better Auth são `/sign-up/email`, `/sign-in/email` etc., então essa lista hoje não desativa nada. Decida se ela sai ou se vira uma opção do `createAuth`.

### 4.4 `@lib/auth/next` e `@lib/auth/client`

```ts
// next/index.ts
import 'server-only'

import { toNextJsHandler } from 'better-auth/next-js'
import { headers } from 'next/headers'

import type { AppAuth } from '../server'

export function createAuthRouteHandler(auth: AppAuth) {
	return toNextJsHandler(auth)
}

export function createSessionHelpers(auth: AppAuth) {
	async function getCurrentSession() {
		return auth.api.getSession({ headers: await headers() })
	}

	async function getCurrentUser() {
		return (await getCurrentSession())?.user
	}

	return { getCurrentSession, getCurrentUser }
}
```

```ts
// client/index.ts
import { createAuthClient } from 'better-auth/react'

export function createAppAuthClient(options: { fallbackBaseURL: string }) {
	return createAuthClient({
		baseURL:
			typeof window !== 'undefined'
				? window.location.origin
				: options.fallbackBaseURL
	})
}
```

### 4.5 `@lib/auth/nest`: guard sem depender do Prisma

O guard atual lê `prismaAuth.session` direto. No lib ele depende só de uma interface, e cada serviço fornece a implementação com o próprio client:

```ts
// session-store.ts
export interface StoredSession {
	userId: string
	expiresAt: Date
}

export abstract class SessionStore {
	abstract findByToken(token: string): Promise<StoredSession | null>
}
```

```ts
// auth.module.ts
import { type DynamicModule, Module, type Type } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'

import { SessionAuthGuard } from './session-auth.guard'
import { SessionStore } from './session-store'

@Module({})
export class AuthModule {
	static forRoot(options: { sessionStore: Type<SessionStore> }): DynamicModule {
		return {
			module: AuthModule,
			providers: [
				{ provide: SessionStore, useClass: options.sessionStore },
				{ provide: APP_GUARD, useClass: SessionAuthGuard }
			]
		}
	}
}
```

`SessionAuthGuard` e `@CurrentUserId()` são os de hoje (`apps/service/src/infra/auth/`), trocando `@Inject('prismaAuth') prisma` por `SessionStore`. Comportamento igual: token ausente, inexistente ou expirado → **401**; `request.userId` vem só da sessão.

O `tsconfig` do lib precisa de `experimentalDecorators` e `emitDecoratorMetadata`, para o NestJS resolver a injeção pelo tipo. Com `module: "NodeNext"`, os imports relativos dentro do lib levam extensão (`'./session-store.js'`).

### 4.6 Modelo de referência `prisma/better-auth.prisma`

Cópia dos models `User`, `Session`, `Account` e `Verification` que estão hoje no schema do Finance (com `@@schema("better-auth")`), **sem** as relações de domínio do `User`. Ao criar um sistema, copie para o schema dele e acrescente as relações inversas (`vehicles Vehicle[]`…).

Ao atualizar o `better-auth` no lib, confira se a versão nova pede campos novos (`pnpm dlx @better-auth/cli generate`) e replique em **todos** os schemas, com uma migration por sistema.

### 4.7 Migração do Finance Assets para o `@lib/auth`

1. Adicionar o submódulo:
   ```bash
   git submodule add -b main https://github.com/apps-home/lib-auth packages/lib-auth
   ```
   O `pnpm-workspace.yaml` já inclui `packages/*`, e o `scripts/check-version.mjs` lê o `.gitmodules` sozinho.
2. `apps/web/package.json`: adicionar `"@lib/auth": "workspace:*"` e remover `better-auth`.
3. `apps/service/package.json`: adicionar `"@lib/auth": "workspace:*"`.
4. Incluir `pnpm --filter @lib/auth build` no `build` da raiz e nos Dockerfiles, antes do build dos apps, como já é feito com o `@lib/db`. Copiar `packages/lib-auth` nos estágios que copiam `packages/lib-db`.
5. **Web:**
   - `shared/lib/auth.ts` vira uma chamada a `createAuth({ appName: 'better-auth', secret, baseURL, trustedOrigins, prisma, sendResetPassword })`. O envio pelo n8n continua no app.
   - Os reexports de `auth.api` continuam no arquivo do app.
   - `shared/lib/auth-client.ts` usa `createAppAuthClient({ fallbackBaseURL: env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000' })` e mantém os reexports.
   - `shared/lib/current-user.ts` usa `createSessionHelpers(auth)`.
   - `app/api/auth/[...all]/route.ts` usa `createAuthRouteHandler(auth)`.
   - As origens de dev (`10.0.2.124`, `local.dev.terraviva`, `192.168.0.6`) saem do código e vão para uma variável `BETTER_AUTH_TRUSTED_ORIGINS` (lista separada por vírgula) no `@finance-assets-web/env`.
6. **Service:**
   - Criar `infra/auth/prisma-session-store.ts`, implementando `SessionStore` com `prismaAuth.session.findUnique({ where: { token }, select: { userId: true, expiresAt: true } })`.
   - Trocar `AuthModule` por `AuthModule.forRoot({ sessionStore: PrismaSessionStore })` de `@lib/auth/nest`.
   - Trocar os imports de `@CurrentUserId()` para `@lib/auth/nest`.
   - Apagar `session-auth.guard.ts`, `current-user-id.decorator.ts` e `auth.module.ts` de `infra/auth/`.
7. Ajustar mocks e helpers dos testes que importam o guard ou o decorator.

### 4.8 Fase opcional: telas de autenticação

As quatro telas (`sign-in`, `sign-up`, `forgot-password`, `reset-password`, ~680 linhas) seriam iguais em todos os sistemas. Elas podem virar componentes em `@lib/auth/react` (formulários sobre `@lib/ui`, recebendo `authClient`, `logo` e callbacks `onSuccess`), com cada app só montando a rota.

Deixe para **depois** de o Car Expenses estar de pé: só com dois sistemas fica claro o que muda de um para o outro. O `@lib/ui` não pode receber essas telas, porque elas dependem do cliente de autenticação e de navegação.

### 4.9 Verificação da etapa 2

1. Usuário logado antes do deploy continua logado depois (cookie com o mesmo nome).
2. Login, cadastro, esqueci a senha (chega o e-mail do n8n), redefinir senha e logout funcionam no web.
3. Chamada à API sem token, com token inválido ou com sessão expirada responde **401**; com sessão válida, só devolve dados do próprio usuário.
4. `pnpm --filter api test`, `pnpm --filter api test:e2e`, `pnpm --filter web build` e `pnpm check-versions` passam.

---

## 5. Etapa 3: Isolamento da Infra Compartilhada

| Recurso | Mudança no Finance Assets | Quando o novo sistema chegar |
|---|---|---|
| **Redis / BullMQ** | `prefix: 'finance-assets'` no `BullModule.forRootAsync` (`infra/queue/queue.module.ts`) | Usa `prefix: 'car-expenses'` |
| **PostgreSQL** | Nenhuma | `CREATE DATABASE car_expenses_db` no Neon (DEV) e na VM (PROD) |
| **Novu** | Nenhuma | Application (ou environment) próprio: workflows e Inbox não se misturam, e os ids de usuário são de bancos diferentes |
| **Cloudflare R2** | Nenhuma | Bucket próprio, ou ao menos prefixo de pasta por sistema |
| **Cookies** | Prefixo vindo do `appName` (etapa 2) | `appName: 'car-expenses'` |
| **n8n** | Nenhuma | Webhooks com prefixo por sistema (`/webhook/car-expenses/...`) |
| **`sslmode`** | Secrets de produção com `sslmode=verify-full` em vez de `require` (aviso do `pg`) | Já nasce com `verify-full` |

**Sobre o `prefix` do BullMQ:** ele muda o nome das chaves no Redis. Jobs que estiverem na fila no momento do deploy ficam no prefixo antigo e não são processados. Os crons (preços às 19:00, proventos no domingo às 08:00, benchmarks nos dias 1 a 5, renda fixa de terça a sábado às 10:00) só enfileiram jobs, então tudo é recriado na próxima execução. Faça o deploy fora desses horários. As chaves antigas (`bull:asset-processing:*` etc.) podem ser apagadas depois.

---

## 6. Etapa 4: Documentação

- **`AGENTS.md` da raiz:** incluir `packages/lib-auth` na estrutura do workspace, `@packages/lib-auth/AGENTS.md` nos includes e corrigir a versão do NestJS (o `apps/service` já está na 12).
- **`packages/lib-db/AGENTS.md`:** um schema por sistema, scripts com sufixo (`migrate:finance-assets`…), variáveis `<SISTEMA>_DATABASE_URL` só para o CLI e o import `@lib/db/finance-assets`.
- **`packages/lib-auth/AGENTS.md`** (novo): decisões da seção 4.1, entradas por ambiente, como atualizar o `better-auth` em todos os schemas e o que nunca entra no lib (variáveis de ambiente, client Prisma, regra de negócio de um sistema).
- **`apps/service/AGENTS.md`:** a seção "Autenticação e Escopo por Usuário" passa a apontar para `@lib/auth/nest` e para o `PrismaSessionStore`.
- **`apps/web/AGENTS.md`:** `shared/lib/auth*.ts` passam a ser configuração do `@lib/auth`.
- **`docs/CAR_EXPENSES_CONCEPT.md`:** trocar a estrutura do `@lib/db` pela da seção 3.1, `sslmode=require` por `verify-full`, o hostname real do Neon por `<host>`, e incluir o `@lib/auth` nos pilares.

---

## 7. Checklist

**Etapa 1: `@lib/db`**
- [ ] Mover `schema.prisma` e `migrations/` para `src/prisma/finance-assets/`
- [ ] Criar `prisma.finance-assets.config.ts` e remover `prisma.config.ts`
- [ ] Renomear `DATABASE_URL` → `FINANCE_ASSETS_DATABASE_URL` no `.env` do lib-db
- [ ] `createDriver()` em `src/client`, `src/finance-assets.ts` e alias em `src/index.ts`
- [ ] `exports`, `typesVersions`, scripts e `files` do `package.json`
- [ ] Dockerfiles do web e do service (`--config` e caminho do `generated`)
- [ ] `migrate:finance-assets:status` sem pendências em DEV e PROD
- [ ] Testes, build e `docker build` passando; commit no submódulo e do ponteiro
- [ ] (Depois) imports para `@lib/db/finance-assets` e remoção do alias

**Etapa 2: `@lib/auth`**
- [ ] Criar o repositório `apps-home/lib-auth` e adicioná-lo como submódulo
- [ ] `server`, `next`, `client`, `nest` e `prisma/better-auth.prisma`
- [ ] Web: `auth.ts`, `auth-client.ts`, `current-user.ts`, route handler e `BETTER_AUTH_TRUSTED_ORIGINS`
- [ ] Service: `PrismaSessionStore`, `AuthModule.forRoot` e remoção de `infra/auth/*`
- [ ] Build do lib na raiz e nos Dockerfiles
- [ ] Sessões existentes continuam válidas (`appName: 'better-auth'`)

**Etapa 3: infra**
- [ ] `prefix` do BullMQ, com deploy fora do horário dos crons
- [ ] `sslmode=verify-full` nos secrets de produção

**Etapa 4: documentação**
- [ ] `AGENTS.md` da raiz, do lib-db, do lib-auth (novo), do service e do web
- [ ] `CAR_EXPENSES_CONCEPT.md` alinhado a este guia

---

## 8. Riscos e Como Voltar Atrás

| Risco | Sinal | Como evitar / reverter |
|---|---|---|
| Migrations tratadas como novas depois de mover a pasta | `migrate status` lista migrations pendentes | Os nomes das pastas não podem mudar. Reverter = voltar o ponteiro do submódulo `lib-db` |
| CLI do Prisma rodando no banco errado | Tabelas de um sistema aparecem no banco de outro | Um config por sistema, cada um com a própria variável, e nenhum config padrão |
| Deploy quebrado por caminho do `generated` | `Cannot find module .../generated/prisma/client` no container | `docker build` local antes do push. Reverter = commit anterior dos Dockerfiles e do ponteiro |
| Usuários deslogados | Todos caem no `/sign-in` depois do deploy | Manter `appName: 'better-auth'` na primeira versão |
| Duas versões do `better-auth` | Tipos incompatíveis entre `@lib/auth` e o app | Os apps não declaram `better-auth`; `pnpm check-versions` aponta a divergência |
| Jobs perdidos ao mudar o prefixo do BullMQ | Um dia sem atualização de preço ou proventos | Deploy fora do horário dos crons; reenfileirar manualmente se preciso (`POST /assets/refresh-quotes`, `POST /dividends/backfill`) |
