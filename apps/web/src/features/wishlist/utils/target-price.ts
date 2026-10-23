export function getTargetPriceInfo(
  currentPrice: number | null | undefined,
  targetPrice: number | null | undefined
) {
  if (targetPrice == null || targetPrice <= 0) {
    return {
      hasTarget: false,
      isAtOrBelowTarget: false,
      isAboveTarget: false,
      distancePercentage: null
    }
  }

  if (currentPrice == null) {
    return {
      hasTarget: true,
      isAtOrBelowTarget: false,
      isAboveTarget: false,
      distancePercentage: null
    }
  }

  return {
    hasTarget: true,
    isAtOrBelowTarget: currentPrice <= targetPrice,
    isAboveTarget: currentPrice > targetPrice,
    // Distância em % do preço atual para o alvo
    distancePercentage: ((currentPrice - targetPrice) / targetPrice) * 100
  }
}

export const TARGET_STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todas as Situações' },
  { value: 'BELOW_OR_AT_TARGET', label: 'No Preço / Abaixo do Alvo' },
  { value: 'ABOVE_TARGET', label: 'Acima do Alvo' },
  { value: 'NO_TARGET', label: 'Sem Alvo Definido' }
]
