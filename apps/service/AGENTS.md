# Finance Assets API — Documentação de Conceito

## 1. Visão Geral

O **Finance Assets** é uma plataforma robusta para gestão de patrimônio pessoal e rastreamento de investimentos. O objetivo central é permitir que o usuário organize seus ativos financeiros em categorias, acompanhe a evolução do saldo mensal e monitore a rentabilidade de ativos individuais (Ações BR/US, FIIs, Criptomoedas e Renda Fixa) em tempo real.

---

## 2. Pilares Tecnológicos

| Camada | Tecnologia |
|---|---|
| **Backend** | NestJS (Node.js) com arquitetura modular e workers |
| **Banco de Dados** | PostgreSQL gerenciado via Prisma ORM |
| **Processamento Assíncrono** | Redis + BullMQ (filas e cron jobs) |
| **Autenticação** | Better Auth (sessões, OAuth, tokens) |
| **Armazenamento de Arquivos** | Cloudflare R2 (S3-compatible) |
| **Infraestrutura** | Docker + Portainer, exposto via Nginx Proxy Manager com Cloudflare Zero Trust |
| **Automação Externa** | n8n para disparos de e-mail e geração de insights de IA |
| **Monorepo & Submódulos** | PNPM Workspaces com Git Submodules (`packages/lib-db`) |
| **Qualidade & Governança** | Biome (linting/formatação) e script de auditoria de dependências (`script.mjs`) |

---

## 3. Modelagem do Banco de Dados (Prisma Schema)

O schema é dividido em dois namespaces PostgreSQL: `better-auth` (autenticação) e `finance-assets` (domínio de negócio).

### Schema: `better-auth`

| Tabela | Descrição |
|---|---|
| `user` | Usuário da plataforma. Campos: `id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`. |
| `session` | Sessões ativas. Armazena `token`, `expiresAt`, `ipAddress`, `userAgent` e FK para `user`. |
| `account` | Contas OAuth vinculadas ao usuário (e.g., Google). Armazena `providerId`, `accessToken`, `refreshToken`, `scope`, `password`. |
| `verification` | Tokens temporários para verificação de e-mail e outros fluxos. Campos: `identifier`, `value`, `expiresAt`. |

### Schema: `finance-assets`

| Tabela | Descrição |
|---|---|
| `asset_categories` | Classe de ativos do usuário. Campos: `id`, `userId`, `name`, `type` (enum `CategoryType`), `currency` (padrão `BRL`). |
| `assets` | Ativo individual dentro de uma categoria. Campos: `id`, `categoryId`, `name`, `ticker`, `currentClosePrice`, `lastMonthClosePrice`. |
| `asset_records` | Registro histórico mensal do valor consolidado de uma categoria. Campos: `id`, `categoryId`, `month`, `year`, `amount`, `exchangeRate`. |
| `asset_category_competences` | Registra em quais **anos** uma categoria possui registros, otimizando queries de filtro temporal. Campos: `id`, `categoryId`, `year`. |

### Enum: `CategoryType`

| Valor | Descrição |
|---|---|
| `VARIABLE_BR` | Renda Variável — Mercado Brasileiro (Brapi) |
| `VARIABLE_US` | Renda Variável — Mercado Americano (Alpha Vantage) |
| `CRYPTO` | Criptomoedas (CoinGecko) |
| `FIXED` | Renda Fixa (sem cotação de mercado) |

---

## 4. Conceitos de Negócio e Modelagem de Domínio

O projeto é dividido em dois grandes "motores":

### A. Monitoramento Macro (Histórico)

Focado na evolução do patrimônio ao longo dos anos.

- **`AssetCategory`**: Define as classes de ativos do usuário (Renda Variável BR/US, Cripto, Renda Fixa).
- **`AssetRecord` (Budget)**: Registra a "fotografia" do valor total consolidado de uma categoria em um mês/ano específico. Suporta `exchangeRate` para categorias em moeda estrangeira.
- **`AssetCategoryCompetence`**: Filtro de inteligência que identifica em quais anos o usuário possui registros ativos, evitando queries desnecessárias.

### B. Monitoramento Micro (Real-time)

Focado no desempenho individual dos ativos.

- **`Asset`**: Representa o ativo específico (ex: `WEGE3`, `BTC`). Armazena o preço médio de compra e a quantidade.
- **Preços Dinâmicos**: Campos `currentClosePrice` (atualizado via Cron Job) e `lastMonthClosePrice` (referência do fechamento do mês anterior) para cálculo de rentabilidade **MTD (Month-to-Date)**.

---

## 5. Arquitetura de Módulos (`src/modules`)

```
modules/
├── assets/
│   ├── asset/          # Domínio do ativo individual (CRUD + price update)
│   ├── categories/     # Domínio das categorias de ativos
│   └── competences/    # Domínio das competências anuais por categoria
├── budgets/            # Domínio dos registros mensais (AssetRecord)
└── user/               # Domínio do usuário (perfil, avatar)
```

Cada módulo segue a arquitetura em camadas:
- **`domain/`** — Entidades, repositórios (interfaces) e DTOs
- **`application/use-cases/`** — Casos de uso (regras de negócio)
- **`infra/`** — Implementações concretas (repositórios Prisma, controllers HTTP)
- **`adapters/`** — Adaptadores externos (processadores de fila, listeners de eventos, cron schedules)

---

## 6. Infraestrutura (`src/infra`)

```
infra/
├── cron/       # Agendamento de tarefas periódicas (NestJS Schedule)
├── events/     # Publisher de eventos de domínio (EventEmitter)
├── http/       # Middlewares, guards e filtros HTTP globais
├── prisma/     # Módulo e serviço do Prisma Client
├── queue/      # Publisher de jobs BullMQ
└── storage/    # Integração com Cloudflare R2 (upload de arquivos)
```

### Fluxo de Atualização de Preços (Cron + Queue)

```
[Cron Job] update-asset-prices.cron.ts
      │  (dispara diariamente em horário estratégico)
      ▼
[JobPublisher] → BullMQ Queue ("update-asset-price")
      │
      ▼ (para cada ativo)
[Processor] update-asset-price.processor.ts
      │  (roteamento por CategoryType)
      ├──► VARIABLE_BR  → Brapi API
      ├──► CRYPTO       → CoinGecko API
      ├──► VARIABLE_US  → Alpha Vantage API
      └──► FIXED        → (ignorado)
```

### Fluxo de Evento ao Criar Ativo

```
[Use Case] CreateAsset
      │  (emite asset.created via EventPublisher)
      ▼
[Listener] asset-created.listener.ts
      │  (enfileira job de busca de preço inicial)
      ▼
[Processor] update-asset-price.processor.ts
```

### Armazenamento de Arquivos (Cloudflare R2)

O `R2StorageService` (`src/infra/storage`) é responsável pelo upload de arquivos (ex: avatar do usuário) para o bucket Cloudflare R2, retornando a URL pública do objeto armazenado.

---

## 7. Core (`src/core`)

```
core/
├── domain/
│   ├── errors/    # DomainError base
│   ├── events/    # Interface DomainEventPublisher + AssetEvent
│   └── queue/     # Interface DomainJobPublisher + constantes de filas
└── utils/         # Utilitários genéricos (Optional, etc.)
```

---

## 8. Funcionalidades Principais

| Funcionalidade | Descrição |
|---|---|
| **Dashboard de Patrimônio** | Visualização da alocação de recursos por categoria com totais consolidados. |
| **Gestão de Categorias** | CRUD de categorias com suporte a múltiplas moedas (BRL/USD) e tipos de ativos. |
| **Gestão de Ativos** | CRUD de ativos individuais com ticker, preço médio e quantidade. |
| **Sincronização Automática** | Cron Jobs diários que buscam cotações em Brapi, CoinGecko e Alpha Vantage via BullMQ. |
| **Atualização ao Criar Ativo** | Evento `asset.created` dispara busca imediata do preço de mercado (currentClosePrice + lastMonthClosePrice). |
| **Histórico Mensal (Budget)** | Registro do valor consolidado de uma categoria por mês/ano com suporte a taxa de câmbio. |
| **Filtro por Competência** | Consulta eficiente dos anos com registros via `AssetCategoryCompetence`. |
| **Gestão de Usuário** | Atualização de perfil e upload de avatar para Cloudflare R2. |
| **Autenticação Segura** | Better Auth com suporte a OAuth (Google), verificação de e-mail e gestão de sessões. |
| **Sistema de Notificações** | Integração com n8n para alertas de fechamento de mês e segurança de conta. |

---

## 9. Fluxo de Operação Interna

1. O usuário cria uma **categoria** e seus respectivos **ativos**.
2. Ao criar um ativo com ticker, o sistema dispara um evento que busca o preço atual imediatamente.
3. Todo dia útil, o Cron Job enfileira jobs no BullMQ para atualizar os preços de mercado de todos os ativos em background.
4. No fechamento do mês, o usuário registra o valor total consolidado da categoria (**Budget/AssetRecord**) para manter o histórico de longo prazo.
5. A API fornece dados processados que permitem ao frontend exibir indicadores de lucro/prejuízo, rentabilidade MTD e gráficos de alocação.

---

## 10. Estrutura do Monorepo & Scripts (`package.json`)

O projeto adota uma arquitetura monorepo gerenciada via **pnpm workspaces** (`pnpm-workspace.yaml`), integrando a API principal com bibliotecas compartilhadas versionadas via Git Submodule.

### Estrutura de Pacotes

```
finance-assets-api/
├── apps/
│   └── service/              # API NestJS principal (package: "api")
├── packages/
│   └── lib-db/               # Submódulo Git compartilhado (package: "@lib/db", Prisma ORM)
├── package.json              # Configurações e scripts orquestradores da raiz
├── pnpm-workspace.yaml       # Configuração de workspaces e permissões de build
├── script.mjs                # Script de auditoria e validação de dependências do workspace
└── biome.json                # Configuração de linting e formatação
```

### Scripts Orquestradores

| Script | Comando | Descrição |
|---|---|---|
| `dev` | `pnpm --filter api dev` | Inicia a API NestJS em modo de desenvolvimento (watch). |
| `start` | `pnpm --filter api start` | Inicia a API NestJS em modo padrão. |
| `build` | `pnpm --filter @lib/db build && pnpm --filter api build` | Executa o build da biblioteca `@lib/db` (Prisma generate + tsc) e depois o build da aplicação `api`. |
| `lint` | `pnpm --filter api lint` | Executa a verificação e correção de linting com Biome na API. |
| `format` | `pnpm --filter api format` | Formata o código com Biome na API. |
| `check` | `pnpm --filter api check` | Executa verificação completa de linting e formatação com auto-correção. |
| `check-versions` | `node script.mjs` | Executa o validador de integridade e consistência de versões no monorepo e submódulos. |

---

## 11. Auditoria e Consistência de Versões (`script.mjs`)

O arquivo `script.mjs` (executado via `pnpm check-versions`) é uma ferramenta interna de governança para auditoria estática e prevenção de conflitos de dependências entre projetos do workspace e submódulos Git.

### Capacidades e Funcionamento do `script.mjs`:

1. **Varredura Dinâmica de Pacotes**:
   - Lê os padrões glob de pacotes definidos no `pnpm-workspace.yaml` (ex: `apps/*`, `packages/*`).
   - Localiza e analisa automaticamente todos os `package.json` presentes no monorepo (raiz, apps e pacotes).

2. **Reconhecimento de Git Submodules**:
   - Faz o parse do arquivo `.gitmodules` para mapear submódulos Git vinculados (ex: `packages/lib-db`).
   - Categoriza cada projeto escaneado com tags explícitas: `[ROOT]`, `[APP/PKG]` ou `[SUBMODULE]`.

3. **Suporte ao Catalog do PNPM (`catalog:`)**:
   - Processa a seção `catalog` do `pnpm-workspace.yaml`.
   - Resolve referências `catalog:` para suas versões efetivas e valida se o catálogo está sendo respeitado.
   - Emite sugestões inteligentes quando dependências utilizam versões fixadas idênticas às já disponíveis no catálogo.

4. **Detecção e Alerta de Version Mismatches**:
   - Analisa todas as seções (`dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`), desconsiderando referências internas `workspace:*`.
   - Identifica discrepâncias de versão do mesmo pacote entre o projeto principal e submódulos Git.
   - Aponta dependências com versões conflitantes ou divergentes do catálogo.

5. **Feedback Visual e Integração CI/CD**:
   - Gera um relatório estruturado no terminal com cores ANSI, alertas de desvio e resumo estatístico quantitativo.
   - Retorna exit code `0` em caso de consistência total ou exit code `1` em caso de divergências (permitindo bloqueio automatizado em pipelines de CI).