import { Activity, Landmark, LineChart, TrendingUp } from 'lucide-react'

import { StatCard } from '@/features/dashboard/components/StatCard'
import { formatPercentage } from '@/shared/utils/format-percentage'

import type { PerformancePeriodSummary } from '../../api/types'

interface PerformanceSummaryProps {
  summary: PerformancePeriodSummary
  betaIbov: number | null
}

function formatAlpha(alpha: number | null): string {
  if (alpha === null) return '—'

  return `${alpha >= 0 ? '+' : ''}${alpha.toFixed(2)} p.p.`
}

function describeBeta(beta: number): string {
  if (beta < 0.8) return 'Defensiva: oscila menos que o Ibovespa'
  if (beta > 1.2) return 'Agressiva: oscila mais que o Ibovespa'
  return 'Alinhada ao Ibovespa'
}

export function PerformanceSummary({
  summary,
  betaIbov
}: PerformanceSummaryProps) {
  const benchmarks = [
    {
      title: 'Contra o CDI',
      icon: Landmark,
      alpha: summary.alphaCdi,
      benchmark: summary.cdi
    },
    {
      title: 'Contra o Ibovespa',
      icon: LineChart,
      alpha: summary.alphaIbov,
      benchmark: summary.ibov
    },
    {
      title: 'Contra o S&P 500 (R$)',
      icon: TrendingUp,
      alpha: summary.alphaSp500,
      benchmark: summary.sp500
    }
  ]

  return (
    <div
      data-slot="performance-summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <StatCard
        title="Sua carteira"
        value={formatPercentage(summary.portfolio)}
        icon={Activity}
        variant="trend"
        trendUp={summary.portfolio >= 0}
        subtitle={`${summary.months} ${summary.months === 1 ? 'mês' : 'meses'} no período`}
      />

      {benchmarks.map(({ title, icon, alpha, benchmark }) => (
        <StatCard
          key={title}
          title={title}
          value={formatAlpha(alpha)}
          icon={icon}
          variant="trend"
          trendUp={alpha === null ? undefined : alpha >= 0}
          subtitle={
            benchmark === null
              ? 'Dados do benchmark indisponíveis no período'
              : `Benchmark: ${formatPercentage(benchmark)}`
          }
        />
      ))}

      {betaIbov !== null && (
        <StatCard
          title="Beta vs Ibovespa"
          value={betaIbov.toFixed(2)}
          icon={Activity}
          subtitle={describeBeta(betaIbov)}
        />
      )}
    </div>
  )
}
