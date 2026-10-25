'use client'

import {
  Landmark,
  PiggyBank,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import type {
  FixedIncomePosition,
  MacroAllocation,
  PortfolioAllocation,
  PortfolioPosition
} from '@/features/assets/api/types'
import { usePortfolioSummary } from '@/features/assets/hooks/use-assets'
import { StatCard } from '@/features/dashboard/components/StatCard'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/shared/components/ui/tabs'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils/format-currency'

const chartColor = (index: number) => `var(--chart-${(index % 6) + 1})`

const formatPercent = (value: number | null) =>
  value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`

function Panel({
  title,
  description,
  children,
  className
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6',
        className
      )}
    >
      <header className="mb-4 space-y-1">
        <h2 className="font-semibold text-lg">{title}</h2>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </header>
      {children}
    </section>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="py-8 text-center text-muted-foreground text-sm">{message}</p>
  )
}

interface AllocationTooltipProps {
  data: PortfolioAllocation[]
  active?: boolean
  payload?: Array<{ payload: PortfolioAllocation }>
}

function AllocationTooltip({ active, payload, data }: AllocationTooltipProps) {
  if (!active || !payload?.length) return null

  const item = payload[0].payload
  const index = data.findIndex((entry) => entry.key === item.key)
  const isProfit = item.profitLoss >= 0

  return (
    <div className="min-w-56 rounded-xl border border-border/50 bg-popover/95 p-4 shadow-xl backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="size-3 rounded-full ring-2 ring-white/20"
          style={{ backgroundColor: chartColor(index) }}
        />
        <span className="font-semibold text-popover-foreground text-sm">
          {item.name}
        </span>
      </div>

      <p className="font-bold text-lg text-primary tabular-nums">
        {formatCurrency(item.currentBalance)}
      </p>

      <div className="mt-2 mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(item.percentage, 100)}%`,
            backgroundColor: chartColor(index)
          }}
        />
      </div>

      <dl className="space-y-1.5 text-xs">
        <div className="flex justify-between gap-6">
          <dt className="text-muted-foreground">Da carteira</dt>
          <dd className="font-medium tabular-nums">
            {item.percentage.toFixed(1)}%
          </dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-muted-foreground">Lucro / Prejuízo</dt>
          <dd
            className={cn(
              'font-medium tabular-nums',
              isProfit ? 'text-primary' : 'text-destructive'
            )}
          >
            {isProfit ? '+' : ''}
            {formatCurrency(item.profitLoss)}
          </dd>
        </div>
        <div className="flex justify-between gap-6">
          <dt className="text-muted-foreground">Ativos</dt>
          <dd className="font-medium tabular-nums">{item.assetsCount}</dd>
        </div>
      </dl>
    </div>
  )
}

function AllocationDonut({ data }: { data: PortfolioAllocation[] }) {
  if (!data.length) return <EmptyState message="Sem ativos na carteira." />

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="currentBalance"
              nameKey="name"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={2}
              stroke="transparent"
            >
              {data.map((item, index) => (
                <Cell key={item.key} fill={chartColor(index)} />
              ))}
            </Pie>
            <Tooltip
              cursor={false}
              wrapperStyle={{ outline: 'none', zIndex: 50 }}
              content={<AllocationTooltip data={data} />}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-col gap-2 lg:min-w-56">
        {data.map((item, index) => (
          <li key={item.key} className="flex items-center gap-3 text-sm">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: chartColor(index) }}
            />
            <span className="min-w-0 flex-1 truncate font-medium">
              {item.name}
            </span>
            <span className="font-semibold text-muted-foreground text-xs tabular-nums">
              {item.percentage.toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AllocationBars({ data }: { data: PortfolioAllocation[] }) {
  if (!data.length) return <EmptyState message="Sem ativos na carteira." />

  return (
    <ul className="space-y-4">
      {data.map((item, index) => (
        <li key={item.key} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-medium">{item.name}</span>
            <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
              {formatCurrency(item.currentBalance)} ·{' '}
              {item.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(item.percentage, 100)}%`,
                backgroundColor: chartColor(index)
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

type RankingMetric = 'portfolioPercentage' | 'profitability' | 'monthChange'

function Ranking({
  positions,
  metric,
  emptyMessage
}: {
  positions: PortfolioPosition[]
  metric: RankingMetric
  emptyMessage: string
}) {
  if (!positions.length) return <EmptyState message={emptyMessage} />

  return (
    <ul className="divide-y divide-border/60">
      {positions.map((position) => {
        const value =
          metric === 'portfolioPercentage'
            ? position.portfolioPercentage
            : metric === 'profitability'
              ? position.profitabilityPercentage
              : position.monthChangePercentage
        const isPositive = (value ?? 0) >= 0

        return (
          <li
            key={position.id}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-sm">
                {position.ticker || position.name}
              </p>
              <p className="truncate text-muted-foreground text-xs">
                {position.name} · {position.categoryName}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold text-sm tabular-nums">
                {formatCurrency(position.currentBalance)}
              </p>
              <p
                className={cn(
                  'text-xs tabular-nums',
                  metric === 'portfolioPercentage'
                    ? 'text-muted-foreground'
                    : isPositive
                      ? 'text-primary'
                      : 'text-destructive'
                )}
              >
                {metric === 'portfolioPercentage'
                  ? `${position.portfolioPercentage.toFixed(1)}% da carteira`
                  : formatPercent(value)}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function MacroAllocationBar({ data }: { data?: MacroAllocation }) {
  if (!data || data.totalBalance <= 0) return null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-primary" />
          <span className="font-medium">
            Renda Variável / Cripto ({(data.variablePercentage ?? 0).toFixed(1)}
            %)
          </span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {formatCurrency(data.variableBalance ?? 0)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-amber-500" />
          <span className="font-medium">
            Renda Fixa / Caixa ({(data.fixedPercentage ?? 0).toFixed(1)}%)
          </span>
          <span className="text-muted-foreground text-xs tabular-nums">
            {formatCurrency(data.fixedBalance ?? 0)}
          </span>
        </div>
      </div>

      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${Math.min(data.variablePercentage ?? 0, 100)}%` }}
        />
        <div
          className="h-full bg-amber-500 transition-all duration-500"
          style={{ width: `${Math.min(data.fixedPercentage ?? 0, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <span>Risco / Crescimento</span>
        <span>Patrimônio Total: {formatCurrency(data.totalBalance ?? 0)}</span>
        <span>Segurança / Liquidez</span>
      </div>
    </div>
  )
}

function FixedIncomeTable({ positions }: { positions: FixedIncomePosition[] }) {
  if (!positions.length) {
    return <EmptyState message="Nenhum ativo de renda fixa cadastrado." />
  }

  return (
    <ul className="divide-y divide-border/60">
      {positions.map((pos) => (
        <li
          key={pos.id}
          className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold text-sm">{pos.name}</span>
              <Badge variant="outline" className="text-[10px]">
                {pos.categoryName}
              </Badge>
              {pos.currency === 'USD' && (
                <Badge className="bg-blue-500/10 text-[10px] text-blue-500">
                  USD
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Custódia: {pos.broker || 'Sem corretora'}
              {pos.currency !== 'BRL' && (
                <span className="ml-2 font-mono">
                  (Original: {formatCurrency(pos.originalBalance, pos.currency)}
                  )
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <div className="text-left sm:text-right">
              <p className="font-semibold text-sm tabular-nums">
                {formatCurrency(pos.currentBalance)}
              </p>
              <p className="text-muted-foreground text-xs tabular-nums">
                {pos.percentage.toFixed(1)}% da renda fixa
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function PortfolioDashboard() {
  const { data, isLoading } = usePortfolioSummary()

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    )
  }

  const { totals, fixedIncome, macroAllocation } = data
  const isProfit = totals.profitLoss >= 0

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Alocação Global de Risco (Visão Macro compartilhada) */}
      <Panel
        title="Alocação Global de Risco"
        description="Comparativo consolidado da sua carteira pessoal: Renda Variável vs Renda Fixa e Reserva de Emergência"
      >
        <MacroAllocationBar data={macroAllocation} />
      </Panel>

      {/* Abas Variant Line */}
      <Tabs defaultValue="variable">
        <div className="border-border border-b pb-1.5">
          <TabsList variant="line" className="w-full gap-6">
            <TabsTrigger
              value="variable"
              className="cursor-pointer gap-2 font-semibold text-sm"
            >
              <span>Renda Variável & Cripto</span>
              <Badge variant="secondary" className="font-normal text-xs">
                {formatCurrency(totals.currentBalance)}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="fixed"
              className="cursor-pointer gap-2 font-semibold text-sm"
            >
              <span>Renda Fixa & Reserva</span>
              <Badge variant="secondary" className="font-normal text-xs">
                {formatCurrency(fixedIncome?.currentBalance ?? 0)}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ABA 1: RENDA VARIÁVEL */}
        <TabsContent value="variable" className="space-y-6 pt-4">
          {/* Cards de Renda Variável */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Valor em Renda Variável"
              subtitle={`${totals.assetsCount} ativos em carteira`}
              value={totals.currentBalance}
              icon={Wallet}
              iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              title="Total Investido"
              subtitle="Custo total de aquisição"
              value={totals.investedValue}
              icon={PiggyBank}
              iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              title="Lucro / Prejuízo"
              subtitle="Retorno total acumulado"
              value={totals.profitLoss}
              icon={isProfit ? TrendingUp : TrendingDown}
              trend={formatPercent(totals.profitabilityPercentage)}
              trendUp={isProfit}
              variant="trend"
            />
          </div>

          {/* Gráficos de Alocação de Renda Variável */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel
              title="Alocação por Categoria"
              description="Apenas renda variável e cripto, em R$"
            >
              <AllocationDonut data={data.allocationByCategory} />
            </Panel>
            <Panel
              title="Distribuição por Corretora"
              description="Onde o seu dinheiro de risco está custodiado"
            >
              <AllocationBars data={data.allocationByBroker} />
            </Panel>
          </div>

          {/* Rankings de Posição e Rentabilidade */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Panel title="Maiores Posições">
              <Ranking
                positions={data.topHoldings}
                metric="portfolioPercentage"
                emptyMessage="Nenhuma posição encontrada."
              />
            </Panel>
            <Panel title="Melhor Rentabilidade" description="Desde a compra">
              <Ranking
                positions={data.bestPerformers}
                metric="profitability"
                emptyMessage="Sem dados de rentabilidade."
              />
            </Panel>
            <Panel title="Pior Rentabilidade" description="Desde a compra">
              <Ranking
                positions={data.worstPerformers}
                metric="profitability"
                emptyMessage="Sem dados de rentabilidade."
              />
            </Panel>
          </div>

          {/* Maiores Altas e Quedas do Mês */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel
              title="Maiores Altas do Mês"
              description="Variação desde o último fechamento mensal"
            >
              <Ranking
                positions={data.monthMovers.gainers}
                metric="monthChange"
                emptyMessage="Nenhum ativo em alta no mês."
              />
            </Panel>
            <Panel
              title="Maiores Quedas do Mês"
              description="Variação desde o último fechamento mensal"
            >
              <Ranking
                positions={data.monthMovers.losers}
                metric="monthChange"
                emptyMessage="Nenhum ativo em queda no mês."
              />
            </Panel>
          </div>
        </TabsContent>

        {/* ABA 2: RENDA FIXA */}
        <TabsContent value="fixed" className="space-y-6 pt-4">
          {/* Cards de Renda Fixa */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              title="Total em Renda Fixa & Caixa"
              subtitle={`${fixedIncome?.assetsCount ?? 0} itens em carteira`}
              value={fixedIncome?.currentBalance ?? 0}
              icon={ShieldCheck}
              iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              title="Exposição em Dólar (USD)"
              subtitle="Reserva internacional convertida"
              value={
                fixedIncome?.positions
                  .filter((p) => p.currency === 'USD')
                  .reduce((sum, p) => sum + p.currentBalance, 0) ?? 0
              }
              icon={Wallet}
              iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              title="Exposição em Real (BRL)"
              subtitle="Caixa e liquidez doméstica"
              value={
                fixedIncome?.positions
                  .filter((p) => p.currency === 'BRL')
                  .reduce((sum, p) => sum + p.currentBalance, 0) ?? 0
              }
              icon={Landmark}
              iconClassName="bg-primary/10 text-primary"
            />
          </div>

          {/* Tabela de Posições e Gráficos de Renda Fixa */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Panel
                title="Posições de Renda Fixa & Caixa"
                description="Ativos destinados a reserva, liquidez ou proteção"
              >
                <FixedIncomeTable positions={fixedIncome?.positions ?? []} />
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel
                title="Exposição Cambial da Reserva"
                description="Distribuição entre Real e Moedas Estrangeiras"
              >
                <AllocationBars
                  data={fixedIncome?.allocationByCurrency ?? []}
                />
              </Panel>

              <Panel
                title="Custódia da Reserva"
                description="Instituições onde a reserva está alocada"
              >
                <AllocationBars data={fixedIncome?.allocationByBroker ?? []} />
              </Panel>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
