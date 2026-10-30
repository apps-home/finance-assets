# Evolução do Controle Patrimonial (Macro & Net Worth)

> Guia de implementação das novas funcionalidades voltadas à visão macro de patrimônio no **Finance Assets**, aproveitando os dados históricos de `AssetRecord` (`budgets`) e expandindo o sistema para o cálculo de Patrimônio Líquido Completo (*Net Worth*).

---

## 1. Objetivo e Escopo

Enquanto os módulos de ativos (`/assets`), proventos (`/dividends`) e rentabilidade (`/performance`) cobrem o acompanhamento **micro** de cada investimento, este plano evolui o **Dashboard de Controle Patrimonial (`/`)** para responder às principais perguntas de construção de riqueza no longo prazo:

1. **Curva Real e Multi-Anual**: Como meu patrimônio evoluiu ao longo dos anos sem quedas artificiais para zero nos meses ainda não fechados e com prévia em tempo real do mês corrente?
2. **Esforço vs. Bola de Neve**: Quanto do crescimento do meu patrimônio veio do meu bolso (`contributionAmount`) e quanto veio dos rendimentos/valorização da carteira?
3. **Exposição Cambial e por Classe**: Qual percentual do meu patrimônio está dolarizado (`USD` vs. `BRL`) e como ele se divide entre classes (`CategoryType`)?
4. **Marcos e Projeção (*Milestones*)**: Quão perto estou do próximo marco patrimonial (ex.: R$ 100k, R$ 250k, R$ 500k, R$ 1M) e quando devo atingi-lo mantendo meu ritmo atual de aportes?
5. **Patrimônio Líquido Completo (*Net Worth*)**: Somando meus investimentos financeiros aos meus bens físicos (carro, imóvel) e descontando eventuais passivos (financiamentos), qual é o meu patrimônio líquido total?

### Resumo das Fases

| Fase | Entrega | Status | Precisa de Migration? |
|---|---|---|---|
| **Fase 1** | Correção dos meses futuros (`null`), Prévia Estimada do mês atual e Visão Multi-Anual (`Ano` \| `12M` \| `24M` \| `Tudo`) | 🟢 Concluído | Não |
| **Fase 2** | Decomposição do Crescimento: **Aportes Acumulados vs. Ganho de Mercado (Bola de Neve)** + Card de Ponte Patrimonial | 🟢 Concluído | Não |
| **Fase 3** | Raio-X no `CategoryBreakdown`: alternar entre **Categoria**, **Classe (`CategoryType`)** e **Moeda (`BRL` vs. `USD`)** | 🟢 Concluído | Não |
| **Fase 4** | **Marcos Patrimoniais (*Milestones*)** e projeção de data para atingir o próximo degrau | 🟢 Concluído | Não |
| **Fase 5** | **Bens Imobilizados e Passivos (*Net Worth*)**: cadastro de bens físicos/dívidas e consolidação no Dashboard | ⚪ Pendente | Sim (`patrimony_items`) |

---

## 2. O Que Já Existe na Base

| Peça | Onde | Como será aproveitada |
|---|---|---|
| Modelo `AssetRecord` (`amount`, `exchangeRate`, `dividendAmount`, `contributionAmount`) | `packages/lib-finance-assets-db/src/prisma/schema.prisma` | Fonte primária para decomposição de aportes vs. valorização e série multi-anual |
| Modelo `AssetCategory` (`type`, `currency`, `targetPercentage`) | `packages/lib-finance-assets-db/src/prisma/schema.prisma` | Agrupamento por classe (`CategoryType`) e por moeda (`BRL` vs. `USD`) |
| Endpoint `GET /budgets` (`year` opcional em `FindAllBudgetsParams`) | `apps/service/src/modules/budgets` | Já aceita busca sem `year` para retornar todo o histórico multi-anual do usuário |
| Sugestão de fechamento em tempo real (`buildClosingDefaults`) | `apps/web/src/features/dashboard/utils/month-closing.ts` | Reaproveitada para calcular o ponto **"Estimado Hoje"** do mês aberto |
| Gráfico `FinancialChart` e `CategoryBreakdown` | `apps/web/src/features/dashboard/components/` | Componentes visuais que receberão os novos modos de análise |

---

## 3. Fase 1: Curva Real, Prévia do Mês Atual e Visão Multi-Anual

### 3.1 Cortar Meses Futuros Sem Registro (Fim da Queda para R$ 0) `[CONCLUÍDO]`
Implementado em `buildMainChartData` (`apps/web/src/features/dashboard/utils/build-chart-data.ts`) e `FinancialChart` (`apps/web/src/features/dashboard/components/FinancialChart/index.tsx`):
- Meses ainda não fechados recebem `total: null` (em vez de `0`).
- No `AreaChart` do Recharts, `connectNulls={false}` faz a linha parar exatamente no último mês fechado (ex.: Setembro), eliminando a queda para zero e mantendo os meses futuros legíveis no eixo X.
- O tooltip customizado foi protegido para não renderizar card vazio em meses sem dados.

### 3.2 Ponto "Estimado Hoje" (Prévia do Mês Corrente) `[CONCLUÍDO]`
Implementado em `calculateCurrentMonthEstimate` / `withCurrentMonthEstimate` (`apps/web/src/features/dashboard/utils/build-patrimony-series.ts`), consumido em `useDashboard`. Usa a mesma regra do fechamento (posições ativas × cotação atual, câmbio atual; categorias manuais repetem o último saldo), calculada sobre todo o histórico para funcionar em qualquer visão.
Quando o usuário está visualizando o ano corrente e o mês atual ainda não foi fechado:
- Calcular o valor estimado atual somando as sugestões de `buildClosingDefaults` (posições ativas pela cotação atual convertidas pelo câmbio + saldo anterior das categorias manuais).
- No `FinancialChart`:
  - Adicionar uma segunda `<Area>` ou `<Line strokeDasharray="4 4" />` conectando o último mês fechado ao mês atual com o valor estimado.
  - No Tooltip do mês atual, exibir a tag `Prévia em tempo real (não fechado)`.

### 3.3 Visão Multi-Anual (`Ano` | `12M` | `24M` | `Tudo`) `[CONCLUÍDO]`
Implementado em `buildMultiYearChartData` e no seletor do `FinancialChart`.
Adicionar um seletor compacto no cabeçalho do `FinancialChart`:
- **`Ano`** (padrão): Mostra `Jan–Dez` do `selectedYear` (comportamento atual).
- **`12M` / `24M` / `Tudo`**:
  - Chama `useBudgets()` sem filtro de `year` (ou busca todos os registros históricos) e agrupa por competência `(year, month)` em ordem cronológica (`Jan/24`, `Fev/24`, ..., `Set/26`).
  - Permite enxergar a curva exponencial contínua atravessando a virada de ano.

---

## 4. Fase 2: Decomposição "Esforço (Aportes) vs. Bola de Neve (Rendimentos)" `[CONCLUÍDO]`

Implementado em `utils/build-wealth-decomposition.ts` (`withWealthDecomposition`, `buildWealthBridge`), exposto por `useDashboard` e renderizado no `FinancialChart` (toggle `Total | Aportes vs. Rendimentos` + ponte patrimonial `WealthBridgeSummary`). O gráfico usa duas áreas sobrepostas (não empilhadas) para suportar ganho de mercado negativo; meses sem registro têm os aportes somados no próximo mês fechado.

### 4.1 Conceito e Matemática (`utils/build-wealth-decomposition.ts`)
Para qualquer janela de meses fechados $m_1, m_2, \dots, m_n$:

- **Patrimônio Inicial ($V_1$)**: Soma de `amount` no primeiro mês do período.
- **Variação em cada mês $t$ ($t > 1$)**:
  $$\Delta V_t = V_t - V_{t-1}$$
  - **Aporte Líquido do Mês ($C_t$)**: Soma de `contributionAmount` de todas as categorias no mês $t$ (se uma categoria aparece pela primeira vez após $m_1$ sem `contributionAmount` explícito, considerar o próprio saldo ou apenas o `contributionAmount` preenchido).
  - **Ganho de Mercado / Juros no Mês ($G_t$)**:
    $$G_t = \Delta V_t - C_t$$
    *(Representa a valorização das cotas + renda fixa + variação cambial + proventos reinvestidos que não vieram de aporte externo).*

- **Série Acumulada para o Gráfico**:
  - `investedCapitalCumulative[t]` = $V_1 + \sum_{i=2}^{t} C_i$ (Patrimônio que você teria se o dinheiro ficasse parado sem render nada além do saldo inicial + seus aportes).
  - `marketGainCumulative[t]` = $\sum_{i=2}^{t} G_i$ (Riqueza líquida gerada pelo efeito bola de neve no período).
  - Soma das duas = $V_t$ (`total`).

### 4.2 Visualização na UI
1. **Toggle no `FinancialChart`**:
   - **`Total`** (curva única do patrimônio)
   - **`Aportes vs. Rendimentos`** (duas curvas/áreas: base sólida = *Patrimônio Base + Aportes*, topo = *Ganho de Mercado Acumulado*).
2. **Resumo de Ponte Patrimonial (*Waterfall* no rodapé do gráfico ou nos StatCards)**:
   - Exibe os 4 blocos do período selecionado:
     - **Início**: `R$ 59.070,00`
     - **+ Aportes Líquidos**: `+ R$ 11.200,00` (ex.: `60,8%` do crescimento)
     - **+ Valorização & Juros**: `+ R$ 7.234,53` (ex.: `39,2%` do crescimento)
     - **= Patrimônio Final**: `R$ 77.504,53` (`+31,2%`)

---

## 5. Fase 3: Raio-X de Alocação (Categoria, Classe e Moeda) `[CONCLUÍDO]`

Implementado no componente `CategoryBreakdown` (`apps/web/src/features/dashboard/components/CategoryBreakdown/index.tsx`), integrado via `useDashboard` (`apps/web/src/features/dashboard/hooks/use-dashboard.ts`) e consumido em `DashboardClient` (`apps/web/src/app/(application)/(dashboard)/DashboardClient.tsx`):
- O cabeçalho possui um seletor `Tabs` que alterna dinamicamente o título, o gráfico de rosca (Donut) e a legenda lateral.

### 5.1 Visão 1: Por Categoria (`buildCategoryChartData`)
- Exibe cada `AssetCategory` individualmente (`Ações (USD)`, `Mercado Pago`, `Reserva (CASA)`, etc.), ordenado por valor decrescente.

### 5.2 Visão 2: Por Classe de Ativo (`buildTypeChartData`)
- Agrupa os valores das categorias por `category.type` utilizando os rótulos de `CATEGORY_TYPE_LABELS`:
  - **Renda Fixa** (`FIXED`)
  - **Ações Nacionais** (`VARIABLE_BR`)
  - **Fundos Imobiliários** (`FII`)
  - **Ações Internacionais** (`VARIABLE_US`)
  - **Criptomoedas** (`CRYPTO`)

### 5.3 Visão 3: Exposição por Moeda (`buildCurrencyChartData`)
- Agrupa o patrimônio do mês de referência por moeda via `getCategoryCurrency(category)`:
  - **Real (BRL)**
  - **Dólar (USD)**
  - Outras moedas conforme cadastro (EUR, GBP).

---

## 6. Fase 4: Marcos Patrimoniais (*Milestones*) e Projeção `[CONCLUÍDO]`

Implementado em `utils/milestones.ts` (`PATRIMONY_MILESTONES`, `getMilestoneProgress`, `projectMilestone`) e `components/PatrimonyMilestoneBanner`, renderizado no `DashboardClient`. **Em vez de criar `calculate-milestone-projection.ts`**, a projeção reaproveita `monthsToReach` (`features/performance/utils/projection.ts`) e `useProjectionBaseline` (aporte médio dos últimos 12 meses e rentabilidade histórica, com padrão de 10% a.a. quando há menos de 12 meses), garantindo o mesmo cálculo da página `/performance`. O card traz também a simulação "+R$ 500/mês antecipa X meses".

### 6.1 Escada de Marcos (*Milestones*)
Definir os degraus naturais de evolução patrimonial em BRL:

```ts
export const PATRIMONY_MILESTONES = [
	10_000,
	25_000,
	50_000,
	75_000,
	100_000,
	150_000,
	200_000,
	250_000,
	500_000,
	750_000,
	1_000_000
] as const
```

Dado o patrimônio atual $V_{\text{atual}}$ (ex.: `R$ 77.504,53`):
- **Último marco conquistado**: `R$ 75.000,00` ✅
- **Próximo marco alvo ($M_{\text{alvo}}$)**: `R$ 100.000,00` 🎯
- **Progresso total rumo ao marco**: `77,5%` (faltam `R$ 22.495,47`).

### 6.2 Cálculo de Projeção (`utils/calculate-milestone-projection.ts`)
Com base nos últimos $k$ meses fechados (padrão: até 6 meses mais recentes):
1. **Aporte Médio Mensal ($\bar{C}$)**: Média de `contributionAmount` mensal (mínimo `0` para projeção conservadora caso tenha havido resgate atípico).
2. **Taxa Mensal Média de Rendimento ($\bar{r}$)**: Média geométrica da rentabilidade mensal (ou crescimento orgânico médio $\bar{G} / V_{t-1}$ limitado a um teto conservador, ex.: `0,8%` a `1,2%` a.m. se o histórico for curto).
3. **Iteração mês a mês**:
   $$V_{m+1} = V_m \times (1 + \bar{r}) + \bar{C}$$
   Determina quantos meses $N$ faltam até $V_{m+N} \ge M_{\text{alvo}}$ e converte para a competência estimada (ex.: *"Estimativa: **Junho de 2027** (em ~9 meses) mantendo aporte médio de R$ 2.100/mês"*).

### 6.3 Componente Visual (`PatrimonyMilestoneBanner` ou Card no Dashboard)
- Exibe:
  - Marco atual e próximo alvo (`R$ 77,5k / R$ 100k`).
  - Barra de progresso com destaque visual para os marcos já superados.
  - Previsão de data baseada no ritmo real dos últimos meses + simulação rápida (*"Com +R$ 500/mês de aporte, você antecipa em X meses"*).

---

## 7. Fase 5: Bens Físicos e Passivos — Patrimônio Líquido Completo (*Net Worth*)

Para que o sistema represente 100% da sua vida patrimonial (e não apenas a carteira de investimentos em corretoras/bancos), adicionamos o suporte a **Bens Não-Financeiros (Imobilizados)** e **Passivos (Dívidas/Financiamentos)**.

### 7.1 Modelagem no Prisma (`packages/lib-finance-assets-db/src/prisma/schema.prisma`)

```prisma
enum PatrimonyItemType {
  REAL_ESTATE   // Imóvel (Apartamento, Casa, Terreno)
  VEHICLE       // Veículo (Carro, Moto — ex.: valor Tabela FIPE)
  EQUIPMENT     // Equipamentos de alto valor (Notebook, Setup, etc.)
  OTHER_ASSET   // Outros bens / direitos a receber
  LIABILITY     // Passivo / Financiamento / Empréstimo / Consórcio (entra subtraindo)

  @@schema("finance-assets")
}

model PatrimonyItem {
  id            String            @id @default(uuid())
  userId        String
  name          String            // Ex.: "Carro (Tabela FIPE)", "Apartamento", "Financiamento Imobiliário"
  type          PatrimonyItemType
  /// Valor atual estimado em BRL (sempre positivo; o tipo LIABILITY define o sinal na soma)
  currentValue  Decimal           @db.Decimal(15, 2)
  /// Valor de aquisição original (opcional, para calcular valorização/depreciação)
  purchaseValue Decimal?          @db.Decimal(15, 2)
  acquiredAt    DateTime?         @db.Date
  notes         String?
  isActive      Boolean           @default(true)
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isActive])
  @@map("patrimony_items")
  @@schema("finance-assets")
}
```

### 7.2 Arquitetura no Backend (`apps/service/src/modules/patrimony-items`)
Seguindo o padrão DDD / Clean Architecture do `apps/service`:
- **`domain/patrimony-item.entity.ts`**: Entidade com `create()` e `update()` parcial, validando `currentValue >= 0` e distinguindo ativos físicos (`isAsset`) de passivos (`type === PatrimonyItemType.LIABILITY`).
- **Endpoints**:
  - `POST /patrimony-items`
  - `GET /patrimony-items` (retorna a lista de itens + resumo `{ totalPhysicalAssets, totalLiabilities, netPhysicalBalance }`)
  - `PATCH /patrimony-items/:id`
  - `DELETE /patrimony-items/:id`

### 7.3 Integração no Dashboard Patrimonial (`apps/web`)
- **Equação do Patrimônio Líquido Total (*Net Worth*)**:
  $$\text{Patrimônio Líquido} = \underbrace{\text{Ativos Financeiros}}_{\text{AssetRecords}} + \underbrace{\text{Bens Imobilizados}}_{\text{REAL\_ESTATE, VEHICLE...}} - \underbrace{\text{Passivos}}_{\text{LIABILITY}}$$
- **Seletor de Escopo no Topo do Dashboard**:
  - **`Patrimônio Financeiro (Líquido)`** (padrão atual: soma apenas as categorias de investimento/reservas)
  - **`Patrimônio Completo (Net Worth)`** (soma investimentos + bens físicos − passivos, exibindo o indicador de **Índice de Liquidez**: ex. *"68% em Ativos Financeiros Líquidos · 32% Imobilizado"*).
- **Seção "Bens & Passivos"**:
  - Card/Tabela compacta no Dashboard (ou aba dedicada) onde você cadastra/atualiza rapidamente o valor do carro, equipamentos, imóveis ou saldo devedor de financiamentos.

---

## 8. Status e Ordem de Execução

1. **Entregas Concluídas**:
   - ✅ **Fase 1 (Item 1)**: Fim da queda para R$ 0 nos meses futuros no `FinancialChart` (`null` + `connectNulls={false}`).
   - ✅ **Fase 3 (Completa)**: Raio-X de alocação no `CategoryBreakdown` com abas `Categoria | Classe | Moeda` e helpers `buildTypeChartData` / `buildCurrencyChartData`.

2. **Próximas Entregas**:
   - **Entrega 1.2 (Fase 1 restante & Fase 2)**:
     - Ponto pontilhado "Estimado Hoje" para o mês corrente no gráfico.
     - Seletor de período multi-anual (`Ano | 12M | 24M | Tudo`).
     - Decomposição **Aportes vs. Rendimentos (Bola de Neve)** no gráfico e card de Ponte Patrimonial.
   - **Entrega 2 (Fase 4 — Milestones)**:
     - Card de **Marcos Patrimoniais + Projeção de data**.
   - **Entrega 3 (Fase 5 — Bens Físicos e Passivos)**:
     - Migration `patrimony_items` no `@lib/finance-assets-db`, módulo `patrimony-items` no NestJS e visão consolidada de *Net Worth* no frontend.

