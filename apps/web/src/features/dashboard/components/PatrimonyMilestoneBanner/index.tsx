'use client'

import { Skeleton } from '@lib/ui/components/skeleton'
import { cn } from '@lib/ui/lib/utils'
import { CheckCircle2, Flag, Target } from 'lucide-react'
import Link from 'next/link'

import { useProjectionBaseline } from '@/features/performance/hooks/use-projection-baseline'
import {
  formatDuration,
  reachDate
} from '@/features/performance/utils/projection'
import { formatCurrency } from '@/shared/utils/format-currency'

import {
  DEFAULT_MILESTONE_RETURN_PCT,
  EXTRA_CONTRIBUTION_SIMULATION,
  getMilestoneProgress,
  PATRIMONY_MILESTONES,
  projectMilestone
} from '../../utils/milestones'

const compactCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value)

interface PatrimonyMilestoneBannerProps {
  /** Saldo físico líquido somado quando o escopo está em "Patrimônio Completo (Net Worth)" */
  extraNetBalance?: number
}

export function PatrimonyMilestoneBanner({
  extraNetBalance = 0
}: PatrimonyMilestoneBannerProps) {
  const baseline = useProjectionBaseline()

  if (baseline.isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />
  }

  const wealth = baseline.currentWealth + extraNetBalance
  if (wealth <= 0) return null

  const progress = getMilestoneProgress(wealth)
  const returnPct = baseline.historicalReturnPct ?? DEFAULT_MILESTONE_RETURN_PCT
  const contribution = Math.max(baseline.averageContribution, 0)

  const financialTarget =
    progress.next === null ? null : Math.max(progress.next - extraNetBalance, 0)

  const projection =
    financialTarget === null
      ? null
      : projectMilestone(financialTarget, {
          initial: baseline.currentWealth,
          monthlyContribution: contribution,
          annualReturnPct: returnPct
        })

  return (
    <section
      data-slot="patrimony-milestone-banner"
      aria-label="Marcos patrimoniais"
      className="space-y-4 rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Flag className="size-4.5" />
          </div>
          <div>
            <h2 className="font-semibold text-xl">Marcos patrimoniais</h2>
            <p className="text-muted-foreground text-xs">
              {progress.next === null
                ? 'Você conquistou todos os marcos da escada'
                : `${compactCurrency(wealth)} / ${compactCurrency(progress.next)} rumo ao próximo marco`}
            </p>
          </div>
        </div>
        <Link
          href="/performance"
          className="text-primary text-xs underline-offset-2 hover:underline"
        >
          Ajustar projeção
        </Link>
      </div>

      <div className="space-y-2">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress.progressPct)}
          className="relative h-3 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${progress.progressPct}%` }}
          />
          {progress.last !== null && progress.next !== null && (
            <span
              className="absolute inset-y-0 w-0.5 bg-background/80"
              style={{ left: `${progress.lastMarkerPct}%` }}
            />
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            {progress.last !== null
              ? `Último marco: ${formatCurrency(progress.last)}`
              : 'Nenhum marco conquistado ainda'}
          </span>
          {progress.next !== null && (
            <span className="flex items-center gap-1.5 font-medium text-foreground tabular-nums">
              <Target className="size-3.5 text-primary" />
              {progress.progressPct.toFixed(1)}% · faltam{' '}
              {formatCurrency(progress.remaining)}
            </span>
          )}
        </div>
      </div>

      <ol className="flex flex-wrap gap-1.5" aria-label="Escada de marcos">
        {PATRIMONY_MILESTONES.map((value) => {
          const achieved = progress.achieved.includes(value)
          const isNext = value === progress.next

          return (
            <li
              key={value}
              className={cn(
                'rounded-full border px-2.5 py-0.5 font-medium text-[11px] tabular-nums',
                achieved &&
                  'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                isNext && 'border-primary bg-primary/10 text-primary',
                !achieved && !isNext && 'border-border text-muted-foreground'
              )}
            >
              {compactCurrency(value)}
            </li>
          )
        })}
      </ol>

      {projection && progress.next !== null && (
        <div className="space-y-1 rounded-lg border border-border/60 bg-muted/20 p-3.5 text-xs">
          {projection.months === null ? (
            <p className="text-muted-foreground">
              Com o ritmo atual, {formatCurrency(progress.next)} não é alcançado
              em 100 anos. Aumente o aporte para destravar a estimativa.
            </p>
          ) : (
            <p className="text-foreground">
              Estimativa para {formatCurrency(progress.next)}:{' '}
              <strong>{reachDate(projection.months)}</strong> (em{' '}
              {formatDuration(projection.months)}) mantendo aporte médio de{' '}
              {formatCurrency(contribution)}/mês.
            </p>
          )}
          {projection.monthsSaved !== null && projection.monthsSaved > 0 && (
            <p className="text-muted-foreground">
              Com +{formatCurrency(EXTRA_CONTRIBUTION_SIMULATION)}/mês de
              aporte, você antecipa em {formatDuration(projection.monthsSaved)}.
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            Rentabilidade de {returnPct.toFixed(1)}% a.a.{' '}
            {baseline.historicalReturnPct != null
              ? '(histórica da carteira)'
              : '(padrão: menos de 12 meses de histórico)'}
            , valores nominais.
          </p>
        </div>
      )}
    </section>
  )
}
