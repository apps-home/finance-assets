import type { AssetWithCategory } from '@/features/assets/api/types'
import {
  calcMonthChange,
  calcPercentageChange
} from '@/shared/utils/format-percentage'

export interface AssetMetrics {
  monthChange: number | null
  monthDiffValue: number | null
  /** Cotação atual vs. preço médio, em % */
  pmDiffPercent: number | null
  pmDiffValue: number | null
  hasProfitLoss: boolean
  isPositivePL: boolean
  isNegativePL: boolean
}

export function calcAssetMetrics(asset: AssetWithCategory): AssetMetrics {
  const { currentClosePrice, lastMonthClosePrice, averagePrice, profitLoss } =
    asset

  const monthChange = calcMonthChange(currentClosePrice, lastMonthClosePrice)
  const monthDiffValue =
    currentClosePrice != null && lastMonthClosePrice != null
      ? currentClosePrice - lastMonthClosePrice
      : null

  const canCompareWithPM =
    averagePrice != null && averagePrice > 0 && currentClosePrice != null
  const pmDiffPercent = canCompareWithPM
    ? calcPercentageChange(currentClosePrice, averagePrice)
    : null
  const pmDiffValue = canCompareWithPM ? currentClosePrice - averagePrice : null

  const hasProfitLoss = profitLoss != null && profitLoss !== 0

  return {
    monthChange,
    monthDiffValue,
    pmDiffPercent,
    pmDiffValue,
    hasProfitLoss,
    isPositivePL: hasProfitLoss && profitLoss > 0,
    isNegativePL: hasProfitLoss && profitLoss < 0
  }
}
