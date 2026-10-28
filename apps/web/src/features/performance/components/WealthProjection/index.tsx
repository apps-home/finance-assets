'use client'

import { Input } from '@lib/ui/components/input'
import { Skeleton } from '@lib/ui/components/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@lib/ui/components/tabs'
import { cn } from '@lib/ui/lib/utils'
import { HandCoins, Info, Rocket, Target, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

import { useProjectionBaseline } from '@/features/performance/hooks/use-projection-baseline'
import {
  formatDuration,
  monthsToReach,
  type ProjectionInput,
  projectWealth,
  reachDate,
  SAFE_WITHDRAWAL_RATE
} from '@/features/performance/utils/projection'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatCurrencyInput } from '@/shared/utils/format-currency-input'
import { parseValue } from '@/shared/utils/parse-value'

const HORIZONS = [10, 20, 30] as const

/** Sem histórico suficiente, parte de uma rentabilidade moderada */
const FALLBACK_RETURN_PCT = 10

const GOALS_STORAGE_KEY = 'finance-assets:projection-goals'

interface StoredGoals {
  wealthGoal: string
  incomeGoal: string
}

/** Metas ficam só neste navegador; storage bloqueado vira campos vazios */
function readGoals(): StoredGoals {
  try {
    const raw = window.localStorage.getItem(GOALS_STORAGE_KEY)
    if (raw) return { wealthGoal: '', incomeGoal: '', ...JSON.parse(raw) }
  } catch {
    // ignora: storage indisponível ou conteúdo inválido
  }
  return { wealthGoal: '', incomeGoal: '' }
}

function writeGoals(goals: StoredGoals) {
  try {
    window.localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals))
  } catch {
    // ignora: sem storage as metas só não persistem
  }
}

const toInput = (value: number) =>
  value > 0 ? formatCurrencyInput(Math.round(value * 100).toString()) : ''

const compactCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)

export function WealthProjection() {
  const baseline = useProjectionBaseline()
  const isMobile = !useMediaQuery('(min-width: 640px)')

  const [horizon, setHorizon] = useState<number>(20)
  // null = segue o histórico; o usuário pode sobrescrever
  const [contributionInput, setContributionInput] = useState<string | null>(
    null
  )
  const [returnInput, setReturnInput] = useState<string | null>(null)
  const [goals, setGoals] = useState<StoredGoals>({
    wealthGoal: '',
    incomeGoal: ''
  })

  useEffect(() => {
    setGoals(readGoals())
  }, [])

  function updateGoal(key: keyof StoredGoals, raw: string) {
    setGoals((prev) => {
      const next = { ...prev, [key]: formatCurrencyInput(raw) }
      writeGoals(next)
      return next
    })
  }

  const defaultReturn = baseline.historicalReturnPct ?? FALLBACK_RETURN_PCT

  const input: ProjectionInput = {
    initial: baseline.currentWealth,
    monthlyContribution:
      contributionInput !== null
        ? parseValue(contributionInput)
        : Math.max(baseline.averageContribution, 0),
    annualReturnPct:
      returnInput !== null && returnInput.trim() !== ''
        ? Number(returnInput.replace(',', '.')) || 0
        : defaultReturn
  }

  const wealthGoal = parseValue(goals.wealthGoal)
  const incomeGoal = parseValue(goals.incomeGoal)

  const points = projectWealth(input, horizon)
  const final = points[points.length - 1]

  const currentYield =
    baseline.currentWealth > 0
      ? baseline.dividends12m / baseline.currentWealth
      : 0
  const monthlyIncomeNow = baseline.dividends12m / 12

  const wealthForIncomeByYield =
    incomeGoal > 0 && currentYield > 0 ? (incomeGoal * 12) / currentYield : null
  const wealthForIncomeBy4 =
    incomeGoal > 0 ? (incomeGoal * 12) / SAFE_WITHDRAWAL_RATE : null

  const chartData = points.map((point) => ({
    ...point,
    label: point.year === 0 ? 'Hoje' : `${point.year}a`
  }))

  if (baseline.isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />
  }

  return (
    <div
      data-slot="wealth-projection"
      className="space-y-5 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Rocket className="size-4.5" />
          </div>
          <div>
            <h3 className="font-semibold text-xl">Projeção de patrimônio</h3>
            <p className="text-muted-foreground text-xs">
              Parte do seu último fechamento ({formatCurrency(input.initial)}) e
              dos seus aportes e rentabilidade
            </p>
          </div>
        </div>

        <Tabs
          value={String(horizon)}
          onValueChange={(value) => setHorizon(Number(value))}
        >
          <TabsList>
            {HORIZONS.map((item) => (
              <TabsTrigger
                key={item}
                value={String(item)}
                className="cursor-pointer text-xs"
              >
                {item} anos
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Field
          id="projection-contribution"
          label="Aporte por mês"
          hint={
            contributionInput !== null
              ? {
                  text: `Média registrada: ${formatCurrency(baseline.averageContribution)}`,
                  onReset: () => setContributionInput(null)
                }
              : { text: 'Média dos aportes dos últimos 12 meses' }
          }
        >
          <Input
            id="projection-contribution"
            inputMode="numeric"
            placeholder="0,00"
            value={contributionInput ?? toInput(input.monthlyContribution)}
            onChange={(event) =>
              setContributionInput(formatCurrencyInput(event.target.value))
            }
            className="h-9 text-xs tabular-nums"
          />
        </Field>

        <Field
          id="projection-return"
          label="Rentabilidade ao ano (%)"
          hint={
            returnInput !== null
              ? {
                  text:
                    baseline.historicalReturnPct != null
                      ? `Histórico: ${baseline.historicalReturnPct.toFixed(1)}% a.a.`
                      : `Padrão: ${FALLBACK_RETURN_PCT}% a.a.`,
                  onReset: () => setReturnInput(null)
                }
              : {
                  text:
                    baseline.historicalReturnPct != null
                      ? 'Rentabilidade histórica da sua carteira'
                      : 'Menos de 12 meses de histórico: valor padrão'
                }
          }
        >
          <Input
            id="projection-return"
            inputMode="decimal"
            value={returnInput ?? defaultReturn.toFixed(1)}
            onChange={(event) => setReturnInput(event.target.value)}
            className="h-9 text-xs tabular-nums"
          />
        </Field>

        <Field
          id="projection-wealth-goal"
          label="Meta de patrimônio"
          hint={{ text: 'Salva neste navegador' }}
        >
          <Input
            id="projection-wealth-goal"
            inputMode="numeric"
            placeholder="Ex.: 1.000.000,00"
            value={goals.wealthGoal}
            onChange={(event) => updateGoal('wealthGoal', event.target.value)}
            className="h-9 text-xs tabular-nums"
          />
        </Field>

        <Field
          id="projection-income-goal"
          label="Meta de renda por mês"
          hint={{ text: 'Quanto quer viver de renda' }}
        >
          <Input
            id="projection-income-goal"
            inputMode="numeric"
            placeholder="Ex.: 10.000,00"
            value={goals.incomeGoal}
            onChange={(event) => updateGoal('incomeGoal', event.target.value)}
            className="h-9 text-xs tabular-nums"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Highlight
          icon={TrendingUp}
          title={`Em ${horizon} anos`}
          value={formatCurrency(final.wealth)}
          description={`${formatCurrency(final.invested)} aportados + ${formatCurrency(Math.max(final.wealth - final.invested, 0))} de rendimento`}
        />

        <Highlight
          icon={Target}
          title="Meta de patrimônio"
          value={
            wealthGoal > 0 ? goalReach(wealthGoal, input) : 'Defina uma meta'
          }
          description={
            wealthGoal > 0
              ? `Para chegar a ${formatCurrency(wealthGoal)} no ritmo atual`
              : 'Informe acima quanto quer acumular'
          }
        />

        <Highlight
          icon={HandCoins}
          title="Renda passiva hoje"
          value={`${formatCurrency(monthlyIncomeNow)}/mês`}
          description={
            incomeGoal > 0
              ? `${((monthlyIncomeNow / incomeGoal) * 100).toFixed(1)}% da sua meta de renda (proventos dos últimos 12 meses)`
              : `Proventos dos últimos 12 meses (yield de ${(currentYield * 100).toFixed(2)}% sobre o patrimônio)`
          }
        />
      </div>

      {incomeGoal > 0 && (
        <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3.5">
          <p className="font-semibold text-foreground text-xs">
            Para viver com {formatCurrency(incomeGoal)} por mês
          </p>
          <IncomeRow
            label={`Com o yield atual de proventos (${(currentYield * 100).toFixed(2)}% a.a.)`}
            requiredWealth={wealthForIncomeByYield}
            input={input}
            emptyText="Sem proventos nos últimos 12 meses para estimar"
          />
          <IncomeRow
            label="Pela regra dos 4% (retirada anual do patrimônio)"
            requiredWealth={wealthForIncomeBy4}
            input={input}
          />
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="projection-wealth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)', strokeOpacity: 0.5 }}
            interval={isMobile ? 'preserveStartEnd' : horizon > 10 ? 1 : 0}
            dy={10}
          />
          <YAxis
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={compactCurrency}
            width={isMobile ? 60 : 75}
          />
          <Tooltip
            content={<ProjectionTooltip />}
            wrapperStyle={{ outline: 'none' }}
            cursor={{ stroke: 'var(--muted-foreground)', strokeOpacity: 0.3 }}
          />
          {wealthGoal > 0 && (
            <ReferenceLine
              y={wealthGoal}
              stroke="var(--chart-4)"
              strokeDasharray="6 4"
              label={{
                value: 'Meta',
                position: 'insideTopLeft',
                fill: 'var(--chart-4)',
                fontSize: 11
              }}
            />
          )}
          <Area
            type="monotone"
            dataKey="invested"
            stroke="var(--chart-2)"
            strokeWidth={2}
            fill="none"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="wealth"
            stroke="var(--chart-1)"
            strokeWidth={3}
            fill="url(#projection-wealth)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-border/50 border-t pt-4">
        <Legend color="var(--chart-1)" label="Patrimônio projetado" />
        <Legend color="var(--chart-2)" label="Total aportado" />
        {wealthGoal > 0 && <Legend color="var(--chart-4)" label="Meta" />}
      </div>

      <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground leading-relaxed">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Simulação em valores nominais, sem descontar a inflação: com IPCA de 4%
        ao ano, R$ 1 milhão daqui a 20 anos compra o mesmo que uns R$ 456 mil
        hoje. Para uma visão em poder de compra, use uma rentabilidade real
        (descontada a inflação). Rentabilidade passada não garante a futura.
      </p>
    </div>
  )
}

function goalReach(target: number, input: ProjectionInput) {
  const months = monthsToReach(target, input)

  if (months === null) return 'Não alcança em 100 anos'
  if (months === 0) return 'Já alcançada'

  return `${formatDuration(months)} (${reachDate(months)})`
}

interface FieldProps {
  id: string
  label: string
  hint: { text: string; onReset?: () => void }
  children: React.ReactNode
}

function Field({ id, label, hint, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="font-medium text-[11px] text-muted-foreground"
      >
        {label}
      </label>
      {children}
      <p className="text-[11px] text-muted-foreground">
        {hint.text}
        {hint.onReset && (
          <>
            {' · '}
            <button
              type="button"
              onClick={hint.onReset}
              className="cursor-pointer text-primary underline-offset-2 hover:underline"
            >
              usar
            </button>
          </>
        )}
      </p>
    </div>
  )
}

interface HighlightProps {
  icon: typeof TrendingUp
  title: string
  value: string
  description: string
}

function Highlight({ icon: Icon, title, value, description }: HighlightProps) {
  return (
    <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3.5">
      <span className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <Icon className="size-3.5" />
        {title}
      </span>
      <p className="font-bold text-foreground text-sm tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{description}</p>
    </div>
  )
}

interface IncomeRowProps {
  label: string
  requiredWealth: number | null
  input: ProjectionInput
  emptyText?: string
}

function IncomeRow({
  label,
  requiredWealth,
  input,
  emptyText
}: IncomeRowProps) {
  return (
    <div className="flex flex-col gap-0.5 text-xs sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground">{label}</span>
      {requiredWealth === null ? (
        <span className="text-muted-foreground">{emptyText}</span>
      ) : (
        <span className="tabular-nums">
          <span className="font-semibold text-foreground">
            {formatCurrency(requiredWealth)}
          </span>
          <span className="text-muted-foreground">
            {' · '}
            {goalReach(requiredWealth, input)}
          </span>
        </span>
      )}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="size-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-muted-foreground text-xs">{label}</span>
    </div>
  )
}

interface ProjectionTooltipProps {
  active?: boolean
  label?: string
  payload?: Array<{ payload: { wealth: number; invested: number } }>
}

function ProjectionTooltip({ active, payload, label }: ProjectionTooltipProps) {
  if (!active || !payload?.length) return null

  const { wealth, invested } = payload[0].payload

  return (
    <div className="rounded-xl border border-border/50 bg-popover/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="mb-2 font-semibold text-popover-foreground text-sm">
        {label === 'Hoje' ? 'Hoje' : `Daqui a ${label?.replace('a', '')} anos`}
      </p>
      <div className="space-y-1 text-xs">
        <TooltipRow color="var(--chart-1)" label="Patrimônio" value={wealth} />
        <TooltipRow color="var(--chart-2)" label="Aportado" value={invested} />
        <TooltipRow
          label="Rendimento"
          value={Math.max(wealth - invested, 0)}
          className="border-border/50 border-t pt-1"
        />
      </div>
    </div>
  )
}

function TooltipRow({
  color,
  label,
  value,
  className
}: {
  color?: string
  label: string
  value: number
  className?: string
}) {
  return (
    <div className={cn('flex items-center justify-between gap-6', className)}>
      <span className="flex items-center gap-2 text-muted-foreground">
        {color && (
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
        )}
        {label}
      </span>
      <span className="font-medium tabular-nums">{formatCurrency(value)}</span>
    </div>
  )
}
