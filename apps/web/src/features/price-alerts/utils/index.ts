import type { PriceAlertDirection } from '../api/types'

export const DIRECTION_LABELS: Record<PriceAlertDirection, string> = {
  ABOVE: 'Subir até',
  BELOW: 'Cair até'
}

/**
 * Mesma regra do backend: alvo acima da cotação avisa na alta; abaixo, na
 * queda. Null quando ainda não dá para criar (sem cotação ou alvo igual).
 */
export function inferDirection(
  targetPrice: number,
  currentPrice: number | null
): PriceAlertDirection | null {
  if (currentPrice == null || !(targetPrice > 0)) return null
  if (targetPrice === currentPrice) return null

  return targetPrice > currentPrice ? 'ABOVE' : 'BELOW'
}

/** Quanto a cotação ainda precisa andar até o alvo, em % (negativo = cair) */
export function distanceToTarget(
  targetPrice: number,
  currentPrice: number | null
): number | null {
  if (currentPrice == null || currentPrice === 0) return null

  return (targetPrice / currentPrice - 1) * 100
}
