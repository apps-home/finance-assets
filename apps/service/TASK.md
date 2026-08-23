# 📋 Finance Assets API — Roadmap de Tarefas

> Próximos passos para evoluir o sistema de controle de patrimônio praticando conceitos modernos de backend.

---

## 🟢 Fase 1 — Baixa complexidade (começar aqui)

### Cache Redis para o Dashboard
> **Conceitos:** `ioredis`, cache-aside pattern, invalidação por evento

- `[ ]` Instalar e configurar `ioredis` como módulo global (`RedisModule`)
- `[ ]` Criar `CacheService` com métodos `getOrSet`, `invalidate`, `invalidatePattern`
- `[ ]` Definir chaves de cache tipadas (`CACHE_KEYS.dashboard(userId)`, etc.)
- `[ ]` Aplicar cache no endpoint de totais/dashboard
- `[ ]` Criar listener que invalida cache ao receber `AssetPriceUpdated` event
- `[ ]` Criar listener que invalida cache ao criar/editar/deletar ativo ou categoria

---

### Soft Delete + Cleanup Cron
> **Conceitos:** Prisma middleware, soft delete pattern, batch delete

- `[ ]` Adicionar campo `deletedAt DateTime?` em `Asset` e `AssetCategory` via migration
- `[ ]` Criar Prisma middleware global para filtrar `deletedAt IS NULL` automaticamente
- `[ ]` Adaptar repositórios para não quebrarem com o middleware
- `[ ]` Criar `CleanupCron` (`@Cron` todo dia 3h) que deleta em batches registros com `deletedAt > 30 dias`
- `[ ]` Adaptar use cases de delete para setar `deletedAt` ao invés de deletar direto

---

### Histórico de Preços por Ativo
> **Conceitos:** Schema evolution, séries temporais, queries com janela de tempo

- `[ ]` Criar model `AssetPriceHistory` no schema Prisma (`assetId`, `date`, `price`, `source`)
- `[ ]` Rodar migration
- `[ ]` Adaptar `UpdateAssetPriceUseCase` para também persistir na `AssetPriceHistory`
- `[ ]` Criar endpoint `GET /assets/:id/price-history?from=&to=` 
- `[ ]` Criar use case `FindAssetPriceHistoryUseCase` com filtro de período
- `[ ]` Criar repository method `findByAssetIdAndPeriod`

---

## 🟡 Fase 2 — Complexidade média

### Snapshot Diário de Patrimônio
> **Conceitos:** Novo Processor, agregação de dados, evento com contexto

- `[ ]` Criar model `PatrimonySnapshot` (`userId`, `date`, `totalBrl`, `totalUsd`) no schema
- `[ ]` Rodar migration
- `[ ]` Adicionar `SNAPSHOT_PATRIMONY` em `QUEUES` e `JOBS` nas constants
- `[ ]` Criar `SnapshotPatrimonyProcessor` que agrega ativos × preço por usuário
- `[ ]` Adicionar job bulk de snapshot no cron diário (após atualização de preços)
- `[ ]` Publicar evento `PatrimonySnapshotCreated` no processor
- `[ ]` Criar listener que invalida cache do dashboard ao receber o evento
- `[ ]` Criar endpoint `GET /patrimony/snapshots?from=&to=` para o frontend

---

### Taxa de Câmbio Cacheada (BRL/USD)
> **Conceitos:** Redis TTL, external API, cache-aside com fallback

- `[ ]` Criar `ExchangeRateGateway` que busca USD/BRL (AwesomeAPI ou Open Exchange Rates)
- `[ ]` Implementar cache Redis com TTL de 24h: `exchange:USD:BRL`
- `[ ]` Criar `ExchangeRateCron` (`@Cron` todo dia 6h) que atualiza o cache proativamente
- `[ ]` Usar taxa cacheada no cálculo de total do portfólio (ativos `VARIABLE_US`)
- `[ ]` Expor endpoint `GET /exchange-rates` que retorna a taxa atual (do cache)

---

### Alerta de Variação de Preço
> **Conceitos:** Payload enriquecido em Domain Events, WebSocket (Socket.io), jobs condicionais

- `[ ]` Enriquecer `AssetPriceUpdatedPayload` com `previousPrice`, `changePercent`, `isSignificantChange`
- `[ ]` Adaptar `UpdateAssetPriceUseCase` para calcular e emitir payload enriquecido
- `[ ]` Definir threshold de variação significativa (ex: `> 3%`) via env var
- `[ ]` Criar `PriceAlertListener` que só age quando `isSignificantChange === true`
- `[ ]` Adicionar `PRICE_ALERT` em `QUEUES` e `JOBS`
- `[ ]` Criar `PriceAlertProcessor` com a lógica de notificação
- `[ ]` Instalar e configurar `@nestjs/websockets` + `socket.io`
- `[ ]` Criar `AlertsGateway` (WebSocket) com room por `userId`
- `[ ]` Processor emite evento WS para o usuário correto

---

### Meta de Alocação por Categoria
> **Conceitos:** Enriquecimento do domínio, regras de negócio na entidade, eventos condicionais

- `[ ]` Adicionar campo `targetAllocationPercent Decimal?` em `AssetCategory` via migration
- `[ ]` Adicionar método `calculateAllocationDeviation(totalPortfolio)` na entidade `AssetCategory`
- `[ ]` Criar use case `SetCategoryTargetAllocationUseCase`
- `[ ]` Criar endpoint `PATCH /categories/:id/target-allocation`
- `[ ]` Nos snapshots, calcular desvio de alocação por categoria
- `[ ]` Publicar evento `PortfolioRebalanceNeeded` quando desvio > threshold
- `[ ]` Criar listener de rebalanceamento que dispara alerta (WebSocket ou email)

---

## 🔴 Fase 3 — Alta complexidade

### Email Semanal com Resumo do Portfólio
> **Conceitos:** BullMQ avançado (DLQ, priority), email service, templates HTML

- `[ ]` Instalar provedor de email (Resend ou SendGrid)
- `[ ]` Criar `EmailService` com método `send(to, subject, html)`
- `[ ]` Criar template HTML do resumo semanal (variação, destaque de ativo)
- `[ ]` Adicionar `WEEKLY_REPORT` e `WEEKLY_REPORT_DLQ` em `QUEUES`
- `[ ]` Criar `WeeklyReportCron` (`@Cron` toda segunda 8h) que publica job por userId
- `[ ]` Criar `WeeklyReportProcessor` que agrega dados e dispara email
- `[ ]` Configurar Dead Letter Queue para falhas de envio
- `[ ]` Configurar priority jobs (usuários premium com priority mais alta)

---

### Relatório PDF Mensal
> **Conceitos:** R2 Storage, PDF generation, Signed URLs

- `[ ]` Instalar `@react-pdf/renderer` ou `puppeteer` para geração de PDF
- `[ ]` Criar template de relatório mensal (categorias, valores, variação)
- `[ ]` Adicionar `MONTHLY_REPORT_PDF` em `QUEUES`
- `[ ]` Criar `MonthlyReportCron` (último dia do mês 23h) que publica job por userId
- `[ ]` Criar `MonthlyReportProcessor` que gera o PDF e faz upload no R2
- `[ ]` Criar model `MonthlyReport` no Prisma (`userId`, `year`, `month`, `r2Key`, `downloadUrl`)
- `[ ]` Criar endpoint `GET /reports` que lista relatórios do usuário
- `[ ]` Gerar Signed URL temporária no momento do download

---

### Importação via n8n (Webhook + CSV)
> **Conceitos:** n8n workflows, Webhook Guard (API Key), idempotência, CSV parsing

- `[ ]` Criar model `ApiKey` no Prisma para autenticação de webhooks
- `[ ]` Criar `WebhookApiKeyGuard` (Guard NestJS que valida header `x-api-key`)
- `[ ]` Criar endpoint `POST /webhooks/import-statement` (multipart/form-data)
- `[ ]` Implementar parser de CSV de corretora (XP, Rico, B3 — escolher um formato)
- `[ ]` Criar `ImportStatementUseCase` com lógica de idempotência (não duplicar ativos)
- `[ ]` Salvar o CSV original no R2 para auditoria
- `[ ]` Configurar workflow n8n:
  - `[ ]` Trigger: upload manual ou Google Drive
  - `[ ]` Node de parse CSV
  - `[ ]` Loop com HTTP Request para a API
  - `[ ]` Node de log de resultado por ativo

---

## 🟣 Fase 4 — SQL Avançado, WebSockets & Streams

### Views SQL para Dashboard de Patrimônio
> **Conceitos:** `CREATE VIEW`, Prisma `$queryRaw`, SQL agregações, `COALESCE`, `JOIN` cross-schema

- `[ ]` Criar migration com `CREATE VIEW vw_portfolio_summary` que agrega por usuário: total por categoria, total geral BRL, total geral USD
- `[ ]` Criar migration com `CREATE VIEW vw_category_breakdown` que calcula % de alocação por categoria para cada usuário
- `[ ]` Criar migration com `CREATE VIEW vw_asset_performance` que calcula variação percentual (close atual vs mês anterior) por ativo
- `[ ]` Criar `PortfolioViewRepository` com métodos que usam `prisma.$queryRaw` para consultar as views
- `[ ]` Criar use case `GetPortfolioSummaryUseCase` que retorna dados da view
- `[ ]` Criar endpoint `GET /portfolio/summary` que usa a view
- `[ ]` Criar testes para garantir que as views retornam dados corretos

---

### Functions e Procedures SQL
> **Conceitos:** `CREATE FUNCTION`, `CREATE PROCEDURE`, PL/pgSQL, `prisma.$executeRaw`, `prisma.$queryRaw`

- `[ ]` Criar migration com `CREATE FUNCTION fn_calculate_patrimony(p_user_id TEXT)` que retorna o total patrimonial calculado a partir de ativos × records × exchange rate
- `[ ]` Criar migration com `CREATE FUNCTION fn_asset_variation(p_asset_id TEXT)` que retorna variação percentual entre `currentClosePrice` e `lastMonthClosePrice`
- `[ ]` Criar migration com `CREATE PROCEDURE sp_snapshot_patrimony(p_user_id TEXT)` que calcula e insere na tabela `PatrimonySnapshot` em uma transação
- `[ ]` Criar migration com `CREATE FUNCTION fn_portfolio_allocation(p_user_id TEXT)` que retorna `TABLE(category_id, category_name, total_value, allocation_percent)`
- `[ ]` Criar `SqlFunctionRepository` no infra que encapsula as chamadas via `$queryRaw` / `$executeRaw`
- `[ ]` Integrar `sp_snapshot_patrimony` no `SnapshotPatrimonyProcessor` ao invés de agregar no lado da aplicação
- `[ ]` Criar endpoint `GET /portfolio/allocation` que usa `fn_portfolio_allocation`

---

### WebSocket — Dashboard Real-Time
> **Conceitos:** `@nestjs/websockets`, `socket.io`, rooms por userId, broadcast seletivo, guards em WS

- `[ ]` Instalar e configurar `@nestjs/websockets` + `socket.io`
- `[ ]` Criar `PortfolioGateway` (`@WebSocketGateway`) com namespace `/portfolio`
- `[ ]` Implementar `handleConnection` com autenticação via token (validar sessão Better Auth)
- `[ ]` Criar room por `userId` no `afterInit` / `handleConnection`
- `[ ]` Criar listener `OnAssetPriceUpdated` que emite `portfolio:price-updated` para o room do userId
- `[ ]` Criar listener `OnPatrimonySnapshotCreated` que emite `portfolio:snapshot` para o room do userId
- `[ ]` Criar evento WS `portfolio:subscribe-ticker` para o frontend pedir updates de tickers específicos
- `[ ]` Criar `WsAuthGuard` que valida sessão do Better Auth para conexões WebSocket
- `[ ]` Emitir `portfolio:allocation-drift` quando desvio de meta de alocação > threshold

---

### Export CSV Streaming
> **Conceitos:** `ReadableStream`, `Transform streams`, `StreamableFile` (NestJS), backpressure, CSV serialization

- `[ ]` Criar `CsvStreamTransform` (Transform stream) que converte objetos JS → linhas CSV com header automático
- `[ ]` Criar use case `ExportAssetsToCSVUseCase` que abre cursor no banco e pipe para o transform stream
- `[ ]` Criar endpoint `GET /assets/export/csv` que retorna `StreamableFile` com `Content-Disposition: attachment`
- `[ ]` Criar use case `ExportBudgetsToCSVUseCase` com filtro por período (month/year range)
- `[ ]` Criar endpoint `GET /budgets/export/csv?from=2025-01&to=2025-12`
- `[ ]` Implementar streaming paginado no repository (cursor-based iteration) para não carregar tudo em memória
- `[ ]` Criar use case `ExportPortfolioSummaryToCSVUseCase` que usa a view SQL e faz stream
- `[ ]` Adicionar header `X-Total-Count` estimado antes do stream iniciar

---

### Importação Bulk via Stream (Upload CSV)
> **Conceitos:** `Busboy` / `Multer stream mode`, backpressure, `pipeline()`, Parse CSV line-by-line, batch insert

- `[ ]` Criar `CsvParserStream` (Transform stream) que lê chunks de bytes e emite objetos parsed por linha
- `[ ]` Criar endpoint `POST /assets/import/csv` que recebe o arquivo como stream (sem buffer completo em memória)
- `[ ]` Implementar validação de schema por linha (campos obrigatórios, tipos, etc.) dentro do transform
- `[ ]` Acumular linhas válidas em batches de 100 e inserir via `prisma.asset.createMany()`
- `[ ]` Retornar resultado de importação via stream (NDJSON): `{ line: 1, status: "ok" }\n{ line: 2, status: "error", reason: "..." }\n`
- `[ ]` Criar `ImportResultStream` (Transform) que formata resultado como NDJSON para o response
- `[ ]` Usar `pipeline()` (node:stream/promises) para conectar: request → CsvParser → batch insert → ImportResult → response
- `[ ]` Tratar backpressure: pausar leitura do CSV quando batch de insert estiver pendente

---

## 📌 Referência rápida

| Fase | Feature | Redis | BullMQ | Cron | Events | Storage | n8n | WebSocket | SQL | Streams |
|------|---------|:-----:|:------:|:----:|:------:|:-------:|:---:|:---------:|:---:|:-------:|
| 1 | Cache Redis | ✅ | | | ✅ | | | | | |
| 1 | Soft Delete + Cleanup | | | ✅ | | | | | | |
| 1 | Histórico de Preços | | | | | | | | | |
| 2 | Snapshot Patrimônio | | ✅ | ✅ | ✅ | | | | | |
| 2 | Câmbio Cacheado | ✅ | | ✅ | | | | | | |
| 2 | Alerta de Variação | | ✅ | | ✅ | | | ✅ | | |
| 2 | Meta de Alocação | | | | ✅ | | | | | |
| 3 | Email Semanal | | ✅ | ✅ | | | | | | |
| 3 | PDF Mensal | | ✅ | ✅ | | ✅ | | | | |
| 3 | Import via n8n | | | | | ✅ | ✅ | | | |
| 4 | Views SQL Dashboard | | | | | | | | ✅ | |
| 4 | Functions/Procedures | | | | | | | | ✅ | |
| 4 | WS Dashboard Real-Time | | | | ✅ | | | ✅ | | |
| 4 | Export CSV Streaming | | | | | | | | ✅ | ✅ |
| 4 | Import Bulk via Stream | | | | | | | | | ✅ |
