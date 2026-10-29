# Libs Compartilhados: `@lib/auth`, `@lib/ui` e um Lib de Banco por Sistema

> Como o **Finance Assets** ficou organizado para que outros sistemas (o primeiro é o Car Expenses, descrito em `CAR_EXPENSES_CONCEPT.md`) reaproveitem autenticação e design system sem que os sistemas se conheçam. Registra o que foi feito, o que foi verificado e o que falta.

---

## 1. Princípio

**Os sistemas não se conhecem.** Cada um tem repositório, banco, usuários, schema, migrations, filas e integrações próprios. Nenhum importa, configura ou menciona outro, e nada no Finance Assets muda por causa de um sistema novo.

**Libs compartilhados são ferramentas.** `@lib/ui` traz o design system e `@lib/auth` a autenticação. Nenhum deles conhece um sistema: não tem schema, nome de sistema, variável de ambiente nem conexão própria, e recebe por parâmetro tudo o que é de um sistema. Cada sistema adota uma versão nova quando quiser, atualizando o ponteiro do submódulo.

**O banco não é compartilhado como lib.** Cada sistema tem o próprio submódulo de banco, com schema, migrations, `prisma.config.ts` e client:

| Sistema | Submódulo | Pacote |
|---|---|---|
| Finance Assets | `packages/lib-finance-assets-db` (`apps-home/lib-finance-assets-db`) | `@lib/finance-assets-db` |
| Car Expenses | `packages/lib-car-expenses-db` (`apps-home/lib-car-expenses-db`) | `@lib/car-expenses-db` |

Não há um `@lib/db` genérico: o código do driver (`PrismaPg` sobre um `Pool` do `pg`, cerca de 20 linhas) é copiado e evolui em cada lib de banco. Isso evita um lib a mais só para essas linhas e deixa cada sistema escolher a própria versão do Prisma.

Além do código, só os **servidores** são compartilhados: a VM Oracle e o PostgreSQL (o cluster Neon em DEV e a instância da VM em PROD), com um database por sistema.

### O que não mudou no Finance Assets

| Recurso | Situação |
|---|---|
| **PostgreSQL** | Mesmo `personal_db`, mesma `DATABASE_URL` e mesmas migrations (só o caminho do submódulo mudou; o Prisma identifica migrations pelo nome da pasta) |
| **Better Auth** | Mesmos usuários e mesmo cookie (`better-auth.session_token`, sem `cookiePrefix`): ninguém é deslogado |
| **Redis / BullMQ, Novu, R2, n8n e Sentry** | Sem mudança |

---

## 2. Etapa 1: `lib-db` → `lib-finance-assets-db` (feita)

O submódulo continua com o mesmo conteúdo (schema, migrations, client e o commit `951d340`); mudaram o nome e o caminho.

| Onde | Mudança |
|---|---|
| `.gitmodules` e `.git/modules` | `packages/lib-db` → `packages/lib-finance-assets-db`, URL `https://github.com/apps-home/lib-finance-assets-db` |
| Submódulo: `package.json`, `README.md`, `AGENTS.md` | Nome `@lib/db` → `@lib/finance-assets-db`; os documentos descrevem o banco do Finance |
| `apps/service/src` (25 arquivos), `apps/web/src/shared/lib/auth.ts` e `apps/service/TESTING.md` | `from '@lib/db'` → `from '@lib/finance-assets-db'` |
| `package.json` da raiz, do web e do service | Dependência `@lib/finance-assets-db: workspace:*`; script `build:db` |
| `apps/web/tsconfig.json` e `next.config.ts` | `paths` e `transpilePackages` |
| `biome.json` | `!packages/lib-finance-assets-db/src/prisma/generated` |
| Dockerfiles do web e do service, workflows de deploy | Caminhos `packages/lib-finance-assets-db` |
| `AGENTS.md` e `README.md` (raiz, service, web) | Estrutura e comandos |

**Pendente:**
1. Renomear o repositório no GitHub de `apps-home/lib-db` para `apps-home/lib-finance-assets-db` **antes** do push do Finance: o `.gitmodules` já aponta para o nome novo, e o checkout do CI (`submodules: recursive`) falha se o repositório não existir com esse nome. O GitHub redireciona o nome antigo, então clones antigos continuam funcionando.
2. Commitar no submódulo (`package.json`, `README.md`, `AGENTS.md`) e fazer push.

---

## 3. Etapa 2: Submódulo `@lib/auth` (feita)

Repositório `apps-home/lib-auth`, em `packages/lib-auth`. Uso e regras no `README.md` e no `AGENTS.md` do lib.

### 3.1 Decisões

| Decisão | Motivo |
|---|---|
| O lib **não depende de lib de banco**, **não lê `process.env`** e não tem conexão própria | Cada sistema passa o próprio client Prisma, as próprias variáveis, e implementa o próprio `SessionStore` |
| `better-auth` é **dependência fixada** do lib (`1.7.2`), e os apps não o declaram | Uma única versão para todos os sistemas |
| Build com `tsc` para `dist/` em **ESM** (`module: "NodeNext"`) | O `better-auth` só publica ESM, o `apps/service` é ESM e o NestJS não transpila TypeScript de `node_modules` |
| Entradas separadas: `/server`, `/next`, `/client`, `/nest` | O NestJS não pode carregar `next/headers`, e o browser não pode carregar código de servidor |
| `next`, `react` e `@nestjs/*` como peers opcionais, nas mesmas faixas dos apps | Cada app usa só a sua parte, com a mesma instância do app |
| Os models do Better Auth **continuam no schema de cada sistema** | O `User` precisa das relações inversas do domínio. O lib traz `prisma/better-auth.prisma` para copiar |
| `createAuth` sem `disabledPaths` | No `better-auth` 1.7.2 a lista antiga (`/sign-up`, `/sign-in`, `/forgot-password`, `/reset-password`) só desativava de fato o `POST /reset-password`, o que deixava a redefinição de senha pelo web respondendo 404 |

### 3.2 `publicHoistPattern` para o NestJS

O `@lib/auth/nest` importa `@nestjs/common` e `@nestjs/core` de dentro de `packages/lib-auth`. O pnpm considera os peers de um pacote do workspace satisfeitos pelos `devDependencies` dele, e o `pnpm install --prod` do estágio `prod-deps` não instala esses `devDependencies`. Na simulação desse install, o `packages/lib-auth/node_modules` ficou só com `better-auth` e `server-only`, e o service quebraria ao subir.

A solução está no `pnpm-workspace.yaml` do Finance:

```yaml
publicHoistPattern:
  - '@nestjs/*'
```

Com ela, `node_modules/@nestjs/common` e `core` ficam na raiz e o lib encontra a mesma cópia do service. Tem que ser a mesma instância: com duas cópias, o `UnauthorizedException` do guard não passa no `instanceof` do filtro de exceções do Nest e o 401 vira 500. Por isso `@nestjs/*` não foi para `dependencies` do lib. Todo sistema com NestJS que usar o lib precisa da mesma linha.

### 3.3 Finance migrado para o `@lib/auth`

**Web:**
- `shared/lib/auth.ts`: `createAuth({ appName: 'Finance Assets', secret, baseURL, trustedOrigins, prisma, sendResetPassword })`, sem `cookiePrefix`; o envio pelo n8n e os reexports de `auth.api` continuam no app.
- `shared/lib/auth-client.ts`: `createAppAuthClient({ fallbackBaseURL })`, os reexports de sempre e o tipo `User` (`authClient.$Infer.Session.user`), que substitui o `import type { User } from 'better-auth'` do perfil.
- `shared/lib/current-user.ts`: `createSessionHelpers(auth)`.
- `app/api/auth/[...all]/route.ts`: `createAuthRouteHandler(auth)`.
- As origens de dev (`10.0.2.124`, `local.dev.terraviva`, `192.168.0.6` e `localhost:3000`) saíram do código para `BETTER_AUTH_TRUSTED_ORIGINS` (opcional, separada por vírgula) no `@finance-assets-web/env`. A origem do `BETTER_AUTH_URL` continua aceita sempre.
- `package.json`: `@lib/auth` no lugar de `better-auth`.

**Service:**
- `infra/auth/prisma-session-store.ts`: `PrismaSessionStore` com o `prismaAuth` (`session.findUnique` por token).
- `InfraModule`: `AuthModule.forRoot({ sessionStore: PrismaSessionStore })` de `@lib/auth/nest`.
- Os 11 controllers importam `@CurrentUserId()` de `@lib/auth/nest`; `session-auth.guard.ts`, `current-user-id.decorator.ts` e `auth.module.ts` foram apagados.
- Os testes e2e continuam mockando `prismaAuth.session.findUnique`, que é o que o `PrismaSessionStore` chama.

**Build e deploy:**
- Scripts da raiz: `build:auth`, `build:libs` (`build:db` + `build:auth`), e `build:service`/`build:web` chamam `build:libs`. O lib é consumido pelo `dist`, então `pnpm build:libs` é necessário depois de clonar.
- Dockerfiles: `packages/lib-auth/package.json` nos estágios de install; o service compila o lib antes da `api` e leva `dist`, `package.json` e `node_modules` do lib para a imagem final; o web copia o lib e o `node_modules` dele do `deps` e o compila antes do `next build`.
- Workflows: `packages/lib-auth/**` nos `paths` de `push` e `pull_request`.

### 3.4 Verificação

| Verificação | Resultado |
|---|---|
| Guard do lib num app Nest real (`SessionStore` falso) | Sem token, token inexistente e sessão expirada: 401; sessão válida: 200 com o `userId` |
| `pnpm --filter api test` e `test:e2e` | 445 e 42 testes passando |
| `pnpm --filter web build` | Passa |
| Web buildado com o banco de DEV | `/api/auth/ok` e `get-session` respondem; login com credencial errada consulta o banco e responde 401; `POST /reset-password` com token inválido responde 400 (antes: 404) |
| Simulação do `pnpm install --prod` do service | Com o `publicHoistPattern`, `@nestjs/common` e `core` na raiz e na mesma cópia do service |
| `docker build` do service | Passa; no container o lib carrega e resolve o mesmo `@nestjs/common` do service |
| `docker build` do web | Ver a seção 5 |

**Falta verificar em uso real:** login, cadastro, logout e redefinição de senha completa (e-mail do n8n) no web; um usuário logado antes do deploy continuar logado depois.

---

## 4. Ordem dos Commits

1. `packages/lib-auth`: commit dos ajustes no `README.md` e no `AGENTS.md` (seção do `publicHoistPattern`) e push.
2. Renomear `apps-home/lib-db` → `apps-home/lib-finance-assets-db` no GitHub; commit no `packages/lib-finance-assets-db` (nome do pacote e documentos) e push.
3. Finance: um único commit com o novo `.gitmodules`, os dois ponteiros, o `pnpm-lock.yaml`, o `pnpm-workspace.yaml`, os apps, os Dockerfiles, os workflows e os documentos. Reverter esse commit volta tudo, ponteiros incluídos.

---

## 5. Riscos e Como Voltar Atrás

| Risco | Sinal | Como evitar / reverter |
|---|---|---|
| CI não encontra o submódulo de banco | Checkout falha em `lib-finance-assets-db` | Renomear o repositório no GitHub antes do push |
| Ponteiro apontando para commit sem push | Checkout falha com `not our ref` | Push dos submódulos antes do Finance |
| `@nestjs/common` não encontrado pelo lib em produção | Service não sobe: `Cannot find package '@nestjs/common'` | `publicHoistPattern: ['@nestjs/*']` no `pnpm-workspace.yaml` |
| Duas cópias do `@nestjs/common` | Rotas sem sessão respondem 500 em vez de 401 | Não declarar `@nestjs/*` em `dependencies` do lib; manter as faixas iguais às do service |
| Usuários deslogados | Todos caem no `/sign-in` depois do deploy | O Finance não passa `cookiePrefix` |
| Origem de dev recusada | Login pelo IP da rede local falha com `Invalid origin` | `BETTER_AUTH_TRUSTED_ORIGINS` no `.env` do web |
| `dist` do lib desatualizado | Erro de tipo ou import em dev depois de mudar o lib | `pnpm build:libs` (ou `pnpm --filter @lib/auth dev`) |
| Um lib compartilhado passar a conhecer um sistema | Nome de sistema, URL, model ou webhook no código do lib | Antes de cada commit, `git -C packages/lib-auth grep -inE 'finance|asset'` (e os nomes do outro sistema) |
