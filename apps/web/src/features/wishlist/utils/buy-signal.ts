import type { PriceHistoryPoint } from '@/features/assets/api/types'
import { getTargetPriceInfo } from '@/features/wishlist/utils/target-price'
import { calcPercentageChange } from '@/shared/utils/format-percentage'

/** Até quantos % acima do alvo o preço ainda é considerado "perto" */
export const NEAR_TARGET_THRESHOLD = 5

export type BuyVerdict = 'BUY' | 'NEAR' | 'WAIT' | 'NO_TARGET' | 'NO_QUOTE'

export const BUY_VERDICT_INFO: Record<
  BuyVerdict,
  { label: string; description: string }
> = {
  BUY: {
    label: 'Momento de compra',
    description: 'A cotação está no seu preço alvo ou abaixo dele.'
  },
  NEAR: {
    label: 'Perto do alvo',
    description: 'Falta pouco para atingir o preço alvo. Fique de olho.'
  },
  WAIT: {
    label: 'Vale esperar',
    description: 'A cotação ainda está acima do seu preço alvo.'
  },
  NO_TARGET: {
    label: 'Sem preço alvo',
    description:
      'Defina um preço alvo para saber quando comprar. Use o histórico como referência.'
  },
  NO_QUOTE: {
    label: 'Aguardando cotação',
    description: 'A cotação atual ainda não foi carregada.'
  }
}

export function getBuyVerdict(
  currentPrice: number | null | undefined,
  targetPrice: number | null | undefined
): BuyVerdict {
  const { hasTarget, isAtOrBelowTarget, distancePercentage } =
    getTargetPriceInfo(currentPrice, targetPrice)

  if (currentPrice == null) return 'NO_QUOTE'
  if (!hasTarget) return 'NO_TARGET'
  if (isAtOrBelowTarget) return 'BUY'
  if (distancePercentage != null && distancePercentage <= NEAR_TARGET_THRESHOLD)
    return 'NEAR'
  return 'WAIT'
}

export interface RangeMetrics {
  min: number
  max: number
  average: number
  /** Posição da cotação entre a mínima (0) e a máxima (100) do período */
  position: number
  /** Cotação vs. máxima do período, em % (sempre ≤ 0 quando no topo/abaixo) */
  fromHigh: number
  /** Cotação vs. mínima do período, em % */
  fromLow: number
  /** Cotação vs. média do período, em % */
  fromAverage: number
}

/** Posição da cotação dentro da faixa de preços do período do histórico */
export function calcRangeMetrics(
  points: PriceHistoryPoint[] | undefined,
  currentPrice: number | null | undefined
): RangeMetrics | null {
  if (!points || points.length === 0) return null

  const closes = points.map((point) => point.close)
  const price = currentPrice ?? closes[closes.length - 1]
  // A cotação atual pode estar fora da faixa (histórico defasado)
  const min = Math.min(...closes, price)
  const max = Math.max(...closes, price)
  const average = closes.reduce((sum, close) => sum + close, 0) / closes.length

  return {
    min,
    max,
    average,
    position: max === min ? 50 : ((price - min) / (max - min)) * 100,
    fromHigh: calcPercentageChange(price, max),
    fromLow: calcPercentageChange(price, min),
    fromAverage: calcPercentageChange(price, average)
  }
}
