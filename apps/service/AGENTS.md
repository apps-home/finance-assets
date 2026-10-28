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
| **Qualidade & Governança** | Biome (linting/formatação) e script de auditoria de dependências (`scripts/check-version.mjs`) |

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
| `asset_categories` | Classe de ativos do usuário. Campos: `id`, `userId`, `name`, `type` (enum `CategoryType`), `targetPercentage` (meta de alocação, 0–100), `currency` (padrão `BRL`), `createdAt`, `updatedAt`. |
| `market_assets` | **Catálogo compartilhado** de ativos com cotação de mercado, sem dono. Um registro por `(ticker, type)`, com `currentClosePrice`, `lastMonthClosePrice` e `priceUpdatedAt`. A cotação é buscada uma vez e reaproveitada por todos os usuários. |
| `assets` | Ativo individual dentro de uma categoria. Campos: `id`, `categoryId`, `name`, `ticker`, `quantity`, `averagePrice`, `broker`, `isActive`, `marketAssetId`, `currentClosePrice` (só preço manual, sem `marketAssetId`), `dividendsImportedAt`, `indexer` (`FixedIncomeIndexer`: `CDI`|`IPCA`|`PRE`, só renda fixa), `indexerRate`, `investedAt`, `maturityAt`, `createdAt`, `updatedAt`. |
| `asset_wishlists` | Ativos monitorados / lista de desejos do usuário. Campos: `id`, `userId`, `categoryId`, `name`, `ticker`, `targetPrice`, `marketAssetId`, `notes`, `createdAt`, `updatedAt`. Único por `(userId, ticker)`. |
| `asset_records` | Registro histórico mensal do valor consolidado de uma categoria. Campos: `id`, `categoryId`, `month`, `year`, `amount`, `exchangeRate`, `dividendAmount`, `contributionAmount` (aporte líquido do mês em R$), `createdAt`, `updatedAt`. Único por `(categoryId, month, year)`. |
| `benchmark_returns` | Cache global (sem usuário) do retorno mensal dos benchmarks. Campos: `benchmark` (`CDI`|`IBOV`|`SP500_BRL`|`IFIX`|`BTC_BRL`), `year`, `month`, `returnPct` (em %). Único por `(benchmark, year, month)`. |
| `indicator_rates` | Cache global do CDI diário (% ao dia, só dias úteis) e do IPCA mensal (% no mês, data = dia 1º), usado na renda fixa automática. Campos: `indicator` (`EconomicIndicator`: `CDI`|`IPCA`), `date`, `ratePct`. Único por `(indicator, date)`. |
| `asset_category_competences` | Registra em quais **anos** uma categoria possui registros, otimizando queries de filtro temporal. Campos: `id`, `categoryId`, `year`. Único por `(categoryId, year)`. |
| `asset_dividends` | Provento de um ativo (dividendo, JCP, rendimento). Campos: `id`, `assetId`, `userId`, `type` (`DividendType`), `source` (`MANUAL`\|`SYNC`), `amount` (total **bruto** na moeda da categoria), `taxAmount` (impostos/taxas retidos, opcional), `rateAmount`, `quantity`, `exchangeRate`, `comDate`, `paymentDate`. Único por `(assetId, type, paymentDate)`. |
| `asset_transactions` | Operação de um ativo. Campos: `id`, `assetId`, `userId`, `type` (`TransactionType`: `OPENING`\|`BUY`\|`SELL`\|`SPLIT`\|`REVERSE_SPLIT`\|`BONUS`), `source` (`MANUAL`\|`IMPORT`), `date` (data do negócio), `quantity`, `price` (unitário, na moeda da categoria; em `BONUS` é o custo atribuído), `fees`, `factor` (desdobramento/grupamento), `exchangeRate`, `notes`. Com operações, `assets.quantity` e `assets.averagePrice` são calculados a partir delas. |

> Todas as FKs usam `onDelete: Cascade`: excluir uma categoria remove seus ativos, wishlist, registros e competências.

### Enum: `CategoryType`

| Valor | Descrição |
|---|---|
| `VARIABLE_BR` | Renda Variável — Mercado Brasileiro (Brapi) |
| `FII` | Fundos Imobiliários (Brapi) |
| `VARIABLE_US` | Renda Variável — Mercado Americano (Yahoo Finance, com fallback para Polygon e Alpha Vantage) |
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
- **Preços Dinâmicos**: `currentClosePrice` e `lastMonthClosePrice` (fechamento do mês anterior, base da rentabilidade **MTD**) vêm do catálogo `MarketAsset`, atualizado via Cron Job.
- **`MarketAsset` (catálogo)**: um registro por ticker + tipo, compartilhado entre usuários. Ativos e itens da wishlist apontam para ele (`marketAssetId`) e as entidades `Asset`/`Wishlist` expõem a cotação dele, como se fosse delas. Renda fixa e ativos sem ticker não entram no catálogo: usam o preço manual de `assets.currentClosePrice`.

---

## 5. Arquitetura de Módulos (`src/modules`)

```
modules/
├── assets/
│   ├── asset/          # Ativo individual (CRUD, atualização de preço, notificações de variação)
│   ├── categories/     # Categorias de ativos (tipo, moeda, meta de alocação, anos)
│   ├── competences/    # Competências anuais por categoria (somente leitura de anos + exclusão)
│   ├── market-asset/   # Catálogo compartilhado de cotações (resolve ticker, atualiza preço, cron e fila)
│   └── wishlist/       # Lista de desejos / ativos monitorados
├── budgets/            # Registros mensais (AssetRecord)
├── dividends/          # Proventos por ativo (CRUD, resumos, próximos pagamentos, sync Yahoo/Polygon)
├── indicators/         # Cache de CDI diário e IPCA do Banco Central (renda fixa automática)
├── performance/        # Rentabilidade da carteira e por categoria vs CDI, Ibovespa, IFIX, S&P 500 e bitcoin (R$)
├── transactions/       # Operações por ativo (compra, venda, eventos), posição calculada e aporte do mês
└── user/               # Usuário do Better Auth (consulta e avatar)
```

Cada módulo segue a arquitetura em camadas (DDD / Clean Architecture):

```
<modulo>/
├── <nome>.module.ts
├── domain/
│   ├── <nome>.entity.ts        # Entidade (regras de negócio e validações)
│   ├── <nome>.mapper.ts        # Mapper de domínio (payload -> entidade, entidade -> resposta HTTP)
│   ├── <nome>.repository.ts    # Contrato abstrato do repositório (token de DI)
│   └── dto/                    # Payloads e parâmetros de busca do domínio
├── application/
│   ├── use-cases/              # Casos de uso (um arquivo por caso de uso, specs ao lado)
│   └── errors/                 # Erros do módulo (<nome>-not-found.error.ts)
├── infra/
│   ├── <nome>.controller.ts    # Controller HTTP
│   ├── <nome>.dto.ts           # DTOs de entrada (class-validator)
│   └── repositories/           # prisma.<nome>.repository.ts e prisma.<nome>.mapper.ts
└── adapters/                   # Somente em asset: listeners, consumers BullMQ e crons
```

### Autenticação e Escopo por Usuário

**Todas as rotas exigem sessão.** O `SessionAuthGuard` (`src/infra/auth`) é registrado como `APP_GUARD`, então a proteção é o padrão e não depende de cada controller:

- O cliente envia `Authorization: Bearer <session.token>` (token da sessão do Better Auth, que o web obtém com `authClient.getSession()`).
- O guard busca o token na tabela `session` (via `prismaAuth`). Token ausente, inexistente ou expirado responde **401**.
- O `userId` vem **somente** da sessão. Nos controllers, use o decorator `@CurrentUserId()`. Não existe mais header `user-id` e nenhum controller deve ler `request.headers`.

**Cada usuário só enxerga e altera o que é dele.** Isso vale por padrão, sem métodos "ByUser" paralelos:

- Métodos de repositório que lêem dado do usuário recebem `userId` obrigatório: `findById(id, userId)`, `list({ userId, ... })`. Esquecer o `userId` é erro de compilação.
- Recurso de outro usuário se comporta como inexistente: o use case devolve `...NotFoundError` (**404**, nunca 403).
- Ao criar algo que pertence a uma categoria (ativo, wishlist, budget), o use case busca a categoria com `categoryRepository.findById(categoryId, userId)`.
- Cron e filas não têm usuário. Eles usam métodos com nome explícito: `findByIdForSystem(id)`, `findAllWithTicker()`, `findAllActiveWithUserDetails()`.
- IDs de domínio são UUID v4, validados nos controllers com `ParseUUIDPipe({ version: '4' })`. Os ids de `user` vêm do Better Auth e **não** são UUID.

### Padrão de Erro e Retorno dos Use Cases: `Either<Left, Right>`

O projeto utiliza o padrão funcional `Either` de `@/core/utils/Either` para encapsular retornos e erros sem lançar exceções não tratadas nos casos de uso:

```ts
import { Either, left, right } from '@/core/utils/Either'

type Response = Either<CategoryNotFoundError | PayloadError, void>

@Injectable()
export class CreateAssetUseCase {
  constructor(
    private assetRepository: AssetRepository,
    private categoryRepository: CategoryRepository,
    private eventPublisher: DomainEventPublisher
  ) {}

  async execute(userId: string, data: CreateAssetPayload): Promise<Response> {
    const category = await this.categoryRepository.findById(
      data.categoryId,
      userId
    )

    if (!category) {
      return left(new CategoryNotFoundError())
    }

    const asset = AssetMapper.toDomain(data)

    await this.assetRepository.save(asset)

    return right(void 0)
  }
}
```

### Erros e Tratamento nos Controllers HTTP

Erros de "não encontrado" estendem `NotFoundError` (`@/core/domain/errors/not-found-error`) e erros de validação usam `PayloadError`. O controller não mapeia erro por erro: ele delega ao helper `toHttpException` (`@/infra/http/to-http-exception`):

| Erro do use case | Resposta HTTP |
|---|---|
| `NotFoundError` (e subclasses: `AssetNotFoundError`, `CategoryNotFoundError`, ...) | `404 NotFoundException` |
| `PayloadError` | `400 BadRequestException` |
| qualquer outro | `500 InternalServerErrorException('Unexpected error')` (sem vazar a mensagem) |

```ts
@Post()
async create(@Body() data: CreateAssetDTO, @CurrentUserId() userId: string) {
  const result = await this.createAssetUseCase.execute(userId, data)

  if (result.isLeft()) {
    throw toHttpException(result.value)
  }

  return { message: 'Asset created successfully' }
}
```

Um novo erro de "não encontrado" só precisa estender `NotFoundError` para virar 404 automaticamente. Escritas respondem `{ message }`; leituras respondem o valor direto (`result.value`).

O `AllExceptionsFilter` (`@/infra/http/all-exceptions.filter`, registrado em `main.ts`) é a rede de segurança para o que escapar dos controllers: `HttpException` mantém status e corpo; erros de domínio soltos passam por `toHttpException` (404/400); qualquer outro erro vira **500 `Unexpected error`**, sem expor a mensagem original, e a stack é registrada no log. Para rejeitar entrada inválida fora de um use case (ex.: `fileFilter` do multer), lance `BadRequestException`, não `Error`.

### Entidades: `update()` Parcial

- A entidade é dona da regra de atualização: o use case chama `entity.update(data)` e **nunca** atribui campo a campo.
- `update()` recebe `Partial<Omit<Props, 'id' | <dono> | 'createdAt' | 'updatedAt'>>`. Campos `undefined` são ignorados (via `omitUndefined`, em `@/core/utils/omit-undefined`); `null` limpa campos anuláveis.
- Validações e normalizações (trim de nome, ticker em maiúsculas) ficam dentro da entidade e lançam `PayloadError`.
- Os payloads de update do domínio são `Partial<Omit<CreatePayload, <chave não editável>>>`: `categoryId` (assets e budgets) e `userId` (categories) não podem ser alterados por update.

### Endpoints

Todos exigem `Authorization: Bearer <session token>` e respondem apenas com dados do usuário da sessão.

| Recurso | Rotas | Query params |
|---|---|---|
| **Assets** | `POST /assets` (body com `categoryId`), `POST /assets/refresh-quotes` (body com `categoryId`), `GET /assets`, `GET /assets/:id/history`, `GET/PATCH/DELETE /assets/:id` | `search`, `categoryId`, `type`, `status` (`ACTIVE`\|`INACTIVE`), `sort=monthChange`, `order` (`asc`\|`desc`) |
| **Categories** | `POST /categories`, `GET /categories`, `GET/PATCH/DELETE /categories/:id` | `name`, `type`, `currency`, `year` |
| **Wishlist** | `POST /wishlist`, `GET /wishlist`, `GET/PATCH/DELETE /wishlist/:id` | `categoryId`, `search`, `type`, `targetStatus` (`BELOW_OR_AT_TARGET`\|`ABOVE_TARGET`\|`NO_TARGET`), `sort=monthChange`, `order` |
| **Budgets** | `POST /budgets`, `GET /budgets`, `GET/PATCH/DELETE /budgets/:id` | `categoryId`, `month`, `year` |
| **Competences** | `GET /competences/years`, `GET /competences?categoryId=`, `DELETE /competences/:id` | `categoryId` (UUID) |
| **Dividends** | `POST /dividends`, `POST /dividends/backfill`, `GET /dividends`, `GET /dividends/summary`, `GET /dividends/upcoming`, `GET/PATCH/DELETE /dividends/:id` | `assetId`, `categoryId`, `categoryType`, `type`, `year` (em `GET /dividends`); `year` (em `/summary`) |
| **Transactions** | `POST /transactions` (body com `assetId`), `GET /transactions`, `GET /transactions/contributions`, `PATCH/DELETE /transactions/:id` | `assetId`, `categoryId`, `from`, `to` (em `GET /transactions`); `year`, `month` (em `/contributions`) |
| **Performance** | `GET /performance`, `GET /performance/assets` | `from`, `to` (`AAAA-MM`, opcionais); `scope` (`all`|`variable`|`fixed`, padrão `all`) |
| **Users** | `GET /users/:id`, `PATCH /users/:id/upload-avatar`, `GET /users/:id/download-avatar` (somente o próprio usuário) | — |

Observações:
- **Ordenação por variação do mês** (`sort=monthChange`): `GET /assets` e `GET /wishlist` ordenam por `(currentClosePrice - lastMonthClosePrice) / lastMonthClosePrice`. `order=asc` traz a maior queda primeiro. Itens sem comparação (preço ausente ou `lastMonthClosePrice = 0`) ficam sempre no fim. A ordenação é feita em memória, no use case, sobre o resultado já filtrado (não há paginação).
- **Histórico de cotação** (`GET /assets/:id/history?range=5d|1m|ytd|1y|3y|5y`, padrão `1m`): série de fechamento do ativo do usuário, com `points`, `change`, `changePercent` e `currency` da categoria. Fonte: Yahoo Finance (`PriceHistoryGateway`, sem chave; BR/FII com `.SA`, US com `.` trocado por `-`), com cache em memória de 15 min por ticker + período. `3y` pede `5y` e corta no servidor. Cripto e renda fixa não têm histórico (404 `PriceHistoryUnavailableError`, assim como falha do Yahoo ou ativo sem ticker). A web mostra o gráfico no `AssetDetailSheet`.
- **Filtros no servidor:** `search` busca em nome/ticker (e corretora em assets, notas em wishlist), sem diferenciar maiúsculas. `targetStatus` é aplicado em memória, pois compara duas colunas.
- **Wishlist:** ao criar (ou trocar o ticker), aponta para o catálogo e só busca a cotação, de forma síncrona, se o catálogo não tiver uma recente (falha de cotação não impede a criação). O ticker é único por usuário.
- **Atualização manual de cotações** (`POST /assets/refresh-quotes`): busca na hora, um ticker por vez, as cotações do catálogo usadas pelos ativos **ativos** da categoria do usuário (`RefreshCategoryQuotesUseCase`). Cotação atualizada há menos de 5 min (`MANUAL_REFRESH_COOLDOWN_MS`) é pulada, para cliques repetidos não chamarem os providers. Como o catálogo é compartilhado, o preço novo vale para todos os usuários do ticker. Resposta: `{ message, updated, skipped, failedTickers }`. A web chama pelo botão "Atualizar cotações" em `/assets`.
- **Catálogo de mercado:** ao criar um ativo ou item da wishlist, `ResolveMarketAssetUseCase` reaproveita o `MarketAsset` do mesmo ticker + tipo ou cria um. Uma cotação com menos de 12h (`QUOTE_FRESHNESS_MS`) é reaproveitada sem chamada externa. Com cotação de mercado, o preço enviado no `PATCH /assets/:id` é ignorado.
- **Users:** o usuário só acessa o próprio registro. O `:id` precisa ser o `userId` da sessão; qualquer outro id responde 404 (`UserNotFoundError`), mesmo que exista. Não há listagem nem busca por e-mail de usuários.
- **Budgets (câmbio):** o `amount` é guardado **já convertido** para R$ (`valor original × cotação`) e `exchangeRate` guarda a cotação usada. A conversão acontece só em `Budget.changeAmount(originalAmount, exchangeRate)`, que o `POST` e o `PATCH` usam; `originalAmount` devolve o valor na moeda da categoria (`amount ÷ exchangeRate`). Quem reenvia um valor deve mandar o original, nunca o já convertido. `categoryId`, `month` e `year` não mudam por `PATCH` (são a identidade do registro).

### Passo a Passo para Criar um Novo Módulo no Backend

1. **Modelagem:** Se necessário, adicione a tabela em `packages/lib-db/src/prisma/schema.prisma` e execute `pnpm --filter @lib/db build`.
2. **Camada Domain (`src/modules/<nome>/domain`):**
   - Crie a entidade (`create()` com defaults e `update()` parcial) e o contrato do repositório (`abstract class <Nome>Repository`) com `userId` obrigatório nos métodos que acessam dado do usuário.
3. **Camada Application (`src/modules/<nome>/application`):**
   - Crie os casos de uso em `use-cases/` retornando `Promise<Either<AppError, Result>>` e os erros em `errors/` (estendendo `NotFoundError` quando for "não encontrado"). Escreva o spec ao lado de cada caso de uso.
4. **Camada Infra (`src/modules/<nome>/infra`):**
   - Implemente o repositório Prisma em `repositories/prisma.<nome>.repository.ts` (token `'prismaFinanceAssets'`) e o mapper `prisma.<nome>.mapper.ts`.
   - Crie o DTO de requisição (`<nome>.dto.ts`) com class-validator.
   - Crie o controller HTTP em `<nome>.controller.ts` usando `@CurrentUserId()`, `ParseUUIDPipe` nos `:id` e `toHttpException`.
5. **Módulo NestJS (`src/modules/<nome>/<nome>.module.ts`):**
   - Declare `controllers: [<Nome>Controller]`.
   - Forneça os use-cases e vincule a interface do repositório à implementação concreta:
     `{ provide: <Nome>Repository, useClass: Prisma<Nome>Repository }`.
6. **Registro Global (`src/app.module.ts`):**
   - **OBRIGATÓRIO:** Importe `<Nome>Module` no array `imports` de `AppModule`.

---

## 6. Infraestrutura (`src/infra`)

```
infra/
├── auth/       # SessionAuthGuard (APP_GUARD global) e decorator @CurrentUserId()
├── cron/       # CronModule (os crons ficam em modules/assets/asset/adapters/schedules)
├── env/        # Validação e acesso às variáveis de ambiente
├── events/     # Publisher de eventos de domínio (EventEmitter)
├── http/       # Providers de cotação (Brapi, CoinGecko, Yahoo, Polygon, Alpha Vantage), benchmarks, indicadores do BCB, cliente n8n, toHttpException e AllExceptionsFilter
├── prisma/     # Providers 'prismaFinanceAssets' e 'prismaAuth'
├── queue/      # Publisher de jobs BullMQ
└── storage/    # Integração com Cloudflare R2 (upload de arquivos)
```

### Fluxo de Atualização de Preços (Cron + Queue)

```
[Cron Job] market-asset/adapters/schedules/update-market-prices.cron.ts
      │  (todo dia às 19:00, America/Sao_Paulo)
      ▼
[MarketAssetRepository.findAllInUse] (catálogo usado por algum ativo ativo ou item da wishlist)
      │
      ▼ (um job por MarketAsset, ou seja, por ticker + tipo, independente de quantos usuários o usam)
[JobPublisher] → BullMQ Queue ("asset-processing", job "update-price")
      │
      ▼
[Consumer] market-asset/adapters/jobs/update-price.consumer.ts
      │  (RefreshMarketAssetQuoteUseCase com force, roteamento por tipo via MarketDataGateway)
      ├──► VARIABLE_BR / FII → Brapi API
      ├──► CRYPTO            → CoinGecko API
      └──► VARIABLE_US       → Yahoo Finance (fallback: Polygon → Alpha Vantage)
```

Uma linha do catálogo é gravada por ticker; todos os ativos e itens da wishlist que apontam para ela passam a ler o preço novo.

### Fluxo de Evento ao Criar Ativo

```
[Use Case] CreateAsset / UpdateAsset (troca de ticker)
      │  (resolve o MarketAsset; só emite asset.created se a cotação dele não for recente)
      ▼
[Listener] market-asset/adapters/events/market-quote-requested.listener.ts
      │
      ▼
RefreshMarketAssetQuoteUseCase (busca a cotação uma vez para o catálogo)
```

A wishlist não usa evento: `CreateWishlistUseCase` usa `ResolveMarketAssetWithQuoteUseCase`, que busca a cotação na hora se o catálogo não tiver uma recente.

### Notificações de Variação (n8n)

`adapters/schedules/notify-asset-variations.cron.ts` roda de segunda a sexta às 09:00 (America/Sao_Paulo), executa `NotifyAssetVariationsUseCase` e, para cada usuário com alertas (maiores altas e quedas da carteira e da wishlist, e metas de preço atingidas), dispara o webhook `assets/notify` do n8n.

### Proventos (`modules/dividends`)

- **Lançamento:** `POST /dividends` recebe `assetId`, `paymentDate` e `amount` (total) **ou** `rateAmount` (por cota; o total vira `rateAmount × quantidade do ativo`). Em categorias fora de BRL o `exchangeRate` é obrigatório. `paymentDate` é uma data de calendário normalizada para 00:00 UTC; `(assetId, type, paymentDate)` é único.
- **Impostos retidos:** `taxAmount` opcional (≥ 0 e menor que `amount`, na mesma moeda) para quem recebe líquido, como ações US com retenção na fonte. `amount` continua sendo o bruto devolvido pela API, e o líquido é `netAmount = amount − taxAmount`. Para remover uma taxa já salva, envie `taxAmount: 0`. **Padrão por categoria** (`domain/dividend-tax.ts`): em ações US (`VARIABLE_US`) a taxa presumida é 30% do bruto (retenção na fonte dos EUA, confirmada nos lançamentos reais do usuário), aplicada quando `taxAmount` não é informado no `POST /dividends` e nos proventos criados ou recalculados pelo sync; `taxAmount: 0` explícito desliga. Outras categorias não têm padrão (`null`, líquido = bruto). Ao editar o total (ou quantidade/valor por cota) sem informar a taxa, ela é reescalada na mesma proporção. A API não informa se o JCP já vem com o IR descontado, então o JCP é bruto até você informar a retenção.
- **Resumo** (`GET /dividends/summary?year=`): só conta proventos com `paymentDate <= hoje`, em **BRL** sobre o **líquido** (`(amount − taxAmount) × exchangeRate`). Retorna `totalYear`, `totalCurrentMonth`, `monthlyAverage` (ano corrente: dividido pelos meses decorridos; anos passados: por 12), `byMonth`, `last12Months`, `byCategoryType` (Ações BR / FIIs / Stocks US…), `byCategory` e `byAsset` com **Yield on Cost** (proventos líquidos **por cota** dos últimos 12 meses ÷ preço médio atual, na moeda do ativo; cada linha usa a própria `quantity`, então aportes e vendas não distorcem o indicador; sem `quantity` usa `rateAmount`). Proventos futuros aparecem em `GET /dividends/upcoming`.
- **Sync automático:** `adapters/schedules/sync-dividends.cron.ts` (domingo 08:00, America/Sao_Paulo) enfileira um job por ticker + tipo na fila `dividend-processing`; o `SyncDividendsProcessor` chama `SyncAssetDividendsUseCase`, que busca via `DividendDataGateway` (Yahoo Finance `chart?events=div` para `VARIABLE_BR`/`FII`, pois o dividendo da Brapi exige plano pago, e o Yahoo só traz a data EX, usada como COM e pagamento, e não distingue JCP; tickers `*11` viram `INCOME`; Polygon/Massive `/stocks/v1/dividends` para `VARIABLE_US`) e grava com `source = SYNC`. Regras: só entra provento cuja data COM (ou de pagamento) é posterior ao cadastro do ativo; lançamentos `MANUAL` nunca são sobrescritos (editar um provento sincronizado o torna `MANUAL`); pagamentos já realizados não são recalculados; em USD usa o câmbio do budget do mês do pagamento (ou do mês com câmbio registrado mais próximo) e ignora o ativo se a categoria não tiver nenhum. A quantidade usada é a atual do ativo (o sistema não guarda histórico de posição).
- **Backfill:** `POST /dividends/backfill` (body opcional `{ months }`, 1–24, padrão 12) enfileira os mesmos jobs do sync, só para os ativos ativos do usuário da sessão, com `since` no payload. Em modo `since` o filtro por data de cadastro é ignorado e entra todo pagamento a partir da data. Continua idempotente e sem sobrescrever lançamentos `MANUAL`. O ativo é marcado com `assets.dividendsImportedAt` quando o backfill roda com sucesso (inclusive se o ticker não tem proventos), e o backfill pula ativos já marcados; falha do provider (`fetchDividends` devolve `null`) não marca. Trocar o ticker limpa a marca. O sync semanal não usa nem altera a marca. Como usa a quantidade atual, meses anteriores a aportes ficam superestimados e meses anteriores à compra podem entrar: o usuário corrige editando a quantidade (o total é recalculado pelo valor por cota) ou excluindo. A montagem dos jobs (dedup por ticker + tipo e delays por provider) está em `adapters/build-sync-jobs.ts`, compartilhada com o cron. Resposta: `{ message, enqueued }`.

### Operações (`modules/transactions`)

- **Posição calculada:** `domain/position.ts` (`buildPosition`, função pura) refaz as operações do ativo em ordem e chega à quantidade e ao preço médio pelo **custo médio ponderado** (regra da Receita): taxas de compra entram no custo; a venda baixa o custo pelo preço médio e gera o resultado realizado (`venda líquida − PM × quantidade`). Desdobramento multiplica e grupamento divide a quantidade sem mudar o custo total; bonificação soma quantidade com o custo atribuído. No mesmo dia: saldo inicial, depois eventos, compras e vendas. Venda maior que a posição, ou operação antes do saldo inicial, responde 400 (e editar/excluir que levaria a isso também).
- **Ativo:** cada criação, edição ou exclusão recalcula a posição e grava `quantity`/`averagePrice` no ativo (`Asset.applyPosition`). `Asset.hasTransactions` vem da contagem de operações (não é coluna) e, com ela, o `PATCH /assets/:id` ignora quantidade e preço médio. Sem operações (todas excluídas), o ativo mantém a última posição e volta a ser editável.
- **Saldo inicial:** na primeira operação de um ativo que já tem quantidade, a posição atual vira uma operação `OPENING` na véspera da operação (com o `averagePrice`, ou a cotação se não houver), e a resposta traz `openingCreated: true`. Registre só o que ainda não está nessa posição; o histórico anterior entra pela importação (fase 2).
- **Regras por categoria** (`domain/transaction-rules.ts`): renda fixa ainda não aceita operações (precisa de lotes por aplicação); compra e venda fora de BRL exigem `exchangeRate`; em BRL ele é descartado.
- **Listagem:** `GET /transactions` devolve `{ transaction, asset, category, result }`, da mais recente para a mais antiga; `result` é o lucro/prejuízo de cada venda, calculado sobre todo o histórico do ativo mesmo com filtro de data.
- **Aporte do mês:** `GET /transactions/contributions?year=&month=` soma por categoria compras (com taxas) menos vendas (sem taxas), em R$ pelo `exchangeRate` de cada operação. Saldo inicial e eventos não contam. O fechamento do mês na web usa esse valor como sugestão do aporte (que aceita valor negativo, para resgates).

### Rentabilidade e Benchmarks (`modules/performance`)

- **Cálculo** (`domain/performance-calculator.ts`, funções puras): retorno mensal da carteira consolidada por **Modified Dietz**: `(V_fim − V_início − aporte + proventos) / (V_início + aporte/2)`. `aporte` vem de `AssetRecord.contributionAmount` e `proventos` de `dividendAmount` (ambos em R$; o `amount` já é convertido). Só entram pares de meses consecutivos; se uma categoria do mês anterior não tem registro no mês, o par é descartado; categoria que aparece pela primeira vez entra inteira como aporte. Retornos são encadeados em série acumulada (com ponto base 0% no mês anterior ao primeiro retorno).
- **Escopo** (`scope`): filtra as categorias antes do cálculo. `all` (padrão) usa todas; `variable` usa Ações BR, FIIs, Ações US e Cripto; `fixed` usa só Renda Fixa (`domain/performance-scope.ts`). Os benchmarks são os mesmos em qualquer escopo.
- **Resposta** de `GET /performance`: `series` (acumulado por mês: `portfolio`, `cdi`, `ibov`, `sp500`; benchmark sem dado num mês fica `null` dali em diante), `periods` (`ytd`, `12m`, `all`, com `alphaCdi/Ibov/Sp500` em pontos percentuais), `betaIbov` (só com 12 ou mais meses em comum) e `byCategory`.
- **Por categoria** (`byCategory`): uma linha por categoria do escopo (maior saldo primeiro), com `latestAmount`, o benchmark natural do tipo (`domain/category-benchmark.ts`: Ações BR → `IBOV`, FII → `IFIX`, Ações US → `SP500_BRL`, Cripto → `BTC_BRL`, Renda Fixa → `CDI`) e `periods` (`portfolio`, `benchmark`, `alpha`, `months`; `portfolio` é `null` sem meses no período). Cada categoria usa só os próprios registros, então um mês descartado na carteira consolidada (faltou outra categoria) continua valendo para ela. Os períodos de todas as categorias terminam no mesmo mês (o mais recente com retorno).
- **Retorno total por ativo** (`GET /performance/assets`, `domain/asset-total-return.ts`): para cada ativo do usuário (ativos e inativos), `unrealizedResult` (o mesmo lucro de preço do ativo), `realizedResult` (vendas, pelo `buildPosition`), `dividendsReceived` (líquidos, só os já pagos), `totalReturn` (soma dos três, na moeda da categoria) e `totalReturnPercentage` sobre `investedCapital`: o custo de todas as aquisições (saldo inicial, compras com taxas e bonificações) quando há operações, ou quantidade × preço médio sem elas, para o percentual não inflar depois de uma venda parcial. A web mostra o preço por padrão e soma o resto no modo "Com proventos" de `/assets`.
- **Benchmarks** (`BenchmarkDataGateway`, sem chave de API), todos de **retorno total**: CDI via BACEN SGS 4391 (acumulado no mês); Ibovespa (`^BVSP`, já reinveste os proventos), IFIX pelo ETF `XFIX11.SA` (não distribui rendimentos; o `IFIX.SA` do Yahoo não tem histórico) e S&P 500 Total Return (`^SP500TR`) via Yahoo mensal; bitcoin por `BTC-USD` (o Yahoo não tem `BTC-BRL`). Os cotados em dólar viram reais por `(1 + retorno USD) × (1 + variação de BRL=X) − 1`. Só meses fechados são gravados.
- **Sync:** `SyncBenchmarksUseCase.ensureCovered` completa os meses faltantes sob demanda na consulta (cooldown de 1h por benchmark quando o provider falha); `sync-benchmarks.cron.ts` reprocessa os últimos 3 meses nos dias 1 a 5 às 10:00 (America/Sao_Paulo).

### Renda Fixa Automática (`assets` + `modules/indicators`)

- **Cadastro:** um ativo de categoria `FIXED` pode ter `indexer` (`CDI`|`IPCA`|`PRE`), `indexerRate` (CDI: % do CDI, 110 = 110%; IPCA: taxa real ao ano; PRE: taxa ao ano), `investedAt` e `maturityAt` (opcional), datas `AAAA-MM-DD`. Com indexador, `investedAt`, a taxa e o `averagePrice` são obrigatórios. CDI e IPCA só em categoria BRL; indexador fora de renda fixa responde 400. `indexer: null` volta ao saldo manual.
- **Saldo:** `currentClosePrice = averagePrice × fator` (bruto de IR), calculado em `domain/fixed-income-valuation.ts`: CDI = `Π(1 + CDI_dia × %)`; PRE = `(1 + taxa)^(du/252)`; IPCA+ = IPCA acumulado pro rata por dias corridos (mês não divulgado usa o último IPCA como projeção) × `(1 + taxa)^(du/252)`. Os dias úteis são as datas da série do CDI (o BCB só publica em dia útil), sem tabela de feriados; o dia do cálculo não entra (o CDI dele sai no dia útil seguinte). Depois do vencimento o saldo para de render. Com indexador, o preço manual do `PATCH` é ignorado. Sem cobertura de CDI/IPCA no período, o saldo anterior é mantido.
- **Quando recalcula:** ao criar e ao editar o ativo (`RevalueFixedIncomeUseCase.tryExecute`, falha só vai para o log) e no `revalue-fixed-income.cron.ts`, de terça a sábado às 10:00 (America/Sao_Paulo), para todos os títulos indexados ativos.
- **Indicadores** (`modules/indicators`): cache global em `indicator_rates` do CDI diário (SGS 12) e do IPCA mensal (SGS 433). `SyncIndicatorRatesUseCase.ensureCovered(since)` busca só o que falta, um ano por vez (o SGS falha em intervalos longos): para trás do mais novo ao mais antigo e para frente do mais antigo ao mais novo, para a série gravada nunca ter buracos. Busca de dado novo tem cooldown de 6h; intervalo sem dado (`{ erro: 404 }`) é tratado como vazio, não como falha.

### Armazenamento de Arquivos (Cloudflare R2)

O `R2StorageService` (`src/infra/storage`) é responsável pelo upload de arquivos (ex: avatar do usuário) para o bucket Cloudflare R2, retornando a URL pública do objeto armazenado.

---

## 7. Core (`src/core`)

```
core/
├── domain/
│   ├── errors/    # PayloadError e NotFoundError (base dos erros "não encontrado")
│   ├── events/    # Interface DomainEventPublisher + AssetEvent
│   ├── queue/     # Interface DomainJobPublisher + constantes de filas (QUEUES, JOBS)
│   └── storage/   # Interface DomainStorage + constantes de buckets/pastas
├── http/          # Contratos de cotação de mercado (MarketDataGateway/Provider)
└── utils/         # Either, Optional, omitUndefined, sortByMonthChange/calcMonthChange
```

---

## 8. Funcionalidades Principais

| Funcionalidade | Descrição |
|---|---|
| **Dashboard de Patrimônio** | Visualização da alocação de recursos por categoria com totais consolidados. |
| **Gestão de Categorias** | CRUD de categorias com suporte a múltiplas moedas (BRL/USD) e tipos de ativos. |
| **Gestão de Ativos** | CRUD de ativos individuais com ticker, preço médio e quantidade. |
| **Lista de Desejos (Wishlist)**| Monitoramento de ativos em radar com preço alvo, cotação atual e notas. |
| **Sincronização Automática** | Cron Jobs diários que buscam cotações em Brapi, CoinGecko e Alpha Vantage via BullMQ. |
| **Atualização ao Criar Ativo** | Evento `asset.created` dispara busca imediata do preço de mercado (currentClosePrice + lastMonthClosePrice). |
| **Histórico Mensal (Budget)** | Registro do valor consolidado de uma categoria por mês/ano com suporte a taxa de câmbio e dividendos. |
| **Filtro por Competência** | Consulta eficiente dos anos com registros via `AssetCategoryCompetence`. |
| **Gestão de Usuário** | Consulta de usuários e upload/download de avatar no Cloudflare R2. |
| **Autenticação Segura** | Better Auth (OAuth Google, verificação de e-mail, sessões). A API valida o token da sessão em todas as rotas e isola os dados por usuário. |
| **Proventos** | Registro e sincronização de dividendos/JCP/rendimentos por ativo, com resumos por mês, ano e classe (Ações BR, FIIs, Stocks US) e Yield on Cost. |
| **Sistema de Notificações** | Integração com n8n para alertas de fechamento de mês e segurança de conta. |

---

## 9. Fluxo de Operação Interna

1. O usuário cria uma **categoria** e seus respectivos **ativos** (`POST /assets` com o `categoryId`).
2. Ao criar um ativo com ticker, o sistema dispara um evento que busca o preço atual imediatamente.
3. Todo dia útil, o Cron Job enfileira jobs no BullMQ para atualizar os preços de mercado de todos os ativos em background.
4. No fechamento do mês, o usuário registra o valor total consolidado da categoria (**Budget/AssetRecord**) para manter o histórico de longo prazo.
5. A API fornece dados processados que permitem ao frontend exibir indicadores de lucro/prejuízo, rentabilidade MTD e gráficos de alocação.

---

## 10. Estrutura do Monorepo & Scripts (`package.json`)

O projeto adota uma arquitetura monorepo gerenciada via **pnpm workspaces** (`pnpm-workspace.yaml`), integrando a API backend (`apps/service`), o frontend Next.js (`apps/web`) e bibliotecas compartilhadas versionadas via Git Submodule (`packages/lib-db`).

### Estrutura de Pacotes

```
finance-assets/
├── apps/
│   ├── service/              # API NestJS principal (package: "api", porta 3333)
│   └── web/                  # Frontend Next.js 16 (package: "web", porta 3000)
├── packages/
│   ├── config/               # Configurações compartilhadas Biome/TS (@finance-assets-web/config)
│   ├── env/                  # Schemas de variáveis de ambiente (@finance-assets-web/env)
│   ├── lib-db/               # Submódulo Git compartilhado (package: "@lib/db", Prisma ORM)
│   └── lib-ui/               # Submódulo Git compartilhado (package: "@lib/ui", design system + shadcn)
├── package.json              # Configurações e scripts orquestradores da raiz
├── pnpm-workspace.yaml       # Configuração de workspaces e permissões de build
├── scripts/check-version.mjs # Script de auditoria e validação de dependências do workspace
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
| `check-versions` | `node scripts/check-version.mjs` | Executa o validador de integridade e consistência de versões no monorepo e submódulos. |

Testes da API (Vitest, detalhes em `TESTING.md`):

| Comando | Descrição |
|---|---|
| `pnpm --filter api test` | Testes unitários (`src/**/*.spec.ts`). |
| `pnpm --filter api test:e2e` | Testes E2E (`test/**/*.e2e-spec.ts`). |
| `pnpm --filter api test:cov` | Cobertura. |

---

## 11. Auditoria e Consistência de Versões (`scripts/check-version.mjs`)

O arquivo `scripts/check-version.mjs` (executado via `pnpm check-versions`) é uma ferramenta interna de governança para auditoria estática e prevenção de conflitos de dependências entre projetos do workspace e submódulos Git.

### Capacidades e Funcionamento do `scripts/check-version.mjs`:

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