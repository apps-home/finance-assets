# 🚀 Escalando o Finance Assets API

> Ideias práticas para evoluir o sistema de controle de patrimônio e praticar conceitos modernos de backend.

## Contexto atual

O sistema já possui uma base sólida com:

| O que já existe | Tecnologia |
|---|---|
| Cron diário de atualização de preços | `@nestjs/schedule` |
| Fila de jobs por ativo | `BullMQ` + Redis |
| Domain Events | `EventEmitter2` |
| Storage de arquivos | Cloudflare R2 |
| Auth | `better-auth` |
| DB relacional | PostgreSQL + Prisma |
| Categorias, Ativos, Competências, Orçamentos | Módulos NestJS com Clean Arch |

---

## 💡 Ideias por área

---

### 1. 📊 Snapshot Histórico de Patrimônio (Cron + Event + Queue + Redis)

**O que é:** Ao invés de só guardar o preço atual do ativo, criar um snapshot do **patrimônio total** (somatório de todos os ativos do usuário com seus preços) ao final de cada dia — gerando uma série histórica do crescimento do portfólio.

**Por que faz sentido no teu sistema:**
O `currentClosePrice` é sobrescrito a cada run do cron. Você perde o histórico de evolução do seu patrimônio. Com snapshots diários, você consegue ver gráficos como "meu patrimônio passou de R$50k para R$120k em 18 meses".

**Fluxo:**
```
Cron diário (20h) → publica job "SNAPSHOT_PATRIMONY" por userId → 
Processor agrega todos ativos × preço × quantidade → 
Salva em tabela `PatrimonySnapshot` (userId, date, totalBRL, totalUSD) →
Publica evento `PatrimonySnapshotCreated` →
Listener invalida cache Redis do dashboard
```

**Tabela nova no schema:**
```prisma
model PatrimonySnapshot {
  id        String   @id @default(uuid())
  userId    String
  date      DateTime @db.Date
  totalBrl  Decimal  @db.Decimal(15, 2)
  totalUsd  Decimal? @db.Decimal(15, 2)
  createdAt DateTime @default(now())

  @@unique([userId, date])
  @@schema("finance-assets")
}
```

**Tecnologias praticadas:** `Cron`, `Queue (BullMQ)`, `Domain Events`, `Redis Cache`, novo `Processor`

---

### 2. ⚡ Cache Redis para o Dashboard (Redis + Cache Invalidation)

**O que é:** O endpoint de resumo do dashboard (totais por categoria, variação mensal, etc.) provavelmente faz queries pesadas no banco. Adicionar uma camada de **cache Redis** com tempo de expiração e invalidação por evento.

**Por que faz sentido:**
As categorias e ativos raramente mudam. Mas o preço muda 1x/dia. Cachear por `userId` com TTL de 1h é trivial, porém o padrão real é: **invalidar quando o evento certo ocorre**.

**Padrão a implementar:**

```typescript
// cache.service.ts — wrapper tipado sobre ioredis
async getOrSet<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T>
async invalidate(key: string): Promise<void>
async invalidatePattern(pattern: string): Promise<void>

// Chaves sugeridas
const CACHE_KEYS = {
  dashboard: (userId: string) => `dashboard:${userId}`,
  categoryTotals: (userId: string) => `category-totals:${userId}`,
}
```

**Onde ligar no teu código:**
- `AssetPriceUpdated` event → `listener` invalida `dashboard:${userId}` 
- `AssetCreated/Updated/Deleted` → invalida todas as chaves do user
- Controller do dashboard → `cache.getOrSet(...)`

**Tecnologias praticadas:** `ioredis`, cache patterns, invalidação por evento

---

### 3. 📬 Notificações por Email com Queue + Template (Queue + Storage)

**O que é:** Enviar um email semanal (toda segunda-feira) com o resumo do portfólio do usuário: variação da semana, destaque do ativo que mais subiu/caiu, e comparativo com mês anterior.

**Fluxo:**
```
Cron toda segunda 8h → job "WEEKLY_REPORT" por userId →
Processor agrega dados → renderiza template HTML (Handlebars/React Email) →
Opção A: envia via Resend/SendGrid
Opção B: salva PDF no R2 e envia link por email
```

**Detalhe de aprendizado — Dead Letter Queue (DLQ):**
Um email que falhou não pode travar a fila. Configurar `BullMQ` com DLQ separada para falhas de envio:

```typescript
// queue.constants.ts
export const QUEUES = {
  ASSET_PRICE_UPDATE: 'asset-price-update',
  WEEKLY_REPORT: 'weekly-report',
  WEEKLY_REPORT_DLQ: 'weekly-report-dlq',  // 👈 novo
}
```

**Tecnologias praticadas:** `BullMQ` avançado (DLQ, priority jobs), email service, template rendering

---

### 4. 🔔 Alertas de Variação de Preço (Events + WebSocket + Queue)

**O que é:** Quando o job de atualização de preço detecta uma variação acima de X% (ex: ativo caiu mais de 5% no dia), emitir um **alerta** para o usuário.

**Por que é interessante:**
Força você a enriquecer o `Domain Event` com contexto:

```typescript
// AssetPriceUpdated event — hoje você não tem isso!
interface AssetPriceUpdatedPayload {
  assetId: string
  userId: string
  ticker: string
  previousPrice: number
  currentPrice: number
  changePercent: number  // 👈
  isSignificantChange: boolean  // 👈 > 3%?
}
```

**Fluxo:**
```
Processor atualiza preço → calcula variação →
Publica AssetPriceUpdated com changePercent →
Listener: if isSignificantChange → enfileira job PRICE_ALERT →
Processor PRICE_ALERT: WebSocket broadcast para o userId OU envia push/email
```

**Tecnologias praticadas:** `WebSocket (Socket.io)`, payload enriquecido em events, conditional job publishing

---

### 5. 🤖 Automação com n8n — Importação de Extratos (n8n + S3/R2 + Queue)

**O que é:** Criar um workflow no **n8n** que:
1. Recebe um webhook com um arquivo CSV de corretora (XP, Rico, B3)
2. Faz parse do extrato
3. Chama a API para criar/atualizar ativos automaticamente

**Webhook na API:**
```http
POST /webhooks/import-statement
Content-Type: multipart/form-data
Authorization: Bearer <api-key>
```

**Fluxo n8n:**
```
Trigger (nova planilha no Google Drive ou Upload Manual) →
Parse CSV/XLSX →
Loop por linha →
HTTP Request → POST /webhooks/import-statement →
Resposta com status por ativo importado
```

**Detalhe de segurança a implementar:** API Keys para webhooks (diferente da auth de usuário). Praticar `Guard` customizado no NestJS:

```typescript
@Injectable()
export class WebhookApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const apiKey = request.headers['x-api-key']
    return this.validateApiKey(apiKey)
  }
}
```

**Tecnologias praticadas:** `n8n`, `Webhook Guard`, CSV parsing, file upload + R2 storage, idempotência

---

### 6. 📈 Histórico de Preços por Ativo (Série Temporal + Cron)

**O que é:** Ao invés de sobrescrever `currentClosePrice`, persistir o **histórico de preços diários** de cada ativo numa tabela separada.

```prisma
model AssetPriceHistory {
  id        String   @id @default(uuid())
  assetId   String
  date      DateTime @db.Date
  price     Decimal  @db.Decimal(15, 4)
  source    String   // "brapi", "yahoo", "manual"
  createdAt DateTime @default(now())

  asset Asset @relation(...)

  @@unique([assetId, date])
  @@schema("finance-assets")
}
```

**Por que é valioso:**
- Habilita gráficos de evolução por ativo individual
- Permite calcular rentabilidade (CAGR, variação YTD, variação 12m)
- Permite retrospectiva: "onde PETR4 estava em Jan/2024?"

**Tecnologias praticadas:** Schema evolution, queries de séries temporais com Prisma, agregações com `GROUP BY` e janelas de tempo

---

### 7. 🔄 Sincronização de Taxa de Câmbio (Cron + Cache + External API)

**O que é:** O schema já tem `exchangeRate` no `AssetRecord`. Automatizar a busca da taxa BRL/USD diariamente e usar um **cache Redis** para servir a taxa atual sem chamar a API externa a cada request.

**Fluxo:**
```
Cron diário 6h → busca USD/BRL na API (AwesomeAPI ou Open Exchange) →
Armazena no Redis com TTL 24h → 
Ao calcular total do portfólio, usa taxa cacheada
```

**Padrão de cache com fallback:**
```typescript
async getExchangeRate(from: string, to: string): Promise<number> {
  const cached = await this.redis.get(`exchange:${from}:${to}`)
  if (cached) return parseFloat(cached)
  
  const rate = await this.externalApi.fetchRate(from, to)
  await this.redis.setex(`exchange:${from}:${to}`, 86400, rate.toString())
  return rate
}
```

**Tecnologias praticadas:** `ioredis`, external HTTP client (Axios/fetch), cache-aside pattern, cron

---

### 8. 📁 Export de Relatório Mensal em PDF (Storage + Queue + Cron)

**O que é:** No fim de cada mês, gerar um PDF com o extrato do patrimônio (cada categoria, valor, variação) e salvar no Cloudflare R2. O usuário pode baixar pelo app.

**Fluxo:**
```
Cron último dia do mês 23h →
Job "MONTHLY_REPORT_PDF" por userId →
Processor: agrega dados do mês →
Gera PDF (puppeteer headless ou @react-pdf/renderer) →
Faz upload para R2 com path `reports/{userId}/{year}-{month}.pdf` →
Salva URL signed no banco →
Evento MonthlyReportGenerated → email com link para download
```

**Tecnologias praticadas:** `Storages (R2)`, PDF generation, Signed URLs, Cron com expressão customizada

---

### 9. 🧹 Limpeza de Dados Antigos (Cron + Soft Delete)

**O que é:** Implementar **soft delete** nos ativos e categorias, com um cron que limpa registros deletados há mais de 30 dias (hard delete).

**O que aprender:**
- Soft delete pattern: adicionar `deletedAt DateTime?` nos modelos
- Prisma middleware que filtra `deletedAt IS NULL` automaticamente
- Cron de limpeza com batch delete (importante para não travar o banco com uma query gigante)

```typescript
// cleanup.cron.ts
@Cron(CronExpression.EVERY_DAY_AT_3AM)
async cleanupSoftDeleted() {
  // deleta em batches de 100 para não travar o banco
  let deleted = 0
  do {
    const { count } = await this.prisma.asset.deleteMany({
      where: {
        deletedAt: { lte: subDays(new Date(), 30) },
      },
      take: 100  // batch
    })
    deleted = count
  } while (deleted > 0)
}
```

**Tecnologias praticadas:** Soft delete, Prisma middleware, batch operations, cleanup jobs

---

### 10. 🎯 Meta de Alocação por Categoria (Domínio + Events)

**O que é:** Permitir que o usuário defina uma **meta de % de alocação** por categoria (ex: "quero 30% em FIIs, 40% em Ações BR, 20% em Renda Fixa, 10% em Ações US"). O sistema calcula se está desequilibrado.

**Por que enriquece o domínio:**
Adiciona regra de negócio real ao sistema. Quando o patrimônio é atualizado, calcular o rebalanceamento necessário.

```typescript
// category.entity.ts — adicionar
interface AssetCategoryProps {
  // ...existente...
  targetAllocationPercent: number | null  // 0-100
}

// novo: calcular desvio de alocação
calculateAllocationDeviation(totalPortfolio: number): number {
  const currentAllocation = (this.totalValue / totalPortfolio) * 100
  return currentAllocation - (this.targetAllocationPercent ?? 0)
}
```

**Evento disparado:**
```typescript
// Quando PatrimonySnapshot é criado, calcular rebalanceamento
// e emitir PortfolioRebalanceNeeded se desvio > threshold
```

**Tecnologias praticadas:** Enriquecimento do domínio, regras de negócio na entidade, Domain Events condicionais

---

### 11. 🗃️ Views SQL para Dashboard de Patrimônio (SQL + Prisma Raw)

**O que é:** Criar **views materializadas no PostgreSQL** que pré-calculam dados agregados do portfólio: total por categoria, % de alocação, variação de preço. O controller consulta a view ao invés de agregar no código TypeScript.

**Por que faz sentido no teu sistema:**
Hoje qualquer cálculo de "total do patrimônio" precisa fazer N queries + agregar no JS. Uma view SQL faz isso numa query só, direto no banco, com performance muito superior. Além disso, views cross-schema (`better-auth.user` ↔ `finance-assets.asset_categories`) são um pattern real em produção.

**Views a criar:**

```sql
-- Total por categoria para cada usuário
CREATE VIEW "finance-assets".vw_portfolio_summary AS
SELECT
  u.id AS user_id,
  u.name AS user_name,
  ac.id AS category_id,
  ac.name AS category_name,
  ac.currency,
  ac.type AS category_type,
  COUNT(a.id) AS asset_count,
  COALESCE(SUM(ar.amount), 0) AS total_invested,
  COALESCE(SUM(a."currentClosePrice"), 0) AS total_current_value
FROM "better-auth".user u
JOIN "finance-assets".asset_categories ac ON ac."userId" = u.id
LEFT JOIN "finance-assets".assets a ON a."categoryId" = ac.id
LEFT JOIN "finance-assets".asset_records ar ON ar."categoryId" = ac.id
GROUP BY u.id, u.name, ac.id, ac.name, ac.currency, ac.type;

-- Variação de preço por ativo (close atual vs mês anterior)
CREATE VIEW "finance-assets".vw_asset_performance AS
SELECT
  a.id AS asset_id,
  a.name,
  a.ticker,
  a."currentClosePrice",
  a."lastMonthClosePrice",
  CASE
    WHEN a."lastMonthClosePrice" IS NOT NULL AND a."lastMonthClosePrice" > 0
    THEN ROUND(((a."currentClosePrice" - a."lastMonthClosePrice") / a."lastMonthClosePrice") * 100, 2)
    ELSE NULL
  END AS variation_percent
FROM "finance-assets".assets a;
```

**Como integrar com Prisma:**
```typescript
// portfolio-view.repository.ts
async getPortfolioSummary(userId: string) {
  return this.prisma.$queryRaw`
    SELECT * FROM "finance-assets".vw_portfolio_summary
    WHERE user_id = ${userId}
  `
}
```

**Tecnologias praticadas:** `CREATE VIEW`, `$queryRaw`, SQL agregações, `COALESCE`, `JOIN` cross-schema, migrations com SQL custom

---

### 12. ⚙️ Functions e Procedures SQL (PL/pgSQL + Prisma Raw)

**O que é:** Extrair lógicas de cálculo para **PL/pgSQL functions e procedures** no PostgreSQL. Ao invés de calcular patrimônio total no TypeScript, chamar `SELECT fn_calculate_patrimony('user-id')`. Ao invés de agregar snapshot no processor, chamar `CALL sp_snapshot_patrimony('user-id')`.

**Por que faz sentido:**
O cálculo de patrimônio envolve JOINs entre `asset_categories`, `assets`, `asset_records` e aplicação de exchange rate. Fazer isso em SQL é mais eficiente e atômico (uma transação, sem round-trips), e é exatamente o que se faz em produção com bancos grandes.

**Functions a criar:**

```sql
-- Calcula patrimônio total de um usuário, aplicando exchange rate quando necessário
CREATE OR REPLACE FUNCTION "finance-assets".fn_calculate_patrimony(p_user_id TEXT)
RETURNS TABLE(total_brl NUMERIC, total_usd NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(
      CASE WHEN ac.currency = 'BRL' THEN ar.amount
           ELSE ar.amount * COALESCE(ar."exchangeRate", 1)
      END
    ), 0) AS total_brl,
    COALESCE(SUM(
      CASE WHEN ac.currency = 'USD' THEN ar.amount
           ELSE ar.amount / NULLIF(COALESCE(ar."exchangeRate", 1), 0)
      END
    ), 0) AS total_usd
  FROM "finance-assets".asset_records ar
  JOIN "finance-assets".asset_categories ac ON ac.id = ar."categoryId"
  WHERE ac."userId" = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Procedure que gera snapshot e insere na tabela
CREATE OR REPLACE PROCEDURE "finance-assets".sp_snapshot_patrimony(p_user_id TEXT)
LANGUAGE plpgsql AS $$
DECLARE
  v_total_brl NUMERIC;
  v_total_usd NUMERIC;
BEGIN
  SELECT total_brl, total_usd INTO v_total_brl, v_total_usd
  FROM "finance-assets".fn_calculate_patrimony(p_user_id);

  INSERT INTO "finance-assets"."PatrimonySnapshot" (id, "userId", date, "totalBrl", "totalUsd", "createdAt")
  VALUES (gen_random_uuid(), p_user_id, CURRENT_DATE, v_total_brl, v_total_usd, NOW())
  ON CONFLICT ("userId", date) DO UPDATE
  SET "totalBrl" = EXCLUDED."totalBrl", "totalUsd" = EXCLUDED."totalUsd";
END;
$$;
```

**Como integrar:**
```typescript
// No processor
await this.prisma.$executeRaw`CALL "finance-assets".sp_snapshot_patrimony(${userId})`

// No use case de allocation
const result = await this.prisma.$queryRaw`
  SELECT * FROM "finance-assets".fn_portfolio_allocation(${userId})
`
```

**Tecnologias praticadas:** `CREATE FUNCTION`, `CREATE PROCEDURE`, PL/pgSQL, `$executeRaw`, `$queryRaw`, transações no banco, `ON CONFLICT`

---

### 13. 🔌 WebSocket — Dashboard Real-Time (Socket.io + NestJS Gateway)

**O que é:** Criar um **gateway WebSocket** que permite ao frontend receber atualizações em tempo real quando preços são atualizados, snapshots são gerados, ou desvios de alocação são detectados — sem precisar fazer polling.

**Por que faz sentido:**
Hoje o cron atualiza preços e o frontend só vê quando recarrega. Com WebSocket, ao atualizar PETR4, o dashboard atualiza sozinho. Isso é a base para qualquer dashboard financeiro real-time.

**Arquitetura:**
```
Frontend conecta via socket.io → 
  PortfolioGateway valida token → 
  Entra na room `user:{userId}` →

Cron roda → Processor atualiza preço → 
  Publica AssetPriceUpdated (EventEmitter2) →
  PortfolioWsListener captura evento →
  Emite `portfolio:price-updated` para a room do userId
```

**Código do Gateway:**
```typescript
@WebSocketGateway({ namespace: '/portfolio', cors: true })
export class PortfolioGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token
    const session = await this.authService.validateSession(token)
    
    if (!session) {
      client.disconnect()
      return
    }

    client.join(`user:${session.userId}`)
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data)
  }
}
```

**Eventos WS emitidos:**
| Evento | Trigger | Payload |
|---|---|---|
| `portfolio:price-updated` | `AssetPriceUpdated` | `{ assetId, ticker, price, changePercent }` |
| `portfolio:snapshot` | `PatrimonySnapshotCreated` | `{ totalBrl, totalUsd, date }` |
| `portfolio:allocation-drift` | Rebalance check | `{ categoryId, currentPercent, targetPercent, drift }` |

**Tecnologias praticadas:** `@nestjs/websockets`, `socket.io`, rooms, guards em WS, event-driven real-time, autenticação em WS

---

### 14. 📤 Export CSV Streaming (Transform Streams + StreamableFile)

**O que é:** Criar endpoints de **export de dados em CSV** usando Node.js Transform streams. O CSV é gerado on-the-fly, sem carregar todos os dados em memória — ideal para exports grandes (milhares de registros de orçamento/ativos).

**Por que faz sentido:**
Hoje, se quiser exportar todos os asset records para uma planilha, precisaria carregar tudo em memória, converter em string, e mandar. Com streams, o CSV é gerado e enviado ao cliente chunk-by-chunk. Isso é essencial para dados financeiros que crescem com o tempo.

**Transform Stream:**
```typescript
import { Transform, TransformCallback } from 'node:stream'

export class CsvStreamTransform extends Transform {
  private headerSent = false
  private columns: string[]

  constructor(columns: string[]) {
    super({ objectMode: true }) // recebe objetos, emite strings
    this.columns = columns
  }

  _transform(row: Record<string, unknown>, _enc: string, cb: TransformCallback) {
    if (!this.headerSent) {
      this.push(this.columns.join(',') + '\n')
      this.headerSent = true
    }

    const line = this.columns
      .map(col => {
        const val = row[col]
        // escape strings com vírgula
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val ?? '')
      })
      .join(',')
    
    this.push(line + '\n')
    cb()
  }
}
```

**Endpoint no controller:**
```typescript
@Get('export/csv')
async exportCsv(@Query() filters: ExportFiltersDto): Promise<StreamableFile> {
  const stream = await this.exportAssetsUseCase.execute(filters)
  
  return new StreamableFile(stream, {
    type: 'text/csv',
    disposition: 'attachment; filename="assets-export.csv"'
  })
}
```

**Cursor-based iteration no repository:**
```typescript
async *streamAll(userId: string): AsyncGenerator<AssetRecord> {
  let cursor: string | undefined
  const batchSize = 200
  
  while (true) {
    const batch = await this.prisma.assetRecord.findMany({
      where: { category: { userId } },
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' }
    })
    
    if (batch.length === 0) break
    for (const record of batch) yield record
    cursor = batch[batch.length - 1].id
  }
}
```

**Tecnologias praticadas:** `Transform stream`, `StreamableFile`, `AsyncGenerator`, cursor-based pagination, backpressure, `Content-Disposition`

---

### 15. 📥 Importação Bulk via Stream (Upload CSV + Pipeline)

**O que é:** Criar um endpoint que recebe um **CSV grande via upload** e processa linha-a-linha usando Node.js streams, sem buffered o arquivo inteiro em memória. Cada batch de linhas válidas é inserido no banco, e o resultado é retornado como **NDJSON streaming** (cada linha do response indica sucesso ou erro da importação).

**Por que faz sentido:**
Complementa o export e dá uma alternativa ao n8n para bulk imports. Imagina importar 5000 registros de uma planilha da Rico/XP: o stream processa e responde progressivamente, sem timeout e sem estouro de memória.

**Pipeline completo:**
```
Request body (CSV bytes)
  → CsvParserStream (Transform: bytes → objetos parsed)
    → BatchAccumulator (Transform: acumula 100 objetos)
      → PrismaInserter (Writable: faz createMany por batch)
        → ImportResultStream (Transform: emite resultado NDJSON)
          → Response body (NDJSON streamed)
```

**CsvParserStream:**
```typescript
import { Transform, TransformCallback } from 'node:stream'

export class CsvParserStream extends Transform {
  private buffer = ''
  private headers: string[] = []

  constructor() {
    super({ readableObjectMode: true }) // emite objetos
  }

  _transform(chunk: Buffer, _enc: string, cb: TransformCallback) {
    this.buffer += chunk.toString()
    const lines = this.buffer.split('\n')
    this.buffer = lines.pop() || '' // última linha pode estar incompleta

    for (const line of lines) {
      if (line.trim() === '') continue

      if (this.headers.length === 0) {
        this.headers = line.split(',').map(h => h.trim())
        continue
      }

      const values = line.split(',')
      const obj: Record<string, string> = {}
      this.headers.forEach((h, i) => { obj[h] = values[i]?.trim() || '' })
      this.push(obj)
    }
    cb()
  }

  _flush(cb: TransformCallback) {
    if (this.buffer.trim()) {
      const values = this.buffer.split(',')
      const obj: Record<string, string> = {}
      this.headers.forEach((h, i) => { obj[h] = values[i]?.trim() || '' })
      this.push(obj)
    }
    cb()
  }
}
```

**Resposta NDJSON (streaming):**
```
HTTP/1.1 200 OK
Content-Type: application/x-ndjson
Transfer-Encoding: chunked

{"line":1,"status":"ok","assetId":"abc-123"}
{"line":2,"status":"ok","assetId":"def-456"}
{"line":3,"status":"error","reason":"Invalid ticker format"}
{"line":4,"status":"ok","assetId":"ghi-789"}
...
```

**Backpressure:**
```typescript
// Pausa a leitura do CSV quando o batch de insert está em andamento
import { pipeline } from 'node:stream/promises'

await pipeline(
  request,          // Readable (request body)
  csvParser,        // Transform (bytes → objects)
  batchAccumulator, // Transform (objects → batches de 100)
  prismaInserter,   // Transform (batch → insertResult)
  resultFormatter,  // Transform (result → NDJSON)
  response          // Writable (response body)
)
```

**Tecnologias praticadas:** `Transform stream`, `pipeline()`, NDJSON, backpressure, `createMany` batch, streaming response, memory-efficient file processing

---

## 📋 Prioridade sugerida

| # | Feature | Complexidade | Conceitos novos |
|---|---------|-------------|-----------------|
| 1 | **Cache Redis (dashboard)** | Baixa | Redis, cache-aside, invalidação por evento |
| 2 | **Histórico de preços** | Baixa-Média | Schema evolution, séries temporais |
| 3 | **Snapshot diário de patrimônio** | Média | Novo processor, agregação, evento |
| 4 | **Taxa de câmbio cacheada** | Média | Redis TTL, external API, fallback |
| 5 | **Alertas de variação** | Média | WebSocket, enriquecimento de eventos |
| 6 | **Relatório PDF mensal** | Alta | R2 storage, PDF gen, signed URLs |
| 7 | **Import via n8n** | Alta | n8n, webhook guard, idempotência |
| 8 | **Email semanal** | Média | DLQ, email service, templates |
| 9 | **Soft delete + cleanup** | Baixa | Prisma middleware, batch jobs |
| 10 | **Meta de alocação** | Média | DDD, regras de domínio |
| 11 | **Views SQL — Dashboard** | Média | SQL Views, `$queryRaw`, cross-schema JOINs |
| 12 | **Functions/Procedures SQL** | Média-Alta | PL/pgSQL, procedures, `$executeRaw` |
| 13 | **WebSocket Real-Time** | Média | Socket.io, rooms, WS guards, event-driven |
| 14 | **Export CSV Streaming** | Média | Transform streams, StreamableFile, cursors |
| 15 | **Import Bulk via Stream** | Alta | pipeline(), NDJSON, backpressure, batch insert |

---

## 🧱 Onde cada tecnologia entra

| Tecnologia | Features que praticam |
|---|---|
| **Redis** | Cache dashboard, câmbio, sessão de jobs, rate limiting |
| **BullMQ (avançado)** | DLQ, priority jobs, delayed jobs por userId |
| **Crons (novos)** | Snapshot diário, câmbio, PDF mensal, cleanup |
| **Domain Events** | Payload enriquecido, invalidação de cache, alertas, WS broadcast |
| **Storage (R2)** | PDF reports, extratos importados |
| **n8n** | Importação de corretora, notificações externas |
| **WebSocket** | Alertas real-time, dashboard live, ticker subscriptions |
| **Prisma middleware** | Soft delete global, auditoria |
| **SQL Views** | Dashboard agregado, portfolio summary, asset performance |
| **PL/pgSQL Functions** | Cálculo de patrimônio, variação de ativo, alocação |
| **PL/pgSQL Procedures** | Snapshot patrimonial atômico, batch operations |
| **Node.js Streams** | Export CSV, import bulk, pipeline, backpressure |
| **NDJSON** | Streaming response de import bulk, progressive results |

