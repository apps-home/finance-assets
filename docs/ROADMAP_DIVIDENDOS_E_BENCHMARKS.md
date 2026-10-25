# Plano de Implementação: Proventos & Dividendos + Benchmarks de Rentabilidade

> Roadmap arquitetural e de produto para rastreamento de renda passiva e comparação de performance da carteira.

---

## 1. Módulo de Proventos & Dividendos (Ideia 1)

### O Problema Atual
- Hoje o schema possui apenas `dividendAmount` mensal genérico no `AssetRecord` (Budget), o que não diz:
  1. Quanto cada ativo individual (`MXRF11`, `AAPL`, `KLBN4`) pagou;
  2. Quanto foi recebido em Ações vs Fundos Imobiliários vs Stocks em USD;
  3. Histórico anual e evolução de renda passiva mês a mês;
  4. Projeção de dividendos futuros já anunciados pelas empresas (Data COM / Data Pagamento).

### Como Resolver

#### A. Modelo de Dados (packages/lib-db)
Adicionar uma tabela de lançamentos de proventos:
```prisma
model AssetDividend {
  id          String       @id @default(uuid())
  assetId     String
  userId      String
  type        DividendType // DIVIDEND, JCP, RENDIMENTO (FII)
  amount      Decimal      @db.Decimal(15, 2) // Valor total líquido recebido em R$
  rateAmount  Decimal?     @db.Decimal(15, 4) // Valor pago por cota/ação
  paymentDate DateTime
  createdAt   DateTime     @default(now())

  asset Asset @relation(fields: [assetId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, paymentDate])
  @@index([assetId])
  @@map("asset_dividends")
  @@schema("finance-assets")
}

enum DividendType {
  DIVIDEND
  JCP
  INCOME // Rendimento FII
  OTHER

  @@schema("finance-assets")
}
```

#### B. Automação de Dados de Dividendos
1. **Mercado Brasileiro (B3)**:
   - A **Brapi** já utilizada no projeto (`brapi.dev`) possui endpoint com histórico de dividendos:
     `GET /api/quote/{ticker}?dividends=true`
   - Retorna: tipo de dividendo, valor por cota, data COM e data de pagamento.
   - Um cron job mensal/semanal busca os dividendos anunciados dos tickers que você possui e calcula:
     $$\text{Valor Recebido} = \text{Quantidade de Cotas} \times \text{Valor por Cota}$$
2. **Mercado Americano (US Stocks)**:
   - Polygon.io ou Alpha Vantage fornecem endpoint de `Dividends v3`.

#### C. Visualizações na Interface
- **Card de Renda Passiva**: Total recebido no mês atual e média mensal do ano.
- **Gráfico de Evolução (Bar Chart)**: Barras empilhadas dos últimos 12 meses divididas por categoria (Ações BR, FIIs, Ações US).
- **Yield on Cost (YoC)**: Exibir na tabela de ativos o quanto o dividendo anual representa sobre o preço médio que você pagou.
- **Calendário / Próximos Pagamentos**: Lista dos dividendos confirmados previstos para cair na conta no próximo mês.

---

## 2. Benchmarks de Rentabilidade da Carteira (Ideia 4)

### O Problema Atual
- Você sabe que sua carteira teve um lucro de X% (ex: +73% na Amazon, +2% em CSN), mas não sabe se o patrimônio consolidado está **superando o CDI (100%), o Ibovespa ou o S&P 500**.

### Como Resolver

#### A. Coleta dos Indicadores de Mercado (Cron / Cache)
Criar um provider no backend que busca mensalmente ou sob demanda as taxas de referência:
1. **CDI Acumulado**: API pública e gratuita do Banco Central (BACEN / SGS série 12 ou 4389).
2. **Ibovespa (IBOV)**: Brapi (`^BVSP`).
3. **S&P 500 em Reais**: Retorno do S&P 500 somado à variação cambial do Dólar no período.

#### B. Cálculo de Rentabilidade Ponderada no Tempo (TWR - Time-Weighted Return)
- Utiliza os registros mensais de fechamento da carteira para calcular a curva de rentabilidade percentual acumulada ao longo dos meses.

#### C. Visualização no Frontend
- **Gráfico Comparativo Multilinhas**:
  - Linha Verde (Destaque): **Sua Carteira**
  - Linha Laranja: **100% do CDI**
  - Linha Azul: **Ibovespa**
  - Linha Roxa: **S&P 500 (em BRL)**
- **Cards de Alpha**:
  - `+3.4% acima do CDI no ano`
  - `Carteira com beta defensivo em relação ao Ibovespa`
