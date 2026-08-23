'use client'

import {
  Briefcase,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react'

import { Card, CardContent } from '@/shared/components/ui/card'
import { cn } from '@/shared/lib/utils'
import { formatCurrency } from '@/shared/utils/format-currency'
import { formatPercentage } from '@/shared/utils/format-percentage'

import type { AssetWithCategory } from '../../types'

interface AssetSummaryCardsProps {
  assets: AssetWithCategory[]
  className?: string
}

export function AssetSummaryCards({
  assets,
  className
}: AssetSummaryCardsProps) {
  const activeAssets = assets.filter((a) => a.isActive)

  const totalInvested = activeAssets.reduce(
    (sum, a) => sum + (a.investedValue || 0),
    0
  )
  const totalBalance = activeAssets.reduce(
    (sum, a) => sum + (a.currentBalance || 0),
    0
  )
  const totalProfitLoss = activeAssets.reduce(
    (sum, a) => sum + (a.profitLoss || 0),
    0
  )
  const totalProfitPercentage =
    totalInvested > 0
      ? ((totalBalance - totalInvested) / totalInvested) * 100
      : 0

  const totalCount = assets.length
  const activeCount = activeAssets.length
  const inactiveCount = totalCount - activeCount

  const isProfitPositive = totalProfitLoss > 0
  const isProfitNegative = totalProfitLoss < 0

  return (
    <div
      data-slot="asset-summary-cards"
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-xs">
              Total Investido
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <p className="font-bold text-foreground text-xl tabular-nums">
              {formatCurrency(totalInvested)}
            </p>
            <p className="text-muted-foreground text-xs">
              Custo total de aquisição
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-xs">
              Saldo Atual
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Wallet className="size-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <p className="font-bold text-foreground text-xl tabular-nums">
              {formatCurrency(totalBalance)}
            </p>
            <p className="text-muted-foreground text-xs">
              Posição consolidada a mercado
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-xs">
              Lucro / Prejuízo
            </span>
            <div
              className={cn(
                'flex size-8 items-center justify-center rounded-lg',
                isProfitPositive &&
                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                isProfitNegative &&
                  'bg-red-500/10 text-red-600 dark:text-red-400',
                !isProfitPositive &&
                  !isProfitNegative &&
                  'bg-muted text-muted-foreground'
              )}
            >
              {isProfitPositive ? (
                <TrendingUp className="size-4" />
              ) : isProfitNegative ? (
                <TrendingDown className="size-4" />
              ) : (
                <TrendingUp className="size-4" />
              )}
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex items-baseline gap-2">
              <p
                className={cn(
                  'font-bold text-xl tabular-nums',
                  isProfitPositive && 'text-emerald-600 dark:text-emerald-400',
                  isProfitNegative && 'text-red-600 dark:text-red-400',
                  !isProfitPositive && !isProfitNegative && 'text-foreground'
                )}
              >
                {totalProfitLoss > 0 ? '+' : ''}
                {formatCurrency(totalProfitLoss)}
              </p>
              {totalProfitPercentage !== 0 && (
                <span
                  className={cn(
                    'font-semibold text-xs tabular-nums',
                    isProfitPositive &&
                      'text-emerald-600 dark:text-emerald-400',
                    isProfitNegative && 'text-red-600 dark:text-red-400'
                  )}
                >
                  {formatPercentage(totalProfitPercentage)}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Retorno total acumulado
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-xs">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-muted-foreground text-xs">
              Total de Ativos
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="size-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <p className="font-bold text-foreground text-xl tabular-nums">
              {totalCount}
            </p>
            <p className="text-muted-foreground text-xs">
              {activeCount} em carteira{' '}
              {inactiveCount > 0 ? `• ${inactiveCount} inativo(s)` : ''}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
