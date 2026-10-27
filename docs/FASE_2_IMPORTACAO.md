# Fase 2: Importação de Operações (B3 e Vest)

> Guia de implementação da importação de extratos para o registro de operações (`modules/transactions`). Pressupõe a **fase 1** concluída: operações manuais, posição calculada e aporte do mês.

---

## 1. Objetivo e Escopo

Trazer o histórico de compras, vendas e eventos de arquivos das corretoras, sem digitar operação por operação, e deixar a posição, o preço médio e os aportes iguais aos da vida real.

| Entra na fase 2 | Fica para depois |
|---|---|
| Extrato de **Negociação** da B3 (compras e vendas de ações, FIIs, ETFs e BDRs) | Notas de corretagem em PDF (taxas reais por operação) |
| Extrato de **Movimentação** da B3 (desdobramento, grupamento, bonificação, frações) | Subscrição, empréstimo de ações, opções e termo |
| CSV da **Vest** (ações US), com câmbio do dia quando o arquivo não trouxer | Outras corretoras US (o parser é plugável) |
| Pré-visualização antes de gravar, sem duplicar em reimportações | Renda fixa por lotes (fase 4) |
| Desfazer uma importação inteira | Apuração de IR (fase 3) |
| Preencher o aporte dos meses já fechados a partir das operações | |
| (Opcional) proventos do sync com a quantidade da data COM | |

**Critério de pronto:** importar o extrato completo da B3 gera a mesma quantidade que você tem hoje em cada ativo (ou mostra a divergência e o motivo), e reimportar o mesmo arquivo não cria nada novo.

---

## 2. O Que Já Existe (fase 1)

| Peça | Onde | Uso na fase 2 |
|---|---|---|
| Entidade `Transaction` (tipos `OPENING`, `BUY`, `SELL`, `SPLIT`, `REVERSE_SPLIT`, `BONUS`; origem `MANUAL`\|`IMPORT`) | `apps/service/src/modules/transactions/domain/transaction.entity.ts` | As linhas importadas viram `Transaction` com `source: IMPORT` |
| Motor de posição `buildPosition` (custo médio, resultado de venda, validação de sequência) | `.../transactions/domain/position.ts` | Validar o plano de importação por ativo antes de gravar e calcular o fator de desdobramento |
| Regras por categoria (renda fixa bloqueada, câmbio obrigatório fora de BRL) | `.../transactions/domain/transaction-rules.ts` | As mesmas regras valem para linhas importadas |
| Saldo inicial automático (`OPENING` na véspera da primeira operação manual) | `.../application/use-cases/create-transaction.ts` | A importação decide se substitui ou mantém esse saldo (seção 5.4) |
| Aporte do mês (`GET /transactions/contributions`) | `.../use-cases/get-monthly-contributions.ts` | Base do preenchimento retroativo (seção 7) |
| Cache de indicadores do BCB (`indicator_rates`, sync incremental por ano) | `apps/service/src/modules/indicators` | Adicionar o dólar diário para o câmbio da Vest (seção 4.3) |
| Upload com multer (`FileInterceptor`, `fileFilter`, `limits`) | `apps/service/src/modules/user/infra/user.controller.ts` | Mesmo padrão para o upload do extrato |
| Seção "Operações" no detalhe do ativo | `apps/web/src/features/transactions/components/AssetTransactions` | Mostra as importadas com selo "importada" |

---

## 3. Antes de Codar: Pegar os Arquivos Reais

Os formatos abaixo são o **esperado**, a partir de exportações conhecidas da B3. **Confirme com o arquivo real antes de escrever o parser**: nome exato das colunas, formato de data e número, e se a planilha tem linhas de total no fim.

1. **B3** (Área do Investidor → Extratos): exporte **Negociação** e **Movimentação** em Excel, do período mais longo disponível. Confira a primeira data de cada arquivo: se suas primeiras compras forem anteriores ao início do extrato, você vai precisar de um saldo inicial naquela data (seção 5.4).
2. **Vest:** veja qual export de operações a corretora oferece (CSV ou planilha) e quais colunas ele traz. O ponto crítico é se o arquivo traz o **câmbio** de cada operação.
3. Guarde os arquivos **fora do repositório** (dados pessoais). Nos testes, gere as planilhas em código (seção 10); não versione extrato real.

### 3.1 B3: Extrato de Negociação (esperado)

Uma linha por negócio executado.

| Coluna | Exemplo | Mapeia para |
|---|---|---|
| Data do Negócio | `05/03/2026` | `date` |
| Tipo de Movimentação | `Compra` \| `Venda` | `type` (`BUY`\|`SELL`) |
| Mercado | `Mercado à Vista` \| `Mercado Fracionário` | normalização do ticker |
| Prazo/Vencimento | `-` | ignorar |
| Instituição | `XP INVESTIMENTOS CCTVM S/A` | `broker` (sugestão ao criar ativo) e chave de dedup |
| Código de Negociação | `WEGE3` \| `WEGE3F` | `ticker` (sem o `F` do fracionário) |
| Quantidade | `100` | `quantity` |
| Preço | `40,52` | `price` |
| Valor | `4.052,00` | conferência (`quantidade × preço`) |

- **Não traz taxas** (corretagem e emolumentos): importar com `fees: 0`. Quem quiser o custo exato edita a operação depois. Importar as notas de corretagem fica para uma fase futura.
- Mercado diferente de à vista ou fracionário (opções, termo, futuro): linha `IGNORED` com motivo.

### 3.2 B3: Extrato de Movimentação (esperado)

Uma linha por movimento na custódia. **Ela também lista as liquidações das compras e vendas**, então **nunca** importe compra e venda daqui: elas viriam em dobro com a Negociação.

| Coluna | Exemplo |
|---|---|
| Entrada/Saída | `Credito` \| `Debito` |
| Data | `12/04/2026` |
| Movimentação | `Desdobro`, `Bonificação em Ativos`, `Transferência - Liquidação`, `Dividendo`… |
| Produto | `WEGE3 - WEG S.A.` |
| Instituição | `XP INVESTIMENTOS CCTVM S/A` |
| Quantidade | `100` |
| Preço unitário | `-` ou `12,34` |
| Valor da Operação | `-` ou `1.234,00` |

Mapeamento dos tipos de movimentação (confirmar os nomes exatos no arquivo):

| Movimentação | Vira | Observação |
|---|---|---|
| `Transferência - Liquidação`, `Compra`, `Venda` | `IGNORED` | Duplicaria a Negociação |
| `Desdobro` | `SPLIT` | O arquivo traz as **ações recebidas**, não a proporção: `factor = (posição na data + recebidas) / posição na data`, calculado com `buildPosition` até a véspera |
| `Grupamento` | `REVERSE_SPLIT` | Confirmar no arquivo se vem como débito das ações retiradas ou como crédito da nova quantidade; `factor = posição antes / posição depois` |
| `Bonificação em Ativos` | `BONUS` | `price` = preço unitário, se vier (custo atribuído). Sem preço: importar com `0` e marcar aviso "informe o custo atribuído (fato relevante da empresa)" |
| `Fração em Ativos` / `Leilão de Fração` | `SELL` da fração | Preço = valor ÷ quantidade. Se só vier o débito da fração, sem valor, marcar para revisão |
| `Dividendo`, `Juros Sobre Capital Próprio`, `Rendimento` | `IGNORED` (ou proventos, ver 8.2) | |
| `Direito de Subscrição`, `Cessão de Direitos`, `Subscrição`, `Empréstimo`, `Atualização`, `Transferência` | `IGNORED` | Avisar para lançar à mão quando mexer na posição |

Se o fator calculado não for "redondo" (ex.: 1,9973), mostre um aviso: costuma indicar compra ou venda faltando antes do evento.

### 3.3 Vest (a confirmar)

Ainda sem amostra. O parser precisa extrair, por linha: data, ticker, lado (compra/venda), quantidade, preço em USD, taxas em USD e, se existir, o câmbio. Ações fracionárias são comuns: a quantidade tem até 8 casas (`Decimal(20, 8)` já suporta).

---

## 4. Modelo de Dados

### 4.1 Migration em `packages/lib-db`

```prisma
/// Uma importação de extrato (permite desfazer tudo de uma vez)
model ImportBatch {
  id           String             @id @default(uuid())
  userId       String
  source       ImportSource
  /// Nomes dos arquivos enviados, só para exibição
  fileNames    String[]
  createdAt    DateTime           @default(now())

  user         User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions AssetTransaction[]

  @@index([userId, createdAt])
  @@map("import_batches")
  @@schema("finance-assets")
}

enum ImportSource {
  B3
  VEST

  @@schema("finance-assets")
}

model AssetTransaction {
  // ...campos atuais
  importBatchId String?
  /// Identidade da linha no extrato: reimportar o mesmo arquivo não duplica
  importKey     String?

  importBatch   ImportBatch? @relation(fields: [importBatchId], references: [id], onDelete: Cascade)

  @@unique([userId, importKey])
}
```

- `onDelete: Cascade` no lote: desfazer a importação apaga as operações dela (o use case recalcula as posições, seção 6.1).
- Adicione `importBatches ImportBatch[]` em `User`, exponha `importBatch` em `prismaFinanceAssets` (`packages/lib-db/src/index.ts`) e rode `pnpm --filter @lib/db build`.
- Para gerar o SQL sem banco: `npx prisma migrate diff --from-schema <schema anterior> --to-schema src/prisma/schema.prisma --script` (foi como as migrations da fase 1 foram conferidas).

### 4.2 Chave de deduplicação (`importKey`)

```
sha256(source | data | ticker | tipo | quantidade | preço | instituição | ocorrência)
```

- **Ocorrência** = posição da linha entre as idênticas do mesmo arquivo (1ª, 2ª…). Dois negócios iguais no mesmo dia continuam sendo dois; reimportar o arquivo gera as mesmas chaves e nada entra de novo.
- Números normalizados antes do hash (`100` e `100,00` iguais). Use `node:crypto` (`createHash('sha256')`).
- Operação manual não tem `importKey`. A importação não a reconhece como duplicata: veja a seção 5.4.

### 4.3 Dólar diário para a Vest

Se o arquivo da Vest não trouxer câmbio, use o dólar do dia do negócio:

- Adicione `USD_BRL` em `EconomicIndicator` (enum no `lib-db` e em `core/http/external/indicators/indicator-data.gateway.ts`), na série **SGS 1** (dólar, venda, diário; confirme na documentação do SGS) em `BcbIndicatorProvider.SERIES`.
- `SyncIndicatorRatesUseCase` já itera por todos os indicadores. Revise `isStale` (o dólar segue o mesmo calendário de dias úteis do CDI) e o `ensureCovered`, que passaria a buscar o dólar até nas chamadas da renda fixa. Separar por indicador (`ensureCovered(since, indicators)`) evita isso.
- Em fim de semana ou feriado, use a cotação do dia útil anterior. A operação fica com aviso "câmbio estimado (BCB), confira". A regra de câmbio do IR no exterior entra na fase 4; aqui é só para ter o aporte em R$.

---

## 5. Backend: Arquitetura

Tudo dentro de `modules/transactions`, separado em `import/`:

```
modules/transactions/
├── domain/import/
│   ├── imported-operation.ts      # Tipo neutro que todo parser devolve
│   ├── statement-parser.ts        # Contrato: parse(buffer, fileName) => ParsedStatement
│   ├── ticker.ts                  # normalizeB3Ticker (WEGE3F → WEGE3), tickerFromProduct ("WEGE3 - WEG S.A.")
│   ├── import-key.ts              # buildImportKeys (hash + ocorrência)
│   └── import-plan.ts             # Função pura: linhas + ativos + operações atuais → plano por ativo
├── infra/import/
│   ├── b3-trades.parser.ts        # Negociação (xlsx)
│   ├── b3-events.parser.ts        # Movimentação (xlsx)
│   └── vest.parser.ts             # Vest (csv/xlsx)
├── application/use-cases/
│   ├── preview-import.ts          # Lê, casa tickers, monta o plano, não grava
│   ├── confirm-import.ts          # Mesmo plano + decisões do usuário, grava em lote
│   ├── list-imports.ts
│   ├── undo-import.ts
│   └── apply-contributions.ts     # Seção 7
└── infra/transaction.controller.ts  # Novas rotas (seção 6)
```

### 5.1 Leitura dos arquivos

- **xlsx:** `exceljs` (`pnpm --filter api add exceljs`). Rode `pnpm check-versions` depois (catálogo do workspace). Evite o pacote `xlsx` do npm, que está desatualizado.
- **csv:** `csv-parse/sync`, se a Vest exportar CSV.
- **Leia pelo cabeçalho, não pela posição.** Encontre a linha de cabeçalho, normalize os nomes (minúsculas, sem acento, espaços colapsados) e mapeie pelo nome. Pequenas mudanças da B3 continuam funcionando, e coluna obrigatória ausente vira erro claro ("coluna Data do Negócio não encontrada").
- **Números pt-BR:** `"4.052,00"` → `4052`; `"-"` e vazio → `null`. **Datas** `dd/MM/yyyy` → 00:00 UTC (`startOfDayUtc` de `core/utils/utc-date.ts`).
- **Detecção do tipo de arquivo** pelo cabeçalho: tem "Código de Negociação" → Negociação; tem "Movimentação" e "Produto" → Movimentação. O usuário pode mandar os dois arquivos juntos.
- Linha inválida (data ruim, quantidade zero) não derruba o arquivo: vira `INVALID` com motivo e número da linha.

```ts
// domain/import/imported-operation.ts
export interface ImportedOperation {
  /** Linha na planilha, para o usuário achar */
  line: number
  fileName: string
  date: Date
  ticker: string
  /** SPLIT/REVERSE_SPLIT chegam com `receivedQuantity`; o fator é calculado no plano */
  type: TransactionType
  quantity: number | null
  receivedQuantity?: number
  price: number | null
  fees: number
  exchangeRate: number | null
  institution: string | null
  warnings: string[]
}

export interface ParsedStatement {
  operations: ImportedOperation[]
  ignored: Array<{ line: number; fileName: string; reason: string }>
  invalid: Array<{ line: number; fileName: string; reason: string }>
}
```

### 5.2 Casar ticker com ativo

- Busque os ativos do usuário (`assetRepository.list({ userId })`) e case por ticker normalizado, só em categorias compatíveis: B3 → `VARIABLE_BR` e `FII`; Vest → `VARIABLE_US`.
- Ticker sem ativo vira `NEEDS_ASSET`. O usuário escolhe, na confirmação: casar com um ativo existente, **criar** numa categoria (nome = ticker, corretora = instituição do extrato) ou pular.
- Não adivinhe a categoria por sufixo: `…11` pode ser FII, ETF ou unit (`TAEE11`). Sugira a categoria mais usada do mesmo tipo e deixe a decisão com o usuário.
- O mesmo ticker em duas corretoras: o projeto permite dois ativos com o mesmo ticker (um por corretora). Se houver mais de um ativo com o ticker, case pela **Instituição** com o `broker` do ativo e, sem match, peça a escolha.

### 5.3 Plano de importação (`import-plan.ts`, função pura)

Para cada ativo afetado:

1. **Dedup:** descarte as linhas cujo `importKey` já existe para o usuário (`DUPLICATE`).
2. **Eventos:** ordene trades + operações existentes + eventos e converta `Desdobro`/`Grupamento` em `factor` usando `buildPosition` até a véspera do evento.
3. **Saldo inicial:** aplique a regra da seção 5.4.
4. **Validação:** `buildPosition(operações finais)`. Se lançar (venda maior que a posição), o ativo inteiro fica bloqueado com a mensagem. É o caso típico de extrato que começa depois das primeiras compras.
5. **Conciliação:** compare a quantidade final com a quantidade atual do ativo e mostre a diferença (não bloqueia).

O preview e a confirmação chamam a **mesma** função com os mesmos dados. Assim, o que a confirmação grava é exatamente o que foi mostrado.

### 5.4 Saldo inicial × histórico importado

| Situação do ativo | Comportamento padrão | Alternativa (opção na confirmação) |
|---|---|---|
| Sem operações e sem quantidade | Importa tudo | — |
| Sem operações, com quantidade | O histórico **é** a posição: importa tudo, sem saldo inicial, e concilia com a quantidade atual | Manter a quantidade atual como saldo inicial na data da primeira linha importada (para extrato incompleto) |
| Com `OPENING` (criado na fase 1) | **Substituir:** apaga o `OPENING` e importa o histórico completo | **Manter:** importa só as linhas com data **posterior** ao `OPENING` |
| Com operações manuais além do `OPENING` | Igual, mas linhas importadas que batem com uma manual (mesma data, tipo, quantidade e preço) ficam como `POSSIBLE_DUPLICATE`, desmarcadas por padrão | — |

A divergência de quantidade sempre aparece no preview, com a frase pronta: "o extrato resulta em 80 cotas e o ativo tem 100. Faltam operações antes de 01/2020 ou depois do fim do extrato?"

### 5.5 Gravação

- Crie o `ImportBatch` e grave as operações com `source: IMPORT`, `importBatchId` e `importKey` (`createMany`), apague os `OPENING` substituídos e atualize a posição de cada ativo (`asset.applyPosition`), tudo em uma única `prisma.$transaction`. Uma falha no meio não pode deixar posição pela metade.
- O repositório precisa de um método transacional para isso (ex.: `TransactionRepository.applyImport(batch, toCreate, toDeleteIds)`). A posição dos ativos pode ser gravada logo depois, recalculada a partir do banco.

---

## 6. Backend: Rotas

Todas no `TransactionController`, **antes** de `':id'`:

| Rota | Corpo | Resposta |
|---|---|---|
| `POST /transactions/import/preview` | `multipart/form-data`: `files` (1–2 arquivos), `source` (`B3`\|`VEST`) | Plano: linhas por status, ativos afetados, tickers sem ativo, divergências, totais |
| `POST /transactions/import` | Os mesmos arquivos + `options` (JSON): mapeamento de tickers e modo do saldo inicial | `{ message, batchId, created, duplicates, assetsUpdated }` |
| `GET /transactions/imports` | — | Lotes do usuário (data, origem, arquivos, quantidade de operações) |
| `DELETE /transactions/imports/:id` | — | `{ message }` (desfaz o lote) |
| `POST /transactions/contributions/apply` | `{ from, to, overwrite? }` (AAAA-MM) | `{ message, updated }` (seção 7) |

- **Upload:** `FilesInterceptor('files', 2, { fileFilter, limits: { fileSize: 5 MB } })`, aceitando `.xlsx` (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) e `.csv`. Arquivo inválido: `BadRequestException`, como no avatar. O arquivo fica só em memória (`file.buffer`); **não** envie para o R2.
- **Sem estado entre preview e confirmação:** a web manda os arquivos de novo com as decisões e o servidor refaz o plano. Nada de cache. Se o banco mudou entre um e outro, o plano novo vale.

```ts
// options da confirmação
interface ConfirmImportOptions {
  tickers: Record<
    string,
    | { action: 'MATCH'; assetId: string }
    | { action: 'CREATE'; categoryId: string }
    | { action: 'SKIP' }
  >
  /** Padrão: REPLACE (seção 5.4) */
  opening: 'REPLACE' | 'KEEP_AFTER'
  /** Linhas POSSIBLE_DUPLICATE que o usuário marcou para entrar */
  includeLines?: Array<{ fileName: string; line: number }>
}
```

### 6.1 Desfazer

1. Carregue as operações do lote e os ativos afetados.
2. Para cada ativo, valide `buildPosition(operações restantes)`. Se uma venda manual posterior depender de uma compra importada, recuse com 400, nomeando os ativos.
3. Apague o lote (cascata nas operações) e recalcule a posição de cada ativo (`applyPosition(null)` se não sobrar nenhuma).
4. `OPENING` substituído **não volta**: avise isso no diálogo de confirmação do desfazer.

---

## 7. Aportes dos Meses Já Fechados

Com o histórico importado, os aportes antigos (o problema que inflava a rentabilidade) podem ser preenchidos de uma vez:

- `ApplyContributionsUseCase(userId, { from, to, overwrite = false })`: para cada `asset_records` das categorias do usuário no intervalo, se a categoria tem compra ou venda naquele mês, grava `contributionAmount` = compras − vendas do mês (mesma conta do `GetMonthlyContributionsUseCase`; extraia uma função compartilhada).
- **Padrão: só preenche aporte vazio** (`null`). `overwrite: true` sobrescreve o que foi digitado à mão.
- **Só faz sentido se a categoria inteira tem operações.** Se a categoria tem ativos sem operação, o aporte calculado fica parcial. Calcule a cobertura (ativos com operação ÷ ativos ativos da categoria) e, abaixo de 100%, pule a categoria e devolva o motivo na resposta.
- Precisa de `BudgetRepository` (importe o `BudgetModule` no `TransactionModule`) e de um método para atualizar só o aporte.
- Na web: botão "Preencher aportes dos meses fechados" no fim da importação e na tela de operações, com o resultado ("12 meses preenchidos; Cripto pulada: 2 de 5 ativos sem operações").

---

## 8. Opcionais (se sobrar tempo)

### 8.1 Proventos com a quantidade da data COM

Hoje o sync de proventos usa a quantidade atual do ativo (o AGENTS.md admite que o backfill superestima os meses antes de um aporte). Com operações:

- Em `SyncAssetDividendsUseCase` (`modules/dividends`), se `asset.hasTransactions`, use `buildPosition(operações com data <= comDate).quantity`.
- O `DividendModule` passa a importar o `TransactionModule`. Não há ciclo: o `TransactionModule` só importa `AssetModule` e `CategoryModule`.
- Proventos já sincronizados (`SYNC`, ainda não pagos) podem ser recalculados no próximo sync; os `MANUAL` continuam intocados.

### 8.2 Proventos da Movimentação da B3

As linhas `Dividendo`, `Juros Sobre Capital Próprio` e `Rendimento` têm valor e data de pagamento. Dá para criar proventos com a mesma chave única `(assetId, type, paymentDate)` e pular os que o sync já trouxe. Decida antes se eles entram como `MANUAL` (protegidos do sync) ou com uma origem nova.

---

## 9. Frontend (`apps/web`)

### 9.1 Nova página "Operações"

`app/(application)/transactions/page.tsx` + `TransactionsClient.tsx`, com item no menu (`shared/config`):

- **Lista de todas as operações** (`useTransactions` com filtros de categoria, ativo e período), com o resultado das vendas e um selo "importada" para `source = IMPORT`.
- Botão **"Importar extrato"**, que abre o assistente.
- Aba ou seção **"Importações"**: lotes com data, origem e quantidade, e botão **Desfazer** (`ConfirmDeleteDialog`).

### 9.2 Assistente de importação (`features/transactions/components/ImportWizard`)

1. **Origem e arquivos:** escolha B3 ou Vest e solte os arquivos (B3 aceita Negociação e Movimentação juntos). Explique de onde exportar.
2. **Pré-visualização** (`POST /import/preview`):
   - Totais: novas, duplicadas, ignoradas, inválidas.
   - **Tickers sem ativo:** para cada um, um select "Casar com… / Criar em [categoria] / Pular".
   - **Por ativo:** quantidade atual → quantidade após importar, divergência destacada, modo do saldo inicial quando houver `OPENING`.
   - Linhas ignoradas e inválidas em lista recolhível, com o motivo (o usuário confere se nada importante ficou de fora).
   - Avisos: bonificação sem custo, câmbio estimado, fator de desdobramento estranho.
3. **Confirmação** (`POST /import`): toast com o resumo; invalida `transactions`, `assets` e `budgets`; oferece "Preencher aportes dos meses fechados".

- O upload usa `FormData` no `apiClient` com `timeout` maior (como o refresh de cotações, 120 s).
- Hooks em `features/transactions/hooks/use-transactions.ts` (`usePreviewImport`, `useConfirmImport`, `useImports`, `useUndoImport`, `useApplyContributions`), seguindo o padrão do AGENTS.md da web: toast e invalidação dentro do hook.

---

## 10. Testes

Gere as planilhas **em código** com `exceljs` (helper em `apps/service/test/import/make-b3-workbook.ts`), com as mesmas colunas do arquivo real. Assim os testes não dependem de extrato pessoal.

| Alvo | Casos |
|---|---|
| Parsers | cabeçalho fora da 1ª linha; colunas em outra ordem; número pt-BR (`4.052,00`); `-` como vazio; fracionário `WEGE3F` → `WEGE3`; linha de total ignorada; coluna obrigatória ausente → erro claro; linha inválida não derruba o arquivo |
| `buildImportKeys` | mesma linha duas vezes no arquivo gera 2 chaves diferentes; reimportar gera as mesmas chaves; `100` e `100,00` geram a mesma chave |
| Eventos | desdobro 1:2 com 100 ações (100 recebidas → fator 2); bonificação sem preço → aviso; liquidação da Movimentação ignorada |
| `import-plan` | substitui `OPENING`; modo manter importa só depois do `OPENING`; venda sem posição bloqueia o ativo; divergência de quantidade reportada; possível duplicata de operação manual |
| Use cases | preview não grava nada; confirmar duas vezes não duplica; ticker de outro usuário não casa; desfazer recalcula a posição; desfazer recusado quando venda manual depende de compra importada |
| Aportes | preenche só os vazios; `overwrite`; pula categoria com cobertura parcial |

Use os repositórios em memória (`test/repositories/in-memory-transaction.repository.ts` precisa ganhar suporte a `importKey` e lotes).

---

## 11. Ordem de Implementação

Cada passo fecha com testes passando (`pnpm --filter api test`), `tsc` limpo e `pnpm biome check`.

1. [ ] Baixar os arquivos reais e **confirmar colunas e nomes de movimentação** (seção 3). Ajustar este documento se algo mudar.
2. [ ] Migration: `ImportBatch`, `ImportSource`, `importBatchId` e `importKey` (seção 4.1); build do `lib-db`.
3. [ ] `exceljs` e parser da **Negociação** + testes.
4. [ ] Normalização de ticker, `importKey` e `ImportedOperation` + testes.
5. [ ] `import-plan` (dedup, saldo inicial, validação, conciliação) + testes.
6. [ ] `PreviewImportUseCase` + rota com upload. Testar com o arquivo real **só no preview**, que não grava.
7. [ ] `ConfirmImportUseCase` (transação única) + `ListImports` + `UndoImport`.
8. [ ] Web: página "Operações", assistente (B3 só com Negociação) e lista de importações com desfazer.
9. [ ] Parser da **Movimentação** (desdobro, grupamento, bonificação, frações) entrando no mesmo plano.
10. [ ] `ApplyContributionsUseCase` + botão na web.
11. [ ] Dólar diário (`USD_BRL`) e parser da **Vest**.
12. [ ] Opcionais da seção 8.
13. [ ] Atualizar `apps/service/AGENTS.md` (tabelas, rotas e seção "Operações") e `packages/lib-db/AGENTS.md`.

Do passo 1 ao 8 já dá para importar o histórico de compras e vendas da B3 com segurança: preview, sem duplicar e com desfazer.

---

## 12. Decisões em Aberto

| Decisão | Sugestão |
|---|---|
| Taxas da B3 (o extrato não traz) | Importar com 0 e deixar editar; notas de corretagem numa fase futura |
| BDRs e units (`AAPL34`, `TAEE11`) | Categoria escolhida pelo usuário no preview; nada de inferência |
| Proventos da Movimentação (8.2) | Fazer depois do passo 10, se o sync não estiver cobrindo bem |
| Origem dos proventos importados | `MANUAL` (protegidos do sync) ou um valor novo em `DividendSource` |
| Ativo zerado após importar (vendeu tudo) | Sugerir marcar como inativo no preview, sem fazer sozinho |
